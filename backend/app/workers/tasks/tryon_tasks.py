import io
import logging
import time
from typing import Optional
from PIL import Image

from app.ai.catvton.engine import get_catvton_engine
from app.ai.catvton.exceptions import (
    CatVTONInferenceError,
    CatVTONModelLoadError,
    CatVTONOOMError,
)
from app.core.constants import ErrorCode, JobStatus
from app.db.session import SessionLocal
from app.models.tryon_job import TryOnJob
from app.models.tryon_result import TryOnResult
from app.repositories.tryon_repository import TryOnRepository
from app.storage.local import default_storage
from app.storage.paths import generate_tryon_result_key
from app.utils.images import create_thumbnail
from app.workers.celery_app import celery_app

logger = logging.getLogger("vtryon.workers.tryon")


@celery_app.task(
    name="app.workers.tasks.tryon_tasks.process_tryon_job",
    bind=True,
    max_retries=1,
    default_retry_delay=10,
)
def process_tryon_job(self, job_id: str) -> dict:
    """
    Celery background worker task for virtual try-on inference.
    Executes CatVTON model inference, persists generated image, and updates DB job status.
    """
    start_time = time.perf_counter()
    logger.info(
        f"Worker started try-on task for job '{job_id}'",
        extra={"event": "tryon.worker.started", "job_id": job_id, "task_id": self.request.id},
    )

    db = SessionLocal()
    try:
        repo = TryOnRepository(db)
        job = repo.get_by_id(job_id)

        if not job:
            logger.error(f"Try-on job '{job_id}' not found in database.", extra={"job_id": job_id})
            return {"success": False, "error": "Job not found"}

        if job.status == JobStatus.COMPLETED:
            logger.info(f"Job '{job_id}' is already completed. Skipping.", extra={"job_id": job_id})
            return {"success": True, "status": "already_completed"}

        if job.status == JobStatus.CANCELLED:
            logger.info(f"Job '{job_id}' was cancelled. Skipping.", extra={"job_id": job_id})
            return {"success": False, "status": "cancelled"}

        # Transition state: PROCESSING
        repo.update_job_status(job, JobStatus.PROCESSING)

        # Validate input assets
        person_upload = job.person_upload
        outfit = job.outfit

        if not person_upload or not default_storage.exists(person_upload.storage_key):
            error_msg = "Person image input file is missing or inaccessible."
            repo.update_job_status(job, JobStatus.FAILED, ErrorCode.INVALID_IMAGE, error_msg)
            return {"success": False, "error": error_msg}

        if not outfit or not default_storage.exists(outfit.storage_key):
            error_msg = "Garment outfit input file is missing or inaccessible."
            repo.update_job_status(job, JobStatus.FAILED, ErrorCode.OUTFIT_NOT_FOUND, error_msg)
            return {"success": False, "error": error_msg}

        person_local_path = default_storage.resolve_local_path(person_upload.storage_key)
        outfit_local_path = default_storage.resolve_local_path(outfit.storage_key)

        # Run AI inference
        engine = get_catvton_engine()
        result_pil: Image.Image = engine.generate(
            person_image_path=person_local_path,
            garment_image_path=outfit_local_path,
            category=outfit.category,
        )

        # Encode and save result image to storage
        result_buf = io.BytesIO()
        result_pil.save(result_buf, format="PNG")
        result_bytes = result_buf.getvalue()

        result_key = generate_tryon_result_key(job_id, extension="png")
        saved_result_key = default_storage.save(result_key, result_bytes, content_type="image/png")

        # Generate thumbnail for fast preview
        thumb_bytes = create_thumbnail(result_bytes)
        thumb_key = f"tryons/{job_id}/thumb.jpg"
        saved_thumb_key = default_storage.save(thumb_key, thumb_bytes, content_type="image/jpeg")

        execution_duration = round(time.perf_counter() - start_time, 2)

        # Create TryOnResult entry
        tryon_result = TryOnResult(
            job_id=job_id,
            result_image_key=saved_result_key,
            thumbnail_key=saved_thumb_key,
            execution_time_seconds=execution_duration,
        )
        repo.create_result(tryon_result)

        # Transition state: COMPLETED
        repo.update_job_status(job, JobStatus.COMPLETED)

        logger.info(
            f"Try-on job '{job_id}' completed successfully in {execution_duration}s",
            extra={
                "event": "tryon.job.completed",
                "job_id": job_id,
                "duration_s": execution_duration,
            },
        )
        return {"success": True, "job_id": job_id, "duration": execution_duration}

    except CatVTONOOMError as exc:
        db.rollback()
        error_code = ErrorCode.CATVTON_OOM_ERROR
        error_message = "GPU memory limit reached during try-on processing. Please try again later."
        logger.error(f"Job '{job_id}' failed due to CUDA OOM", extra={"event": "tryon.job.failed", "job_id": job_id})
        _fail_job(job_id, error_code, error_message)
        return {"success": False, "error": error_message}

    except (CatVTONModelLoadError, CatVTONInferenceError) as exc:
        db.rollback()
        error_code = ErrorCode.CATVTON_INFERENCE_ERROR
        error_message = "AI inference failed to synthesize the try-on image."
        logger.error(f"Job '{job_id}' failed: {str(exc)}", exc_info=True, extra={"event": "tryon.job.failed", "job_id": job_id})
        _fail_job(job_id, error_code, error_message)
        return {"success": False, "error": error_message}

    except Exception as exc:
        db.rollback()
        error_code = ErrorCode.TRYON_PROCESSING_ERROR
        error_message = "An unexpected processing error occurred during try-on execution."
        logger.error(f"Job '{job_id}' failed unexpectedly: {str(exc)}", exc_info=True, extra={"event": "tryon.job.failed", "job_id": job_id})
        _fail_job(job_id, error_code, error_message)
        return {"success": False, "error": error_message}

    finally:
        db.close()


def _fail_job(job_id: str, error_code: str, error_message: str) -> None:
    """Helper to update job status to FAILED in an isolated session."""
    db = SessionLocal()
    try:
        repo = TryOnRepository(db)
        job = repo.get_by_id(job_id)
        if job and job.status != JobStatus.COMPLETED:
            repo.update_job_status(job, JobStatus.FAILED, error_code, error_message)
    except Exception as exc:
        logger.error(f"Failed to mark job '{job_id}' as failed: {str(exc)}")
    finally:
        db.close()
