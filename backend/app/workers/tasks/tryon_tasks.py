"""
Celery Background Worker Tasks — Virtual Try-On
===============================================
Dispatches try-on tasks using the canonical TryOnWorkerService.
"""

import logging
from app.services.tryon_worker import TryOnWorkerService
from app.workers.celery_app import celery_app

logger = logging.getLogger("vtryon.workers.tryon")


@celery_app.task(
    name="app.workers.tasks.tryon_tasks.process_tryon_job",
    bind=True,
    max_retries=1,
    default_retry_delay=10,
)
def process_tryon_job(self, job_id: str) -> dict:
    """Delegates job execution to TryOnWorkerService."""
    logger.info(f"Worker started try-on task for job '{job_id}' [task_id={self.request.id}]")
    worker = TryOnWorkerService()
    success = worker.process(job_public_id=job_id, task_id=self.request.id)
    return {"success": success, "job_id": job_id}
