import logging
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded

from app.core.config import settings
from app.db.session import SessionLocal
from app.domain.enums import FailureCode
from app.repositories.tryon_repository import TryOnRepository
from app.services.tryon_worker import RetryableTryOnWorkerError, TryOnWorkerService
from app.workers.celery_app import celery_app

logger = logging.getLogger("vtryon.workers.task")


@celery_app.task(
    name="tryon.process",
    bind=True,
    queue="gpu",
    acks_late=True,
    max_retries=2,
    soft_time_limit=240,
    time_limit=300,
)
def process_tryon_job(self, job_public_id: str) -> None:
    """
    Celery background worker task for GPU virtual try-on inference.
    Receives ONLY the canonical job_public_id.
    Executes in the dedicated 'gpu' queue with prefetch=1 and late acknowledgments.
    """
    # 1. Payload validation
    if not isinstance(job_public_id, str) or not job_public_id.strip():
        logger.error(
            f"Received malformed try-on job identifier: {job_public_id}. Aborting task.",
            extra={"event": "tryon.worker.invalid_payload", "task_id": self.request.id},
        )
        return

    logger.info(
        f"Celery task received try-on job '{job_public_id}' [task_id={self.request.id}, retry={self.request.retries}]",
        extra={
            "event": "tryon.worker.received",
            "job_id": job_public_id,
            "task_id": self.request.id,
            "retry_count": self.request.retries,
            "queue": "gpu",
        },
    )

    try:
        worker_service = TryOnWorkerService()
        worker_service.process(
            job_public_id=job_public_id,
            task_id=self.request.id,
            retry_count=self.request.retries,
            raise_on_retry=True,
        )

    except RetryableTryOnWorkerError as retry_exc:
        # Bounded exponential backoff: base_seconds * (2 ^ retry_count)
        base_seconds = settings.CELERY_GPU_RETRY_BASE_SECONDS
        countdown = int(base_seconds * (2 ** self.request.retries))
        logger.warning(
            f"Job '{job_public_id}' scheduling Celery retry #{self.request.retries + 1} "
            f"in {countdown}s (max: {retry_exc.max_retries})",
            extra={
                "event": "tryon.task.retry_scheduled",
                "job_id": job_public_id,
                "task_id": self.request.id,
                "countdown": countdown,
                "retry_count": self.request.retries,
            },
        )
        try:
            raise self.retry(
                exc=retry_exc,
                countdown=countdown,
                max_retries=retry_exc.max_retries,
            )
        except MaxRetriesExceededError:
            # Reconcile MySQL state on retry exhaustion
            logger.error(
                f"Job '{job_public_id}' exhausted all {retry_exc.max_retries} retry attempts.",
                extra={"event": "tryon.task.retries_exhausted", "job_id": job_public_id},
            )
            with SessionLocal() as db:
                TryOnRepository(db).mark_failed_if_processing(
                    public_id=job_public_id,
                    failure_code=retry_exc.code.value,
                    failure_reason="Virtual try-on processing failed after multiple retry attempts.",
                )
                db.commit()

    except SoftTimeLimitExceeded:
        # Celery soft time limit reached: Persist controlled failure before hard kill
        logger.error(
            f"Job '{job_public_id}' exceeded soft time limit ({settings.CELERY_GPU_SOFT_TIME_LIMIT_SECONDS}s).",
            extra={"event": "tryon.task.soft_timeout", "job_id": job_public_id, "task_id": self.request.id},
        )
        with SessionLocal() as db:
            TryOnRepository(db).mark_failed_if_processing(
                public_id=job_public_id,
                failure_code=FailureCode.WORKER_FAILURE.value,
                failure_reason="The virtual try-on took too long to complete.",
            )
            db.commit()

    except Exception as exc:
        # Top-level defensive exception boundary
        logger.critical(
            f"Unhandled exception in Celery task for job '{job_public_id}': {str(exc)}",
            exc_info=True,
            extra={"event": "tryon.task.unhandled_exception", "job_id": job_public_id, "task_id": self.request.id},
        )
        with SessionLocal() as db:
            TryOnRepository(db).mark_failed_if_processing(
                public_id=job_public_id,
                failure_code=FailureCode.WORKER_FAILURE.value,
                failure_reason="An unexpected worker error occurred during virtual try-on processing.",
            )
            db.commit()


# Backward-compatible task aliases registered to same handler
@celery_app.task(name="app.workers.tasks.tryons.process_tryon_job", bind=True, queue="gpu", acks_late=True)
def legacy_tryon_task(self, job_public_id: str) -> None:
    process_tryon_job(job_public_id)


__all__ = ["process_tryon_job", "legacy_tryon_task"]
