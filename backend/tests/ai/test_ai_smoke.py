import pytest


@pytest.mark.gpu
@pytest.mark.ai_smoke
def test_cuda_hardware_availability():
    """Validates that CUDA and an NVIDIA GPU are available on hardware test runners."""
    import torch
    assert torch.cuda.is_available(), "CUDA is not available on this machine"
    device_count = torch.cuda.device_count()
    assert device_count >= 1, f"Expected at least 1 CUDA device, found {device_count}"
    name = torch.cuda.get_device_name(0)
    assert name, "CUDA device name is empty"


@pytest.mark.gpu
@pytest.mark.ai_smoke
def test_catvton_runtime_inspection():
    """Inspects CatVTON repository structure and weight presence."""
    from app.ai.catvton.validator import inspect_catvton_runtime
    inspection = inspect_catvton_runtime()
    assert inspection.root_exists, f"CatVTON root does not exist: {inspection.root_path}"
    assert inspection.model_dir_exists, "CatVTON model directory does not exist"
