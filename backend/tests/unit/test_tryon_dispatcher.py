from unittest.mock import MagicMock, patch
import pytest

from app.core.exceptions import QueueSubmissionError
from app.workers.dispatchers import (
    CeleryTryOnJobDispatcher,
    InMemoryTryOnJobDispatcher,
)


def test_celery_dispatcher_passes_only_job_id():
    """Verify CeleryTryOnJobDispatcher passes strictly job_public_id to delay()."""
    dispatcher = CeleryTryOnJobDispatcher()
    job_id = "job_01j7q9abcde123456789012345"

    with patch("app.workers.tasks.tryons.process_tryon_job.delay") as mock_delay:
        mock_task = MagicMock()
        mock_task.id = "task_abc123"
        mock_delay.return_value = mock_task

        task_id = dispatcher.dispatch(job_id)

        assert task_id == "task_abc123"
        mock_delay.assert_called_once_with(job_id)

        # Assert no other metadata, user data, or paths were passed
        args, kwargs = mock_delay.call_args
        assert len(args) == 1
        assert args[0] == job_id
        assert len(kwargs) == 0


def test_celery_dispatcher_rejects_empty_or_invalid_job_id():
    dispatcher = CeleryTryOnJobDispatcher()
    with pytest.raises(ValueError):
        dispatcher.dispatch("")
    with pytest.raises(ValueError):
        dispatcher.dispatch(None)  # type: ignore


def test_celery_dispatcher_wraps_broker_errors():
    """Verify transport/broker exceptions are converted to QueueSubmissionError."""
    dispatcher = CeleryTryOnJobDispatcher()

    with patch("app.workers.tasks.tryons.process_tryon_job.delay", side_effect=Exception("Redis connection refused")):
        with pytest.raises(QueueSubmissionError, match="Could not submit job to processing queue"):
            dispatcher.dispatch("job_01j7q9abcde123456789012345")


def test_in_memory_dispatcher():
    dispatcher = InMemoryTryOnJobDispatcher()
    assert dispatcher.dispatch("job_1") == "mock_task_1"
    assert dispatcher.dispatch("job_2") == "mock_task_2"
    assert dispatcher.dispatched_jobs == ["job_1", "job_2"]

    dispatcher.clear()
    assert len(dispatcher.dispatched_jobs) == 0

    failing_dispatcher = InMemoryTryOnJobDispatcher(should_fail=True)
    with pytest.raises(QueueSubmissionError):
        failing_dispatcher.dispatch("job_fail")
