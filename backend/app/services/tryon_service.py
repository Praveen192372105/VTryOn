import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    OutfitInactiveError,
    OutfitNotFoundError,
    QueueSubmissionError,
    ResourceConflictError,
    ResultNotFoundError,
    SystemTryOnCapacityUnavailableError,
    TryOnJobNotFoundError,
    UploadNotFoundError,
    UserTryOnCapacityExceededError,
)
from app.core.redis import redis_admission_lock
from app.domain.enums import TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.domain.ownership import CurrentUser, ensure_tryon_deletable
from app.repositories.outfit_repository import OutfitRepository
from app.repositories.tryon_repository import TryOnRepository
from app.repositories.upload_repository import UploadRepository
from app.schemas.pagination import PaginatedData, PaginationParams, calculate_pagination
from app.schemas.tryon import (
    CreateTryOnRequest,
    TryOnErrorResponse,
    TryOnListItem,
    TryOnOutfitSummary,
    TryOnQueryFilter,
    TryOnResponse,
    TryOnResultResponse,
    TryOnResultSummary,
)
from app.storage.base import MediaStorage
from app.storage.local import default_storage
from app.workers.dispatchers import CeleryTryOnJobDispatcher, TryOnJobDispatcher

logger = logging.getLogger("vtryon.services.tryon")


class TryOnService:
    """
    Application service orchestrating the submission, status tracking, result retrieval,
    and deletion of virtual try-on jobs.
    Enforces the critical invariant: Durable MySQL job created BEFORE Celery dispatch.
    """

    def __init__(
        self,
        db: Session,
        storage: Optional[MediaStorage] = None,
        dispatcher: Optional[TryOnJobDispatcher] = None,
    ):
        self.db = db
        self.storage = storage or default_storage
        self.dispatcher = dispatcher or CeleryTryOnJobDispatcher()
        self.tryon_repo = TryOnRepository(db)
        self.upload_repo = UploadRepository(db)
        self.outfit_repo = OutfitRepository(db)

    def create_job(
        self,
        user: CurrentUser,
        payload: CreateTryOnRequest,
        idempotency_key: Optional[str] = None,
    ) -> TryOnResponse:
        """
        Create and enqueue a new virtual try-on job for asynchronous Celery execution.
        Supports client Idempotency-Key header:
        - Same user + same key + same payload -> idempotent replay returning existing job.
        - Same user + same key + different payload -> 409 Conflict.
        - New key -> enforces capacity admission, creates durable MySQL record, and dispatches Celery task.
        """
        logger.info(
            f"Try-on requested by user '{user.public_id}' with upload '{payload.person_upload_id}' and outfit '{payload.outfit_id}'",
            extra={
                "event": "tryon.create.requested",
                "user_id": user.public_id,
                "upload_id": payload.person_upload_id,
                "outfit_id": payload.outfit_id,
                "idempotency_key": idempotency_key,
            },
        )

        # 0. Check Idempotency Replay
        if idempotency_key:
            existing = self.tryon_repo.get_by_user_and_idempotency_key(user.id, idempotency_key)
            if existing:
                existing_upload_id = existing.person_upload.public_id if existing.person_upload else ""
                existing_outfit_id = existing.outfit.public_id if existing.outfit else ""
                if existing_upload_id == payload.person_upload_id and existing_outfit_id == payload.outfit_id:
                    logger.info(
                        f"Idempotent replay for job '{existing.public_id}' with key '{idempotency_key}'",
                        extra={"event": "tryon.idempotent_replay", "job_id": existing.public_id},
                    )
                    return self._to_job_response(existing)
                else:
                    raise ResourceConflictError(
                        "IDEMPOTENCY_KEY_REUSED: The provided Idempotency-Key was already used for a different request payload."
                    )

        # 1. Validate owned person upload
        upload = self.upload_repo.get_by_public_id_and_user_id(
            public_id=payload.person_upload_id,
            user_id=user.id,
        )
        if not upload:
            raise UploadNotFoundError("Person upload image not found or not owned by the current user.")

        if upload.status != UploadStatus.ACTIVE:
            raise ResourceConflictError("Cannot create try-on with an inactive or deleted person upload.")

        # 2. Validate active catalogue outfit
        outfit = self.outfit_repo.get_by_public_id(payload.outfit_id)
        if not outfit:
            raise OutfitNotFoundError(f"Outfit with ID '{payload.outfit_id}' not found.")

        if not outfit.is_active:
            raise OutfitInactiveError(f"Outfit '{payload.outfit_id}' is currently inactive.")

        # 3. Concurrency-Safe Admission Control & Durable Job Persistence
        admission_lock_key = f"vtryon:lock:user:{user.public_id}:tryon-admission"
        with redis_admission_lock(admission_lock_key, ttl_seconds=settings.ADMISSION_LOCK_TTL_SECONDS):
            # Authoritative Check A: User Active Try-On Capacity (QUEUED or PROCESSING)
            active_jobs = self.tryon_repo.count_active_jobs_for_user(user.id)
            if active_jobs >= settings.MAX_ACTIVE_TRYONS_PER_USER:
                logger.warning(
                    f"User '{user.public_id}' exceeded active try-on capacity ({active_jobs}/{settings.MAX_ACTIVE_TRYONS_PER_USER})",
                    extra={"event": "tryon.capacity_rejected", "user_id": user.public_id, "active_jobs": active_jobs},
                )
                raise UserTryOnCapacityExceededError(
                    f"You already have the maximum number of active virtual try-ons ({settings.MAX_ACTIVE_TRYONS_PER_USER}). "
                    "Please wait for them to complete."
                )

            # Authoritative Check B: Global Queued Try-On Capacity
            queued_jobs = self.tryon_repo.count_queued_jobs_global()
            if queued_jobs >= settings.MAX_QUEUED_TRYONS_GLOBAL:
                logger.warning(
                    f"Global queued try-ons capacity exceeded ({queued_jobs}/{settings.MAX_QUEUED_TRYONS_GLOBAL})",
                    extra={"event": "tryon.global_capacity_rejected", "queued_jobs": queued_jobs},
                )
                raise SystemTryOnCapacityUnavailableError(
                    "The virtual try-on processing queue is currently at capacity. Please try again shortly."
                )

            job_public_id = generate_public_id(ResourcePrefix.TRYON_JOB)
            job = self.tryon_repo.create_job(
                public_id=job_public_id,
                user_id=user.id,
                upload_id=upload.id,
                outfit_id=outfit.id,
                idempotency_key=idempotency_key,
            )
            self.db.commit()

        logger.info(
            f"Durable try-on job '{job_public_id}' persisted in MySQL with status 'QUEUED'",
            extra={"event": "tryon.job.persisted", "job_id": job_public_id},
        )

        # 4. Enqueue Celery Task (Passing ONLY job_public_id)
        try:
            task_id = self.dispatcher.dispatch(job_public_id)
            if task_id:
                self.tryon_repo.set_celery_task_id(job_public_id, task_id)
                self.db.commit()
        except QueueSubmissionError as exc:
            # Queue Failure Compensation: Mark job as FAILED immediately
            logger.error(
                f"Queue dispatch failed for job '{job_public_id}'. Compensating by marking job FAILED.",
                extra={"event": "tryon.queue.compensation", "job_id": job_public_id},
            )
            self.tryon_repo.mark_failed(
                public_id=job_public_id,
                failure_code="QUEUE_SUBMISSION_FAILED",
                failure_reason="The processing queue was unavailable at submission time.",
            )
            self.db.commit()
            raise

        return TryOnResponse(
            id=job_public_id,
            status=TryOnJobStatus.QUEUED.value.lower(),
            person_upload_id=payload.person_upload_id,
            outfit_id=payload.outfit_id,
            result=None,
            error=None,
            idempotency_key=idempotency_key,
            created_at=job.created_at,
            started_at=None,
            finished_at=None,
        )

    def _to_job_response(self, job) -> TryOnResponse:
        """Convert a TryOnJob model to canonical TryOnResponse DTO."""
        result_dto: Optional[TryOnResultResponse] = None
        status_normalized = (
            job.status.value.lower() if hasattr(job.status, "value") else str(job.status).lower()
        )

        if status_normalized == TryOnJobStatus.SUCCEEDED.value.lower() and hasattr(job, "result") and job.result:
            result_dto = TryOnResultResponse(
                id=job.result.public_id,
                image_url=f"/api/v1/try-ons/{job.public_id}/content",
                width=job.result.width,
                height=job.result.height,
                mime_type=getattr(job.result, "mime_type", "image/jpeg") or "image/jpeg",
                model_version=getattr(job.result, "model_version", None),
                inference_config_version=getattr(job.result, "inference_config_version", None),
                created_at=job.result.created_at,
            )

        err_dto: Optional[TryOnErrorResponse] = None
        if status_normalized == TryOnJobStatus.FAILED.value.lower() and job.error_code:
            err_dto = TryOnErrorResponse(
                code=job.error_code,
                message=job.error_message or "Virtual try-on processing failed.",
            )

        upload_id = job.person_upload.public_id if hasattr(job, "person_upload") and job.person_upload else ""
        outfit_id = job.outfit.public_id if hasattr(job, "outfit") and job.outfit else ""

        return TryOnResponse(
            id=job.public_id,
            status=status_normalized,
            person_upload_id=upload_id,
            outfit_id=outfit_id,
            result=result_dto,
            error=err_dto,
            idempotency_key=getattr(job, "idempotency_key", None),
            created_at=job.created_at,
            started_at=job.started_at,
            finished_at=job.finished_at,
        )

    def get_job(self, user: CurrentUser, job_id: str) -> TryOnResponse:
        """
        Retrieve authoritative try-on job status and result from MySQL.
        Private results deliver an authenticated content URL, not raw filesystem storage keys.
        """
        job = self.tryon_repo.get_by_public_id_and_user_id(
            public_id=job_id,
            user_id=user.id,
        )
        if not job:
            raise TryOnJobNotFoundError(f"Try-on job '{job_id}' was not found.")

        return self._to_job_response(job)

    def list_jobs(
        self,
        user: CurrentUser,
        filters: TryOnQueryFilter,
        pagination: PaginationParams,
    ) -> PaginatedData[TryOnListItem]:
        """
        List paginated try-on history for the authenticated user, ordered newest first.
        """
        jobs, total = self.tryon_repo.list_by_user_id(
            user_id=user.id,
            pagination=pagination,
            status=filters.status,
        )

        items = []
        for j in jobs:
            status_norm = j.status.value.lower() if hasattr(j.status, "value") else str(j.status).lower()

            outfit_summary = None
            if hasattr(j, "outfit") and j.outfit:
                cat_val = (
                    j.outfit.category.value
                    if hasattr(j.outfit.category, "value")
                    else str(j.outfit.category)
                )
                outfit_summary = TryOnOutfitSummary(
                    id=j.outfit.public_id,
                    name=j.outfit.name,
                    category=cat_val,
                    thumbnail_url=self.storage.get_url(j.outfit.storage_key) if hasattr(j.outfit, "storage_key") else None,
                )

            result_summary = None
            if status_norm == TryOnJobStatus.SUCCEEDED.value.lower() and hasattr(j, "result") and j.result:
                result_summary = TryOnResultSummary(
                    id=j.result.public_id,
                    image_url=f"/api/v1/try-ons/{j.public_id}/content",
                    width=j.result.width,
                    height=j.result.height,
                )

            err_summary = None
            if status_norm == TryOnJobStatus.FAILED.value.lower() and j.error_code:
                err_summary = TryOnErrorResponse(
                    code=j.error_code,
                    message=j.error_message or "Virtual try-on processing failed.",
                )

            items.append(
                TryOnListItem(
                    id=j.public_id,
                    status=status_norm,
                    person_upload_id=j.person_upload.public_id if hasattr(j, "person_upload") and j.person_upload else "upl_unknown",
                    outfit=outfit_summary,
                    result=result_summary,
                    error=err_summary,
                    created_at=j.created_at,
                    started_at=j.started_at,
                    finished_at=j.finished_at,
                )
            )

        meta = calculate_pagination(total=total, page=pagination.page, page_size=pagination.page_size)
        return PaginatedData(items=items, pagination=meta)

    def get_result_content(self, user: CurrentUser, job_id: str) -> Tuple[bytes, str]:
        """
        Retrieve binary media bytes for an authenticated owner's completed try-on result.
        Returns (image_bytes, mime_type).
        """
        job = self.tryon_repo.get_by_public_id_and_user_id(
            public_id=job_id,
            user_id=user.id,
        )
        if not job:
            raise TryOnJobNotFoundError(f"Try-on job '{job_id}' was not found.")

        status_normalized = (
            job.status.value.lower() if hasattr(job.status, "value") else str(job.status).lower()
        )
        if status_normalized != TryOnJobStatus.SUCCEEDED.value.lower() or not hasattr(job, "result") or not job.result:
            raise ResultNotFoundError(f"Virtual try-on result is not ready or does not exist for job '{job_id}'.")

        storage_key = job.result.storage_key
        try:
            image_bytes = self.storage.get(storage_key)
        except Exception as exc:
            logger.error(f"Failed to load result image from storage key '{storage_key}': {str(exc)}")
            raise ResultNotFoundError(f"Virtual try-on result image could not be loaded.") from exc

        mime_type = getattr(job.result, "mime_type", "image/jpeg") or "image/jpeg"
        return image_bytes, mime_type

    def delete_job(self, user: CurrentUser, job_id: str) -> bool:
        """
        Delete a completed try-on job and associated results.
        Rejects deletion of active (QUEUED or PROCESSING) jobs with 409 TRYON_JOB_IN_PROGRESS.
        """
        job = self.tryon_repo.get_by_public_id_and_user_id(
            public_id=job_id,
            user_id=user.id,
        )
        if not job:
            raise TryOnJobNotFoundError(f"Try-on job '{job_id}' was not found.")

        ensure_tryon_deletable(job.status, job_id)

        # Delete result file from storage if present
        if hasattr(job, "result") and job.result and job.result.storage_key:
            try:
                self.storage.delete(job.result.storage_key)
            except Exception as exc:
                logger.warning(f"Could not delete result file '{job.result.storage_key}': {str(exc)}")

        deleted = self.tryon_repo.delete_job(job_id, user.id)
        self.db.commit()
        return deleted


__all__ = ["TryOnService"]
