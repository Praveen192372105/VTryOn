from unittest.mock import MagicMock, patch
import pytest

from app.core.exceptions import QueueSubmissionError
from app.workers.dispatchers import CeleryTryOnJobDispatcher, InMemoryTryOnJobDispatcher


def test_celery_dispatcher_passes_only_job_id():
    """
    CRITICAL INVARIANT TEST:
    Asserts that Celery dispatch receives ONLY the canonical job identifier string.
    """
    dispatcher = CeleryTryOnJobDispatcher()
    sample_job_id = "job_01j7q9abcde123456789012345"

    with patch("app.workers.tasks.tryons.process_tryon_job.delay") as mock_delay:
        mock_task = MagicMock()
        mock_task.id = "celery_task_12345"
        mock_delay.return_value = mock_task

        task_id = dispatcher.dispatch(sample_job_id)

        assert task_id == "celery_task_12345"
        mock_delay.assert_called_once_with(sample_job_id)

        # Assert no extra arguments or objects were passed to Celery
        call_args = mock_delay.call_args[0]
        assert len(call_args) == 1
        assert call_args[0] == sample_job_id
        assert isinstance(call_args[0], str)


def test_celery_dispatcher_handles_broker_failure():
    dispatcher = CeleryTryOnJobDispatcher()
    sample_job_id = "job_01j7q9abcde123456789012345"

    with patch("app.workers.tasks.tryons.process_tryon_job.delay", side_effect=Exception("Redis connection refused")):
        with pytest.raises(QueueSubmissionError) as exc_info:
            dispatcher.dispatch(sample_job_id)
        assert "could not submit job" in exc_info.value.message.lower()


def test_in_memory_dispatcher():
    dispatcher = InMemoryTryOnJobDispatcher()
    job_id = "job_01j7q9abcde123456789012345"
    task_id = dispatcher.dispatch(job_id)

    assert task_id.startswith("mock_task_")
    assert job_id in dispatcher.dispatched_jobs
    dispatcher.clear()
    assert len(dispatcher.dispatched_jobs) == 0
