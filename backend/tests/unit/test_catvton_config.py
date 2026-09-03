from pathlib import Path
import pytest

from app.ai.catvton.config import CatVTONSettings, ai_settings
from app.ai.catvton.engine import get_catvton_engine
from app.ai.catvton.exceptions import CatVTONConfigurationError
from app.ai.catvton.loader import get_model_load_state, reset_model_state_for_testing
from app.ai.catvton.types import ModelState
from app.ai.catvton.validator import inspect_catvton_runtime


def test_catvton_settings():
    assert ai_settings.device == "cuda"
    assert ai_settings.width == 768
    assert ai_settings.height == 1024
    assert ai_settings.checkpoint_dir == "zhengchong/CatVTON"


def test_catvton_validator_real_repo():
    inspection = inspect_catvton_runtime()
    assert inspection.root_exists is True
    assert inspection.model_dir_exists is True
    assert inspection.inference_script_exists is True


def test_catvton_validator_invalid_path(tmp_path):
    invalid_root = tmp_path / "nonexistent_catvton"
    inspection = inspect_catvton_runtime(custom_root=invalid_root)
    assert inspection.root_exists is False
    assert inspection.is_valid is False
    assert any("not found" in issue for issue in inspection.issues)


def test_catvton_mock_engine():
    engine = get_catvton_engine(mock=True)
    assert engine.mock_mode is True


def test_model_state_initial():
    reset_model_state_for_testing()
    state = get_model_load_state()
    assert state == ModelState.NOT_LOADED
