import logging
import sys
from celery.signals import worker_process_init, worker_process_shutdown

logger = logging.getLogger("vtryon.workers.hooks")


def is_gpu_worker() -> bool:
    """
    Determine if this Celery worker process was spawned to consume the GPU queue.
    Prevents lightweight/default workers from unnecessarily loading diffusion models.
    """
    args = " ".join(sys.argv).lower()
    if "-q default" in args or "--queues=default" in args or "--queues default" in args:
        if "gpu" not in args:
            return False
    if "gpu" in args:
        return True
    return False


@worker_process_init.connect
def on_worker_process_init(**kwargs) -> None:
    """
    Executed when a Celery worker child process starts.
    Queue-aware: Only loads CatVTON checkpoints when running as a dedicated GPU worker.
    """
    if not is_gpu_worker():
        logger.info("Celery worker process initialized for lightweight/default queue. Skipping GPU model pre-allocation.")
        return

    logger.info("Initializing GPU worker process environment and pre-allocating CatVTON runtime...")
    try:
        import torch
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            logger.info(f"CUDA detected: {device_name}. Initializing persistent CatVTON runtime...")
            from app.ai.catvton.runtime import CatVTONRuntime
            CatVTONRuntime.get_instance().load_once()
            vram_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 1)
            logger.info(f"CatVTON runtime persistent in GPU memory ({vram_mb} MB allocated). GPU Worker ready.")
        else:
            logger.info("No CUDA device available in this worker process. Deferring model load.")
    except Exception as exc:
        logger.warning(f"GPU worker model pre-allocation deferred or skipped: {str(exc)}")


@worker_process_shutdown.connect
def on_worker_process_shutdown(**kwargs) -> None:
    """
    Executed when a Celery worker child process terminates.
    Ensures safe resource reclamation.
    """
    logger.info("Celery worker process shutting down. Reclaiming resources.")
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
