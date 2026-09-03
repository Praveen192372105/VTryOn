import pytest
from app.core.config import Settings
from app.workers.celery_app import celery_app


def test_celery_queue_topology_and_isolation():
    """Verify that Celery is configured with isolated GPU and default queues."""
    queue_names = {q.name for q in celery_app.conf.task_queues}
    assert "gpu" in queue_names
    assert "default" in queue_names

    # Default queue must be 'default' to prevent accidental GPU routing
    assert celery_app.conf.task_default_queue == "default"


def test_celery_task_routing():
    """Verify explicit task routing for GPU and default tasks."""
    routes = celery_app.conf.task_routes
    assert routes["tryon.process"]["queue"] == "gpu"
    assert routes["media.cleanup"]["queue"] == "default"


def test_celery_serialization_security():
    """Verify JSON-only serialization with strict pickle prohibition."""
    assert celery_app.conf.task_serializer == "json"
    assert celery_app.conf.result_serializer == "json"
    assert celery_app.conf.accept_content == ["json"]


def test_celery_worker_reliability_settings():
    """Verify GPU worker prefetch, late acknowledgments, and result TTL."""
    assert celery_app.conf.worker_prefetch_multiplier == 1
    assert celery_app.conf.task_acks_late is True
    assert celery_app.conf.task_reject_on_worker_lost is True
    assert celery_app.conf.result_expires == 3600


def test_celery_timeout_hierarchy():
    """Verify soft_time_limit < hard_time_limit < visibility_timeout."""
    soft = celery_app.conf.task_soft_time_limit
    hard = celery_app.conf.task_time_limit
    visibility = celery_app.conf.broker_transport_options["visibility_timeout"]

    assert soft > 0
    assert hard > soft
    assert visibility > hard


def test_celery_settings_validation_rejects_invalid_timeouts():
    """Verify Settings rejects invalid timeout hierarchies at startup."""
    with pytest.raises(ValueError, match="strictly greater than CELERY_GPU_SOFT_TIME_LIMIT_SECONDS"):
        Settings(
            CELERY_GPU_SOFT_TIME_LIMIT_SECONDS=300,
            CELERY_GPU_TIME_LIMIT_SECONDS=300,  # Invalid: not greater
        )

    with pytest.raises(ValueError, match="strictly greater than CELERY_GPU_TIME_LIMIT_SECONDS"):
        Settings(
            CELERY_GPU_SOFT_TIME_LIMIT_SECONDS=200,
            CELERY_GPU_TIME_LIMIT_SECONDS=300,
            CELERY_VISIBILITY_TIMEOUT_SECONDS=250,  # Invalid: less than hard limit
        )
