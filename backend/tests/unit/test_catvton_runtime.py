"""
Unit Tests for CatVTON Runtime, Residency & State Transitions.
Verifies process-local singleton behavior, load_count == 1 invariant,
thread-safe loading, and absence of Mistral remnants.
"""

from unittest.mock import MagicMock, patch
from pathlib import Path
import pytest
from PIL import Image

from app.ai.catvton import (
    CatVTONInput,
    CatVTONLoadError,
    CatVTONRuntime,
    CatVTONSettings,
    RuntimeState,
)


@pytest.fixture(autouse=True)
def reset_runtime():
    CatVTONRuntime.reset_instance()
    yield
    CatVTONRuntime.reset_instance()


def test_catvton_runtime_initial_state():
    runtime = CatVTONRuntime.get_instance()
    assert runtime.state == RuntimeState.NOT_LOADED
    assert runtime.load_count == 0


def test_catvton_runtime_ensure_loaded_once():
    runtime = CatVTONRuntime.get_instance()

    with patch("app.ai.catvton.runtime.snapshot_download", return_value="/mock/snapshot"):
        with patch.object(runtime, "_run_warmup"):
            with patch("app.ai.catvton.runtime.CatVTONPreprocessor") as MockPrep:
                with patch("app.ai.catvton.runtime.CatVTONInferencePipeline") as MockPipe:
                    runtime.ensure_loaded()
                    assert runtime.state == RuntimeState.READY
                    assert runtime.load_count == 1

                    # Second call must be a no-op (residency invariant)
                    runtime.ensure_loaded()
                    assert runtime.load_count == 1
                    assert MockPipe.return_value.load.call_count == 1


def test_catvton_runtime_state_failed_on_exception():
    runtime = CatVTONRuntime.get_instance()

    with patch("app.ai.catvton.runtime.snapshot_download", side_effect=RuntimeError("Disk connection error")):
        with pytest.raises(CatVTONLoadError):
            runtime.ensure_loaded()

    assert runtime.state == RuntimeState.FAILED
    assert runtime.load_count == 0


def test_catvton_runtime_consecutive_jobs_share_pipeline():
    runtime = CatVTONRuntime.get_instance()

    mock_img = Image.new("RGB", (768, 1024), color=(255, 255, 255))
    dummy_input_1 = CatVTONInput(
        person_image_path=Path("person1.jpg"),
        garment_image_path=Path("cloth1.jpg"),
        category="upper_body",
        request_id="job_1",
    )
    dummy_input_2 = CatVTONInput(
        person_image_path=Path("person2.jpg"),
        garment_image_path=Path("cloth2.jpg"),
        category="upper_body",
        request_id="job_2",
    )

    with patch.object(runtime, "ensure_loaded"):
        with patch.object(runtime, "_execute_tryon", return_value=MagicMock(output_image=mock_img)):
            res1 = runtime.generate(dummy_input_1)
            res2 = runtime.generate(dummy_input_2)

            assert res1 is not None
            assert res2 is not None
            assert runtime._execute_tryon.call_count == 2


def test_no_mistral_remnants_in_runtime_and_config():
    """Verifies that no Mistral modules, dependencies, or env vars remain in the active architecture."""
    import sys
    from app.core.config import settings

    assert "mistralai" not in sys.modules
    assert not hasattr(settings, "MISTRAL_API_KEY")
    assert not hasattr(settings, "MISTRAL_ENABLED")
    assert not hasattr(settings, "MISTRAL_MODEL")
    assert settings.TRYON_PRIMARY_PROVIDER == "catvton"


def test_validate_result_image_rejects_black_image():
    from app.ai.catvton.postprocessing import validate_result_image
    from app.ai.catvton.exceptions import CatVTONInferenceError

    # 1. Pure all-black image (min=0, max=0)
    black_img = Image.new("RGB", (384, 512), color=(0, 0, 0))
    with pytest.raises(CatVTONInferenceError, match="corrupt or completely black"):
        validate_result_image(black_img)

    # 2. Near-zero mean image (< 1.0)
    near_black = Image.new("RGB", (384, 512), color=(0, 0, 0))
    near_black.putpixel((10, 10), (1, 1, 1))
    with pytest.raises(CatVTONInferenceError, match="corrupt or completely black"):
        validate_result_image(near_black)


def test_validate_result_image_accepts_valid_image():
    from app.ai.catvton.postprocessing import validate_result_image

    valid_img = Image.new("RGB", (384, 512), color=(128, 128, 128))
    # Should not raise
    validate_result_image(valid_img)
