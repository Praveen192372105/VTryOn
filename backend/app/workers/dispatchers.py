from dataclasses import dataclass
import logging
from typing import List, Protocol

from app.core.exceptions import QueueSubmissionError

logger = logging.getLogger("vtryon.workers.dispatcher")


@dataclass(frozen=True)
class DispatchResult:
    """Encapsulates the operational identifier of a dispatched task."""
    task_id: str

    def __str__(self) -> str:
        return self.task_id


class TryOnJobDispatcher(Protocol):
    """
    Protocol defining the contract for dispatching asynchronous try-on jobs.
    Decouples request-time orchestration from Celery/Redis mechanics.
    """

    def dispatch(self, job_public_id: str) -> str:
        """
        Dispatch a try-on job to the background worker queue passing ONLY the job identifier.
        Returns the operational task ID.
        """
        ...


class CeleryTryOnJobDispatcher:
    """
    Production dispatcher enqueuing try-on jobs to Celery Redis broker.
    Enforces payload minimalism (job_public_id string only) and wraps
    transport/broker failures into application QueueSubmissionError.
    """

    def dispatch(self, job_public_id: str) -> str:
        # Strict validation: Only job_public_id string allowed
        if not isinstance(job_public_id, str) or not job_public_id.strip():
            raise ValueError(f"Invalid job identifier for dispatch: {job_public_id}")

        try:
            from app.workers.tasks.tryons import process_tryon_job

            # Pass ONLY job_public_id to ensure worker reloads canonical state from MySQL
            task = process_tryon_job.delay(job_public_id)
            task_id = str(task.id)

            logger.info(
                f"Dispatched try-on job '{job_public_id}' to Celery task '{task_id}'",
                extra={
                    "event": "tryon.queue.submitted",
                    "job_id": job_public_id,
                    "task_id": task_id,
                },
            )
            return task_id

        except Exception as exc:
            logger.error(
                f"Failed to dispatch try-on job '{job_public_id}' to Celery broker: {str(exc)}",
                exc_info=True,
                extra={
                    "event": "tryon.queue.failed",
                    "job_id": job_public_id,
                },
            )
            raise QueueSubmissionError(f"Could not submit job to processing queue: {str(exc)}") from exc


class InMemoryTryOnJobDispatcher:
    """
    In-memory dispatcher for unit testing and offline environments.
    """

    def __init__(self, should_fail: bool = False):
        self.dispatched_jobs: List[str] = []
        self.should_fail = should_fail

    def dispatch(self, job_public_id: str) -> str:
        if self.should_fail:
            raise QueueSubmissionError("Simulated queue broker failure.")
        self.dispatched_jobs.append(job_public_id)
        return f"mock_task_{len(self.dispatched_jobs)}"

    def clear(self) -> None:
        self.dispatched_jobs.clear()


__all__ = [
    "DispatchResult",
    "TryOnJobDispatcher",
    "CeleryTryOnJobDispatcher",
    "InMemoryTryOnJobDispatcher",
]
