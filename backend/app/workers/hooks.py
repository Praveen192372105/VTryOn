"""
Celery Worker Lifecycle Hooks
=============================
Handles process initialization, persistent CatVTON GPU model loading,
and resource reclamation for background try-on workers.
"""

import logging
from celery.signals import worker_process_init, worker_process_shutdown

logger = logging.getLogger("vtryon.workers.hooks")


@worker_process_init.connect
def on_worker_process_init(**kwargs) -> None:
    """
    Executed once when a Celery worker child process starts.
    Loads CatVTON into GPU VRAM once, keeping it resident for all incoming jobs.
    """
    logger.info("Celery GPU worker process started. Pre-loading persistent CatVTON runtime...")
    try:
        from app.ai.catvton import CatVTONRuntime
        runtime = CatVTONRuntime.get_instance()
        runtime.ensure_loaded()
        logger.info(
            f"CatVTON runtime READY in worker (load_count={runtime.load_count}). Ready for job consumption."
        )
    except Exception as exc:
        logger.error(f"CatVTON runtime initialization failed in worker: {exc}", exc_info=True)


@worker_process_shutdown.connect
def on_worker_process_shutdown(**kwargs) -> None:
    """Executed when a Celery worker child process terminates."""
    logger.info("Celery try-on worker process shutting down cleanly.")
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
