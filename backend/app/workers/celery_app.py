from celery import Celery
from kombu import Queue

from app.core.config import Settings, get_settings


def create_celery_app(cfg: Settings) -> Celery:
    """
    Configures and instantiates the Celery worker application from centralized Settings.
    Enforces GPU queue isolation, JSON serialization, late acknowledgements, and explicit routing.
    """
    app = Celery(
        "vtryon_workers",
        broker=cfg.CELERY_BROKER_URL,
        backend=cfg.CELERY_RESULT_BACKEND,
        include=[
            "app.workers.tasks.tryons",
            "app.workers.tasks",
            "app.workers.hooks",
        ],
    )

    # Production-grade Celery settings
    app.conf.update(
        # Serialization & Content Security: JSON only, strictly no pickle
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        # Result Backend: Operational/Diagnostics only, short TTL
        result_expires=3600,
        # Queue Topology & Isolation
        task_default_queue=cfg.CELERY_DEFAULT_QUEUE,
        task_queues=(
            Queue(cfg.CELERY_GPU_QUEUE),
            Queue(cfg.CELERY_DEFAULT_QUEUE),
        ),
        task_routes={
            "tryon.process": {"queue": cfg.CELERY_GPU_QUEUE},
            "app.workers.tasks.tryons.process_tryon_job": {"queue": cfg.CELERY_GPU_QUEUE},
            "media.cleanup": {"queue": cfg.CELERY_DEFAULT_QUEUE},
        },
        # GPU Worker Reliability: Prefetch exactly 1 task at a time, late ack
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        # Execution Boundaries & Time Limits
        task_time_limit=cfg.CELERY_GPU_TIME_LIMIT_SECONDS,
        task_soft_time_limit=cfg.CELERY_GPU_SOFT_TIME_LIMIT_SECONDS,
        # Broker Transport: Visibility timeout strictly exceeds hard task limit
        broker_transport_options={
            "visibility_timeout": cfg.CELERY_VISIBILITY_TIMEOUT_SECONDS,
        },
    )
    return app


celery_app = create_celery_app(get_settings())

__all__ = ["celery_app", "create_celery_app"]
