import pytest

from app.ai.catvton.exceptions import (
    CatVTONModelLoadError,
    CatVTONModelUnavailableError,
)
from app.ai.catvton.runtime import CatVTONRuntime, RuntimeState


@pytest.fixture(autouse=True)
def reset_runtime():
    runtime = CatVTONRuntime.get_instance()
    runtime.reset_for_testing()
    yield
    runtime.reset_for_testing()


def test_runtime_initial_state_not_loaded():
    runtime = CatVTONRuntime.get_instance()
    assert runtime.state == RuntimeState.NOT_LOADED
    assert runtime.is_ready is False

    with pytest.raises(CatVTONModelUnavailableError):
        _ = runtime.components


def test_runtime_load_once_idempotency():
    runtime = CatVTONRuntime.get_instance()

    # First load
    runtime.load_once(force_mock=True)
    assert runtime.state == RuntimeState.READY
    assert runtime.is_ready is True
    assert runtime.load_count == 1

    # Second load (must be safe no-op)
    runtime.load_once(force_mock=True)
    assert runtime.state == RuntimeState.READY
    assert runtime.load_count == 1

    # Components accessible
    pipeline, automasker, processor = runtime.components
    assert pipeline == "MOCK_PIPELINE"
    assert automasker == "MOCK_AUTOMASKER"
    assert processor == "MOCK_PROCESSOR"


def test_runtime_failed_state_handling(monkeypatch):
    runtime = CatVTONRuntime.get_instance()

    # Force load failure by monkeypatching ai_settings.root
    from pathlib import Path
    from app.ai.catvton import config
    monkeypatch.setattr(config.ai_settings, "root", Path("non_existent_invalid_path_12345"))

    with pytest.raises(CatVTONModelLoadError):
        runtime.load_once(force_mock=False)

    assert runtime.state == RuntimeState.FAILED
    assert runtime.is_ready is False


def test_runtime_concurrency_semaphore():
    runtime = CatVTONRuntime.get_instance()
    assert runtime.semaphore._value == 1
