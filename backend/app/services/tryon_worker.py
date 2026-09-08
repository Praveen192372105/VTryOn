import logging
import shutil
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional
from PIL import Image

from app.ai.processing import encode_tryon_result
from app.ai.providers import (
    CatVTONTryOnProvider,
    GenerationMode,
    ProviderAuthError,
    ProviderInvalidInputError,
    ProviderPermanentError,
    ProviderRateLimitError,
    ProviderRegistry,
    ProviderTransientError,
    ProviderUnavailableError,
)
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

    # 1. Transient Storage / File I/O (Eligible for up to 2 retries)
    if isinstance(exc, StorageError) or "disk write" in err_msg or "disk full" in err_msg:
        return FailureClassification(
            code=FailureCode.STORAGE_WRITE_FAILED,
            retryable=True,
            public_message="Failed to persist the virtual try-on image to storage.",
            max_retries=2,
        )

    # 2. CUDA Out of Memory (GPU OOM)
    if "out of memory" in err_msg or "cuda oom" in err_msg:
        return FailureClassification(
            code=FailureCode.GPU_OUT_OF_MEMORY,
            retryable=False,
            public_message="The server temporarily ran out of GPU memory for this try-on. Please try another photo.",
            max_retries=0,
        )

    # 3. Model Loading Failures (Non-retryable in-process)
    if isinstance(exc, (ProviderUnavailableError, ProviderAuthError)):
        return FailureClassification(
            code=FailureCode.MODEL_LOAD_FAILED,
            retryable=False,
            public_message="Virtual try-on engine is currently unavailable. Please try again later.",
            max_retries=0,
        )

    # 4. Provider Transient Failures (Eligible for retry)
    if isinstance(exc, (ProviderTransientError, ProviderRateLimitError)):
        return FailureClassification(
            code=FailureCode.INFERENCE_FAILED,
            retryable=True,
            public_message="AI inference engine is temporarily busy. Retrying shortly...",
            max_retries=2,
        )

    # 5. Provider Permanent Errors
    if isinstance(exc, ProviderPermanentError):
        return FailureClassification(
            code=FailureCode.INFERENCE_FAILED,
            retryable=False,
            public_message="Virtual try-on model produced an invalid output. Try another photo.",
            max_retries=0,
        )

    # 5. Invalid User Input (Non-retryable)
    if isinstance(exc, ProviderInvalidInputError):
        return FailureClassification(
            code=FailureCode.INVALID_PERSON_IMAGE,
            retryable=False,
            public_message="The provided person image could not be processed. Choose a clear, well-lit photo.",
            max_retries=0,
        )
    if isinstance(exc, InvalidImageError) or "corrupt" in err_msg:
        if "garment" in err_msg or "outfit" in err_msg:
            return FailureClassification(
                code=FailureCode.INVALID_GARMENT_IMAGE,
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
    if "softtimelimitexceeded" in err_msg:
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


# -----------------------------------------------------------------------------
# Worker Service Implementation
# -----------------------------------------------------------------------------
class TryOnWorkerService:
    """
    Dedicated domain service executing the end-to-end background Virtual Try-On workflow.
    Powered exclusively by Mistral AI.
    """

    def __init__(
        self,
        storage: Optional[MediaStorage] = None,
        pipeline: Optional[Any] = None,
        engine: Optional[Any] = None,
        registry: Optional[ProviderRegistry] = None,
    ):
        self.storage = storage or default_storage
        if registry is not None:
            self.registry = registry
        else:
            self.registry = ProviderRegistry(primary_name="catvton")
            self.registry.register(CatVTONTryOnProvider())

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

        start_time = time.perf_counter()
        temp_dir: Optional[Path] = None
        saved_result_key: Optional[str] = None

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
                    logger.info(
                        f"Job '{job_public_id}' is PROCESSING under authorized task retry #{retry_count}. Continuing execution.",
                        extra={"event": "tryon.worker.retry_resumed", "job_id": job_public_id, "retry_count": retry_count},
                    )
                else:
                    logger.warning(
                        f"Job '{job_public_id}' was left in PROCESSING without active retry. Transitioning to FAILED.",
                        extra={"event": "tryon.worker.duplicate_processing_fail", "job_id": job_public_id},
                    )
                    repo.mark_failed(
                        public_id=job_public_id,
                        failure_code=FailureCode.WORKER_FAILURE.value,
                        failure_reason="Job was abandoned in PROCESSING state.",
                    )
                    db.commit()
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
            person_upload = getattr(job, "person_upload", None)
            person_storage_key = (
                getattr(person_upload, "storage_key", None)
                or getattr(person_upload, "image_storage_key", None)
            )
            outfit = getattr(job, "outfit", None)
            garment_storage_key = (
                getattr(outfit, "storage_key", None)
                or getattr(outfit, "image_storage_key", None)
            )
            outfit_category = (
                outfit.category.value
                if hasattr(outfit, "category") and hasattr(outfit.category, "value")
                else str(outfit.category) if outfit else "upper_body"
            )
            job_int_id = job.id
            job_created_at = getattr(job, "created_at", None)

        queue_wait_ms = (
            round((time.time() - job_created_at.timestamp()) * 1000, 2)
            if job_created_at
            else None
        )

        # ---------------------------------------------------------------------
        # STEP 2: Media Asset Materialization & Local Pre-Validation
        # ---------------------------------------------------------------------
        try:
            if not person_storage_key or not self.storage.exists(person_storage_key):
                raise FileNotFoundError(f"Person image asset '{person_storage_key}' is missing from storage.")

            if not garment_storage_key or not self.storage.exists(garment_storage_key):
                raise FileNotFoundError(f"Garment image asset '{garment_storage_key}' is missing from storage.")

            # Create an isolated temporary working directory
            temp_uuid = uuid.uuid4().hex
            temp_dir = settings.resolved_temp_root / f"tryon_{job_public_id}_{temp_uuid}"
            temp_dir.mkdir(parents=True, exist_ok=True)

            local_person_path = temp_dir / "person_input.jpg"
            local_garment_path = temp_dir / "garment_input.jpg"

            # Download assets into temporary working directory
            person_bytes = self.storage.get(person_storage_key)
            with open(local_person_path, "wb") as f:
                f.write(person_bytes)

            garment_bytes = self.storage.get(garment_storage_key)
            with open(local_garment_path, "wb") as f:
                f.write(garment_bytes)

            # Defensive local image integrity check
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
            # STEP 3: CatVTON Virtual Try-On Provider Execution
            # -----------------------------------------------------------------
            provider = self.registry.get_primary()
            provider_used = provider.name
            used_model = getattr(settings, "CATVTON_MODEL_VERSION", "catvton-1.0-v1")
            used_config = getattr(settings, "INFERENCE_CONFIG_VERSION", "v1-accurate")

            logger.info(
                f"Executing try-on inference for job '{job_public_id}' via provider '{provider.name}'",
                extra={"event": "tryon.inference.started", "job_id": job_public_id, "provider": provider.name},
            )

            inference_start = time.perf_counter()
            provider_result = provider.generate(
                person_image_path=local_person_path,
                garment_image_path=local_garment_path,
                category=outfit_category,
                request_id=job_public_id,
            )
            result_image = provider_result.output_image
            generation_mode = provider_result.generation_mode or used_config
            used_model = provider_result.model or used_model

            inference_duration = time.perf_counter() - inference_start
            if settings.METRICS_ENABLED:
                metrics_registry.record_tryon_inference(inference_duration)

            # -----------------------------------------------------------------
            # STEP 4: Output Validation, Sanitization & Result Encoding
            # -----------------------------------------------------------------
            encoded = encode_tryon_result(result_image, format="JPEG", quality=95)

            # Persist to MediaStorage
            result_public_id = generate_public_id(ResourcePrefix.TRYON_RESULT)
            saved_result_key = f"results/{user_public_id}/{job_public_id}/result.jpg"
            self.storage.save(saved_result_key, encoded.data, content_type=encoded.mime_type)

            execution_duration = round(time.perf_counter() - start_time, 3)

            # -----------------------------------------------------------------
            # STEP 5: Database Finalization (SUCCEEDED)
            # -----------------------------------------------------------------
            with SessionLocal() as db:
                repo = TryOnRepository(db)
                job = repo.get_by_public_id(job_public_id)
                if not job:
                    raise StorageError(f"Try-on job '{job_public_id}' disappeared before finalization.")

                # Idempotency guard: If job reached terminal state while inference was running
                if is_terminal_tryon_status(job.status):
                    logger.warning(
                        f"Job '{job_public_id}' reached terminal state during inference. Triggering storage compensation.",
                        extra={"event": "tryon.worker.cancelled_during_inference", "job_id": job_public_id},
                    )
                    self.storage.delete(saved_result_key)
                    return False

                # Record TryOnResult with provenance
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
                    model_version=used_model,
                    inference_config_version=generation_mode,
                )

                # Atomically mark SUCCEEDED
                repo.mark_succeeded(job_public_id)
                db.commit()

            if settings.METRICS_ENABLED:
                metrics_registry.record_job_completed(execution_duration)

            logger.info(
                f"Virtual try-on job '{job_public_id}' successfully COMPLETED in {execution_duration}s [inference={inference_duration:.2f}s, provider={provider_used}]",
                extra={
                    "event": "tryon.worker.completed",
                    "job_id": job_public_id,
                    "duration_s": execution_duration,
                    "inference_duration_s": round(inference_duration, 3),
                    "queue_wait_ms": queue_wait_ms,
                    "model_version": used_model,
                    "provider": provider_used,
                    "mode": generation_mode,
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

            # Evaluate Retryability:
            if classification.retryable and retry_count < classification.max_retries:
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
                return False

            # Permanent failure or retry exhaustion: Mark FAILED in database
            failure_message = classification.public_message
            if retry_count >= classification.max_retries and "retrying shortly" in failure_message.lower():
                failure_message = "Virtual try-on processing timed out after retries. Please try again later."

            logger.error(
                f"Virtual try-on job '{job_public_id}' permanently FAILED [{classification.code.value}]: {str(exc)}",
                exc_info=True,
                extra={
                    "event": "tryon.worker.failed",
                    "job_id": job_public_id,
                    "failure_code": classification.code.value,
                    "retry_count": retry_count,
                    "final_reason": failure_message,
                },
            )

            with SessionLocal() as db:
                repo = TryOnRepository(db)
                repo.mark_failed_if_processing(
                    public_id=job_public_id,
                    failure_code=classification.code.value,
                    failure_reason=failure_message,
                )
                db.commit()

            # Storage compensation: Clean up partially written result image if failed during DB update
            if saved_result_key:
                try:
                    self.storage.delete(saved_result_key)
                except Exception as comp_exc:
                    logger.warning(f"Failed to clean up storage key '{saved_result_key}' during compensation: {comp_exc}")

            return False

        finally:
            # -----------------------------------------------------------------
            # STEP 7: Workdir Cleanup
            # -----------------------------------------------------------------
            if temp_dir and temp_dir.exists():
                try:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                except Exception as cleanup_exc:
                    logger.warning(f"Failed to clean up temp working directory '{temp_dir}': {cleanup_exc}")


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
