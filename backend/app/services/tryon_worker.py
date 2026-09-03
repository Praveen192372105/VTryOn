import logging
import shutil
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional
from PIL import Image

from app.ai.catvton.exceptions import (
    CatVTONError,
    CatVTONInferenceError,
    CatVTONInvalidInputError,
    CatVTONModelLoadError,
    CatVTONModelUnavailableError,
    CatVTONOutOfMemoryError,
    CatVTONOutputError,
    CatVTONPreprocessingError,
)
from app.ai.catvton.pipeline import CatVTONPipeline, get_catvton_pipeline
from app.ai.catvton.postprocessing import encode_tryon_result
from app.ai.catvton.types import TryOnInput
from app.core.config import settings
from app.core.exceptions import (
    InvalidImageError,
    StorageError,
)
from app.core.metrics import metrics_registry
from app.db.session import SessionLocal
from app.domain.enums import FailureCode, TryOnJobStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.domain.state_machine import is_terminal_tryon_status
from app.repositories.tryon_repository import TryOnRepository
from app.storage.base import MediaStorage
from app.storage.local import default_storage

logger = logging.getLogger("vtryon.workers.service")


# -----------------------------------------------------------------------------
# Worker Exception Contracts
# -----------------------------------------------------------------------------
class PermanentTryOnWorkerError(Exception):
    """Raised when worker encounters a non-retryable fatal error (e.g. invalid user input)."""
    def __init__(self, code: FailureCode, message: str):
        super().__init__(message)
        self.code = code
        self.public_message = message


class RetryableTryOnWorkerError(Exception):
    """Raised when worker encounters a transient infrastructure error eligible for Celery retry."""
    def __init__(self, code: FailureCode, message: str, max_retries: int = 2):
        super().__init__(message)
        self.code = code
        self.public_message = message
        self.max_retries = max_retries


@dataclass(frozen=True)
class FailureClassification:
    code: FailureCode
    retryable: bool
    public_message: str
    max_retries: int = 0


def classify_failure(exc: Exception) -> FailureClassification:
    """
    Centralized failure classifier mapping exceptions to canonical FailureCode enums
    and explicit retryability decisions.
    """
    err_msg = str(exc).lower()

    # 1. CUDA / GPU Out of Memory (Eligible for 1 controlled retry after cache clear)
    if isinstance(exc, CatVTONOutOfMemoryError) or "out of memory" in err_msg or "cuda oom" in err_msg:
        return FailureClassification(
            code=FailureCode.GPU_OUT_OF_MEMORY,
            retryable=True,
            public_message="The virtual try-on could not be completed due to an inference resource limit.",
            max_retries=1,
        )

    # 2. Transient Storage / File I/O (Eligible for up to 2 retries)
    if isinstance(exc, StorageError) or "disk write" in err_msg or "disk full" in err_msg:
        return FailureClassification(
            code=FailureCode.STORAGE_WRITE_FAILED,
            retryable=True,
            public_message="Failed to persist the virtual try-on image to storage.",
            max_retries=2,
        )

    # 3. Model Loading / Availability (Non-retryable in-process)
    if isinstance(exc, (CatVTONModelLoadError, CatVTONModelUnavailableError)):
        return FailureClassification(
            code=FailureCode.MODEL_LOAD_FAILED,
            retryable=False,
            public_message="Virtual try-on engine is currently unavailable. Please try again later.",
            max_retries=0,
        )

    # 4. Pipeline Inference / Preprocessing / Output Failure
    if isinstance(exc, (CatVTONOutputError,)):
        return FailureClassification(
            code=FailureCode.INFERENCE_FAILED,
            retryable=False,
            public_message="Virtual try-on model produced an invalid output. Try another photo.",
            max_retries=0,
        )
    if isinstance(exc, (CatVTONInferenceError, CatVTONPreprocessingError)):
        return FailureClassification(
            code=FailureCode.INFERENCE_FAILED,
            retryable=False,
            public_message="The virtual try-on could not be generated. Please try again with a different photo.",
            max_retries=0,
        )

    # 5. Invalid User Input (Non-retryable)
    if isinstance(exc, CatVTONInvalidInputError):
        return FailureClassification(
            code=FailureCode.INVALID_PERSON_IMAGE,
            retryable=False,
            public_message="The provided person image could not be processed. Choose a clear, well-lit photo.",
            max_retries=0,
        )
    if isinstance(exc, InvalidImageError) or "corrupt" in err_msg:
        if "garment" in err_msg or "outfit" in err_msg:
            return FailureClassification(
                code=FailureCode.INVALID_OUTFIT_IMAGE,
                retryable=False,
                public_message="The catalogue garment asset could not be read.",
                max_retries=0,
            )
        return FailureClassification(
            code=FailureCode.INVALID_PERSON_IMAGE,
            retryable=False,
            public_message="The person image file is corrupt or unreadable.",
            max_retries=0,
        )

    # 6. Missing Permanent Input Media (Non-retryable)
    if isinstance(exc, FileNotFoundError) or "missing" in err_msg:
        return FailureClassification(
            code=FailureCode.INPUT_MEDIA_MISSING,
            retryable=False,
            public_message="Required media files for this try-on job are missing from storage.",
            max_retries=0,
        )

    # 7. Unsupported Garment Category (Non-retryable)
    if "category" in err_msg:
        return FailureClassification(
            code=FailureCode.UNSUPPORTED_OUTFIT_CATEGORY,
            retryable=False,
            public_message="The requested garment category is not supported for virtual try-on.",
            max_retries=0,
        )

    # 8. Celery Soft Timeout
    if "softtimelimitexceeded" in err_msg or "timeout" in err_msg:
        return FailureClassification(
            code=FailureCode.WORKER_FAILURE,
            retryable=False,
            public_message="The virtual try-on took too long to complete.",
            max_retries=0,
        )

    # 9. Fallback Unexpected Worker Failure
    return FailureClassification(
        code=FailureCode.WORKER_FAILURE,
        retryable=False,
        public_message="An unexpected worker error occurred during virtual try-on processing.",
        max_retries=0,
    )


class TryOnWorkerService:
    """
    Dedicated worker service orchestrating the full execution lifecycle of a virtual try-on job.
    Enforces atomic job claiming, terminal-state idempotency, media revalidation, decoupled DB sessions,
    storage compensation, and disciplined retry decisions.
    """

    def __init__(
        self,
        storage: Optional[MediaStorage] = None,
        pipeline: Optional[Any] = None,
        engine: Optional[Any] = None,  # Backward compatibility alias
    ):
        self.storage = storage or default_storage
        self.pipeline = pipeline or engine or get_catvton_pipeline(mock=False)

    def _classify_error(self, exc: Exception) -> FailureCode:
        """Translate exceptions to canonical FailureCode enum for backward compatibility."""
        return classify_failure(exc).code

    def process(
        self,
        job_public_id: str,
        task_id: Optional[str] = None,
        retry_count: int = 0,
        raise_on_retry: bool = False,
    ) -> bool:
        """
        Main worker execution entrypoint.
        Returns True if job reached SUCCEEDED, False if FAILED or skipped.
        Raises RetryableTryOnWorkerError if eligible for Celery-level task retry.
        """
        logger.info(
            f"Worker received try-on job '{job_public_id}' [task_id={task_id}, retry_count={retry_count}]",
            extra={
                "event": "tryon.worker.received",
                "job_id": job_public_id,
                "task_id": task_id,
                "retry_count": retry_count,
            },
        )

        # ---------------------------------------------------------------------
        # STEP 1: Reload Canonical State & Atomic Claim from MySQL
        # ---------------------------------------------------------------------
        with SessionLocal() as db:
            repo = TryOnRepository(db)
            job = repo.get_by_public_id(job_public_id)
            if not job:
                logger.error(
                    f"Try-on job '{job_public_id}' not found in MySQL database. Aborting worker execution.",
                    extra={"event": "tryon.worker.job_missing", "job_id": job_public_id},
                )
                return False

            status_str = job.status.value if hasattr(job.status, "value") else str(job.status)

            # Idempotency Check: Terminal jobs MUST NOT be re-executed
            if is_terminal_tryon_status(status_str):
                logger.info(
                    f"Job '{job_public_id}' is already in terminal status '{status_str}'. Skipping duplicate delivery.",
                    extra={"event": "tryon.worker.idempotent_skip", "job_id": job_public_id, "status": status_str},
                )
                return status_str == TryOnJobStatus.SUCCEEDED.value

            # Processing State Reconciliation:
            if status_str == TryOnJobStatus.PROCESSING.value:
                if retry_count > 0:
                    # Authorized Celery task retry: Allow worker to resume
                    logger.info(
                        f"Job '{job_public_id}' is PROCESSING under authorized task retry #{retry_count}. Continuing execution.",
                        extra={"event": "tryon.worker.retry_resumed", "job_id": job_public_id, "retry_count": retry_count},
                    )
                else:
                    # Duplicate delivery of an already processing job: Do NOT run duplicate inference
                    logger.warning(
                        f"Job '{job_public_id}' is already marked PROCESSING. Skipping duplicate task delivery.",
                        extra={"event": "tryon.worker.duplicate_processing_skip", "job_id": job_public_id},
                    )
                    return False

            # Atomic Claim: Transition QUEUED -> PROCESSING
            if status_str == TryOnJobStatus.QUEUED.value:
                claimed = repo.claim_queued_job(job_public_id)
                if not claimed:
                    logger.warning(
                        f"Job '{job_public_id}' atomic claim lost (rowcount 0). Another worker claimed it.",
                        extra={"event": "tryon.worker.claim_lost", "job_id": job_public_id},
                    )
                    return False

            # Extract required job attributes before closing Session A
            user_public_id = job.user.public_id if hasattr(job, "user") and job.user else "usr_unknown"
            person_storage_key = job.person_upload.storage_key if hasattr(job, "person_upload") and job.person_upload else None
            outfit_storage_key = job.outfit.storage_key if hasattr(job, "outfit") and job.outfit else None
            outfit_category = (
                job.outfit.category.value
                if hasattr(job, "outfit") and job.outfit and hasattr(job.outfit.category, "value")
                else str(job.outfit.category) if hasattr(job, "outfit") and job.outfit else "upper_body"
            )
            job_int_id = job.id
            queued_at = getattr(job, "queued_at", None)
            started_at = getattr(job, "started_at", None)
            queue_wait_s = (
                (started_at - queued_at).total_seconds()
                if (queued_at and started_at)
                else 0.0
            )
            queue_wait_ms = round(queue_wait_s * 1000)

        # Session A is committed and closed. No DB locks or connections held during GPU inference!

        # ---------------------------------------------------------------------
        # STEP 2: Media Materialization into Isolated Temp Workspace
        # ---------------------------------------------------------------------
        exec_id = uuid.uuid4().hex[:8]
        temp_dir = Path(settings.resolved_temp_root) / "tryon" / job_public_id / exec_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        saved_result_key: Optional[str] = None
        start_time = time.perf_counter()

        try:
            if not person_storage_key or not outfit_storage_key:
                raise FileNotFoundError("Person upload or garment storage key missing from canonical job metadata.")

            local_person_path = temp_dir / "person.jpg"
            local_garment_path = temp_dir / "garment.jpg"

            # Materialize person media
            try:
                person_bytes = self.storage.get(person_storage_key)
                local_person_path.write_bytes(person_bytes)
            except Exception as read_exc:
                raise FileNotFoundError(f"Failed to read person media from storage key '{person_storage_key}': {str(read_exc)}") from read_exc

            # Materialize garment media
            try:
                garment_bytes = self.storage.get(outfit_storage_key)
                local_garment_path.write_bytes(garment_bytes)
            except Exception as read_exc:
                raise FileNotFoundError(f"Failed to read garment media from storage key '{outfit_storage_key}': {str(read_exc)}") from read_exc

            # Re-validate image headers with Pillow
            try:
                with Image.open(local_person_path) as img:
                    img.verify()
            except Exception as exc:
                raise InvalidImageError(f"Person image file is corrupt: {str(exc)}") from exc

            try:
                with Image.open(local_garment_path) as img:
                    img.verify()
            except Exception as exc:
                raise InvalidImageError(f"Garment image file is corrupt: {str(exc)}") from exc

            # -----------------------------------------------------------------
            # STEP 3: CatVTON Generative Inference Pipeline
            # -----------------------------------------------------------------
            logger.info(
                f"Executing CatVTON inference for job '{job_public_id}' [device={settings.CATVTON_DEVICE}]",
                extra={"event": "tryon.inference.started", "job_id": job_public_id},
            )

            inference_start = time.perf_counter()
            tryon_input = TryOnInput(
                person_path=local_person_path,
                garment_path=local_garment_path,
                garment_category=outfit_category,
            )

            if hasattr(self.pipeline, "generate"):
                try:
                    output = self.pipeline.generate(tryon_input)
                except TypeError:
                    output = self.pipeline.generate(
                        person_image_path=str(local_person_path),
                        garment_image_path=str(local_garment_path),
                        category=outfit_category,
                    )
                result_image = output.image if hasattr(output, "image") else output
            elif hasattr(self.pipeline, "run"):
                output = self.pipeline.run(tryon_input)
                result_image = output.image if hasattr(output, "image") else output
            else:
                raise CatVTONInferenceError("Configured inference pipeline does not support generate()")

            inference_duration = time.perf_counter() - inference_start
            if settings.METRICS_ENABLED:
                metrics_registry.record_catvton_inference(inference_duration)

            # -----------------------------------------------------------------
            # STEP 4: Output Validation, Sanitization & Result Encoding
            # -----------------------------------------------------------------
            encoded = encode_tryon_result(result_image, format="JPEG", quality=95)

            # Persist to MediaStorage
            result_public_id = generate_public_id(ResourcePrefix.TRYON_RESULT)
            saved_result_key = f"results/{user_public_id}/{job_public_id}/result.jpg"
            self.storage.save(saved_result_key, encoded.data, content_type=encoded.mime_type)

            execution_duration = round(time.perf_counter() - start_time, 3)
            logger.info(
                f"Saved try-on result image to '{saved_result_key}' ({encoded.size_bytes} bytes in {execution_duration}s)",
                extra={"event": "tryon.result.saved", "job_id": job_public_id, "duration_s": execution_duration},
            )

            # -----------------------------------------------------------------
            # STEP 5: Session B: Transactional Result & Succeeded State
            # -----------------------------------------------------------------
            with SessionLocal() as db:
                repo = TryOnRepository(db)
                try:
                    repo.create_result(
                        result_public_id=result_public_id,
                        job_id=job_int_id,
                        storage_key=saved_result_key,
                        width=encoded.width,
                        height=encoded.height,
                        mime_type=encoded.mime_type,
                        size_bytes=encoded.size_bytes,
                        sha256=encoded.sha256,
                        execution_time_seconds=execution_duration,
                        model_version=settings.CATVTON_MODEL_VERSION,
                        inference_config_version=settings.INFERENCE_CONFIG_VERSION,
                    )
                    repo.mark_succeeded(job_public_id)
                    db.commit()
                except Exception as exc:
                    db.rollback()
                    # Storage compensation: Delete orphaned result file if DB commit failed
                    if saved_result_key and self.storage.exists(saved_result_key):
                        try:
                            self.storage.delete(saved_result_key)
                            logger.info(f"Storage compensation cleaned up orphaned result key: {saved_result_key}")
                        except Exception as clean_exc:
                            logger.warning(f"Storage compensation cleanup failed: {str(clean_exc)}")
                    raise StorageError(f"Failed to persist result metadata in database: {str(exc)}") from exc

            if settings.METRICS_ENABLED:
                metrics_registry.record_job_completed(
                    processing_seconds=execution_duration,
                    queue_wait_seconds=queue_wait_s,
                )

            logger.info(
                f"Try-on job '{job_public_id}' successfully SUCCEEDED!",
                extra={
                    "event": "tryon.job.succeeded",
                    "job_id": job_public_id,
                    "duration_s": execution_duration,
                    "queue_wait_ms": queue_wait_ms,
                    "model_version": settings.CATVTON_MODEL_VERSION,
                },
            )
            return True

        except Exception as exc:
            # -----------------------------------------------------------------
            # STEP 6: Failure Classification, Retry Decision & Persistence
            # -----------------------------------------------------------------
            classification = classify_failure(exc)
            if settings.METRICS_ENABLED:
                metrics_registry.record_job_failed(classification.code.value)
                if classification.code == FailureCode.GPU_OUT_OF_MEMORY:
                    metrics_registry.record_catvton_oom()

            # Evaluate Retryability:
            if classification.retryable and retry_count < classification.max_retries:
                # Clean up GPU cache before retry if OOM
                if classification.code == FailureCode.GPU_OUT_OF_MEMORY:
                    try:
                        import torch
                        if torch.cuda.is_available():
                            torch.cuda.empty_cache()
                    except Exception:
                        pass

                logger.warning(
                    f"Job '{job_public_id}' encountered retryable error [{classification.code.value}]. "
                    f"Attempt {retry_count + 1}/{classification.max_retries}. Scheduling Celery retry...",
                    extra={
                        "event": "tryon.worker.retry_scheduled",
                        "job_id": job_public_id,
                        "failure_code": classification.code.value,
                        "retry_count": retry_count,
                    },
                )
                if raise_on_retry:
                    raise RetryableTryOnWorkerError(
                        code=classification.code,
                        message=classification.public_message,
                        max_retries=classification.max_retries,
                    ) from exc

            # Terminal Failure: Either non-retryable or retry attempts exhausted
            logger.error(
                f"Try-on job '{job_public_id}' failed terminally: [{classification.code.value}] {str(exc)}",
                exc_info=True,
                extra={"event": "tryon.job.failed", "job_id": job_public_id, "failure_code": classification.code.value},
            )

            with SessionLocal() as db:
                repo = TryOnRepository(db)
                try:
                    # Conditional failure update ensures we never overwrite a SUCCEEDED job
                    updated = repo.mark_failed_if_processing(
                        public_id=job_public_id,
                        failure_code=classification.code.value,
                        failure_reason=classification.public_message,
                    )
                    db.commit()
                    if not updated:
                        logger.warning(
                            f"Job '{job_public_id}' failure update affected 0 rows (not in PROCESSING status).",
                            extra={"event": "tryon.worker.failure_state_conflict", "job_id": job_public_id},
                        )
                except Exception as db_exc:
                    logger.critical(f"Failed to persist failure state for job '{job_public_id}': {str(db_exc)}")

            return False

        finally:
            # -----------------------------------------------------------------
            # STEP 7: Temporary Workspace Cleanup
            # -----------------------------------------------------------------
            try:
                if temp_dir.exists():
                    shutil.rmtree(str(temp_dir), ignore_errors=True)
            except Exception as cleanup_exc:
                logger.warning(
                    f"Temporary directory cleanup failed for job '{job_public_id}': {str(cleanup_exc)}",
                    extra={"event": "tryon.worker.cleanup.failed", "job_id": job_public_id},
                )


def get_tryon_worker_service() -> TryOnWorkerService:
    return TryOnWorkerService()


__all__ = [
    "TryOnWorkerService",
    "get_tryon_worker_service",
    "FailureClassification",
    "classify_failure",
    "PermanentTryOnWorkerError",
    "RetryableTryOnWorkerError",
]
