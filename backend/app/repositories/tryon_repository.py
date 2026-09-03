from typing import Any, List, Optional, Tuple
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload

from app.domain.enums import TryOnJobStatus
from app.db.models.tryon import TryOnJob, TryOnResult
from app.schemas.pagination import PaginationParams
from app.utils.time import utc_now


class TryOnRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_public_id(self, public_id: str) -> Optional[TryOnJob]:
        return self.db.execute(
            select(TryOnJob)
            .options(
                joinedload(TryOnJob.person_upload),
                joinedload(TryOnJob.outfit),
                joinedload(TryOnJob.result),
                joinedload(TryOnJob.user),
            )
            .where(TryOnJob.public_id == public_id)
        ).scalar_one_or_none()

    def get_by_id(self, job_id: int) -> Optional[TryOnJob]:
        return self.db.execute(
            select(TryOnJob)
            .options(
                joinedload(TryOnJob.person_upload),
                joinedload(TryOnJob.outfit),
                joinedload(TryOnJob.result),
                joinedload(TryOnJob.user),
            )
            .where(TryOnJob.id == job_id)
        ).scalar_one_or_none()

    def get_by_public_id_and_user_id(self, public_id: str, user_id: int) -> Optional[TryOnJob]:
        return self.db.execute(
            select(TryOnJob)
            .options(
                joinedload(TryOnJob.person_upload),
                joinedload(TryOnJob.outfit),
                joinedload(TryOnJob.result),
            )
            .where(TryOnJob.public_id == public_id, TryOnJob.user_id == user_id)
        ).scalar_one_or_none()

    # Aliases for Phase 5 Section 86
    get_for_user = get_by_public_id_and_user_id

    def list_by_user_id(
        self,
        user_id: int,
        pagination: PaginationParams,
        status: Optional[TryOnJobStatus] = None,
    ) -> Tuple[List[TryOnJob], int]:
        count_stmt = select(func.count(TryOnJob.id)).where(TryOnJob.user_id == user_id)
        if status:
            count_stmt = count_stmt.where(TryOnJob.status == status.value if hasattr(status, "value") else str(status))
        total = self.db.scalar(count_stmt) or 0

        query = (
            select(TryOnJob)
            .options(
                joinedload(TryOnJob.person_upload),
                joinedload(TryOnJob.outfit),
                joinedload(TryOnJob.result),
            )
            .where(TryOnJob.user_id == user_id)
        )
        if status:
            query = query.where(TryOnJob.status == status.value if hasattr(status, "value") else str(status))

        query = query.order_by(TryOnJob.created_at.desc()).offset(pagination.offset).limit(pagination.limit)
        items = list(self.db.execute(query).scalars().all())
        return items, total

    list_for_user = list_by_user_id

    def count_active_jobs_for_user(self, user_id: int) -> int:
        """
        Count active jobs (QUEUED or PROCESSING) currently outstanding for the given user.
        Authoritative MySQL query leveraging index on (user_id).
        """
        stmt = select(func.count(TryOnJob.id)).where(
            TryOnJob.user_id == user_id,
            TryOnJob.status.in_([TryOnJobStatus.QUEUED.value, TryOnJobStatus.PROCESSING.value]),
        )
        return self.db.scalar(stmt) or 0

    def count_queued_jobs_global(self) -> int:
        """
        Count total QUEUED jobs across the entire system.
        Authoritative MySQL query leveraging ix_tryons_queue_state index.
        """
        stmt = select(func.count(TryOnJob.id)).where(
            TryOnJob.status == TryOnJobStatus.QUEUED.value
        )
        return self.db.scalar(stmt) or 0

    def get_by_user_and_idempotency_key(
        self, user_id: int, idempotency_key: str
    ) -> Optional[TryOnJob]:
        """Look up an existing try-on job by user ID and client idempotency key."""
        stmt = (
            select(TryOnJob)
            .options(
                joinedload(TryOnJob.user),
                joinedload(TryOnJob.person_upload),
                joinedload(TryOnJob.outfit),
                joinedload(TryOnJob.result),
            )
            .where(
                TryOnJob.user_id == user_id,
                TryOnJob.idempotency_key == idempotency_key,
            )
        )
        return self.db.scalars(stmt).first()

    def create_job(
        self,
        public_id: str,
        user_id: int,
        upload_id: int,
        outfit_id: int,
        celery_task_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> TryOnJob:
        now = utc_now()
        job = TryOnJob(
            public_id=public_id,
            user_id=user_id,
            person_upload_id=upload_id,
            outfit_id=outfit_id,
            status=TryOnJobStatus.QUEUED.value,
            celery_task_id=celery_task_id,
            idempotency_key=idempotency_key,
            queued_at=now,
            created_at=now,
            updated_at=now,
        )
        self.db.add(job)
        self.db.flush()
        return job

    def claim_queued_job(self, public_id: str) -> bool:
        """
        Atomic conditional claim: transitions QUEUED -> PROCESSING.
        Ensures race-safe single claim per job.
        """
        now = utc_now()
        stmt = (
            update(TryOnJob)
            .where(
                TryOnJob.public_id == public_id,
                TryOnJob.status == TryOnJobStatus.QUEUED.value,
            )
            .values(
                status=TryOnJobStatus.PROCESSING.value,
                started_at=now,
                updated_at=now,
            )
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount > 0

    def mark_succeeded(self, public_id: str) -> bool:
        now = utc_now()
        stmt = (
            update(TryOnJob)
            .where(TryOnJob.public_id == public_id)
            .values(
                status=TryOnJobStatus.SUCCEEDED.value,
                finished_at=now,
                updated_at=now,
            )
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def mark_failed_if_processing(
        self,
        public_id: str,
        failure_code: str,
        failure_reason: Optional[str] = None,
    ) -> bool:
        """
        Conditional update: transitions PROCESSING -> FAILED.
        Guarantees that a delayed failure handler cannot overwrite a SUCCEEDED job.
        """
        now = utc_now()
        stmt = (
            update(TryOnJob)
            .where(
                TryOnJob.public_id == public_id,
                TryOnJob.status == TryOnJobStatus.PROCESSING.value,
            )
            .values(
                status=TryOnJobStatus.FAILED.value,
                error_code=failure_code,
                error_message=failure_reason[:500] if failure_reason else None,
                finished_at=now,
                updated_at=now,
            )
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def mark_failed(
        self,
        public_id: str,
        failure_code: str,
        failure_reason: Optional[str] = None,
    ) -> bool:
        now = utc_now()
        stmt = (
            update(TryOnJob)
            .where(
                TryOnJob.public_id == public_id,
                TryOnJob.status != TryOnJobStatus.SUCCEEDED.value,
            )
            .values(
                status=TryOnJobStatus.FAILED.value,
                error_code=failure_code,
                error_message=failure_reason[:500] if failure_reason else None,
                finished_at=now,
                updated_at=now,
            )
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def set_celery_task_id(self, public_id: str, task_id: str) -> bool:
        stmt = (
            update(TryOnJob)
            .where(TryOnJob.public_id == public_id)
            .values(
                celery_task_id=task_id,
                updated_at=utc_now(),
            )
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    set_task_id = set_celery_task_id

    def create_result(
        self,
        result_public_id: str,
        job_id: int,
        storage_key: str,
        width: int,
        height: int,
        mime_type: str = "image/png",
        size_bytes: Optional[int] = None,
        sha256: Optional[str] = None,
        execution_time_seconds: Optional[float] = None,
        model_version: Optional[str] = None,
        inference_config_version: Optional[str] = None,
    ) -> TryOnResult:
        result = TryOnResult(
            public_id=result_public_id,
            job_id=job_id,
            storage_key=storage_key,
            mime_type=mime_type,
            width=width,
            height=height,
            size_bytes=size_bytes,
            sha256=sha256,
            execution_time_seconds=execution_time_seconds,
            model_version=model_version,
            inference_config_version=inference_config_version,
            created_at=utc_now(),
        )
        self.db.add(result)
        self.db.flush()
        return result

    def mark_succeeded_with_result(
        self,
        public_id: str,
        job_id: int,
        result_public_id: str,
        storage_key: str,
        width: int,
        height: int,
        mime_type: str = "image/png",
        size_bytes: Optional[int] = None,
        sha256: Optional[str] = None,
        execution_time_seconds: Optional[float] = None,
    ) -> TryOnResult:
        """
        Atomically persist TryOnResult metadata and transition TryOnJob to SUCCEEDED.
        Ensures a succeeded job always has its corresponding result row.
        """
        result = self.create_result(
            result_public_id=result_public_id,
            job_id=job_id,
            storage_key=storage_key,
            width=width,
            height=height,
            mime_type=mime_type,
            size_bytes=size_bytes,
            sha256=sha256,
            execution_time_seconds=execution_time_seconds,
        )
        self.mark_succeeded(public_id)
        return result

    def delete_job(self, public_id: str, user_id: int) -> bool:
        job = self.get_by_public_id_and_user_id(public_id, user_id)
        if not job:
            return False
        self.db.delete(job)
        return True

    def get_result_for_user(self, result_public_id: str, user_id: int) -> Optional[TryOnResult]:
        """Lookup TryOnResult ensuring ownership through the parent TryOnJob."""
        return self.db.execute(
            select(TryOnResult)
            .join(TryOnJob, TryOnResult.job_id == TryOnJob.id)
            .where(
                TryOnResult.public_id == result_public_id,
                TryOnJob.user_id == user_id,
            )
        ).scalar_one_or_none()
