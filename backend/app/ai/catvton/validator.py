import logging
from pathlib import Path
from typing import List, Optional

from app.ai.catvton.config import ai_settings
from app.ai.catvton.types import CatVTONRuntimeInspection

logger = logging.getLogger("vtryon.ai.validator")


def inspect_catvton_runtime(custom_root: Optional[Path] = None) -> CatVTONRuntimeInspection:
    """
    Validate CatVTON repository integrity, required assets, and Python ML runtime dependencies.
    """
    root = (custom_root or ai_settings.root_path).resolve()
    issues: List[str] = []

    # 1. Check directory structure
    root_exists = root.is_dir()
    if not root_exists:
        issues.append(f"CatVTON root directory not found at: {root}")

    model_dir_exists = (root / "model").is_dir()
    if not model_dir_exists and root_exists:
        issues.append("Missing 'model/' package in CatVTON repository")

    densepose_exists = (root / "densepose").is_dir()
    detectron2_exists = (root / "detectron2").is_dir()
    inference_script_exists = (root / "inference.py").is_file()
    requirements_exists = (root / "requirements.txt").is_file()

    # 2. Check ML runtime packages
    torch_available = False
    cuda_available = False
    device_name: Optional[str] = None

    try:
        import torch
        torch_available = True
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            device_name = torch.cuda.get_device_name(0)
    except ImportError:
        issues.append("PyTorch is not installed in the active environment.")
    except Exception as exc:
        issues.append(f"PyTorch inspection error: {str(exc)}")

    is_valid = root_exists and model_dir_exists and inference_script_exists and len(issues) == 0

    logger.info(
        "catvton.runtime.inspect",
        extra={
            "event": "catvton.runtime.inspect",
            "root_exists": root_exists,
            "torch_available": torch_available,
            "cuda_available": cuda_available,
            "is_valid": is_valid,
        },
    )

    return CatVTONRuntimeInspection(
        root_path=root,
        root_exists=root_exists,
        model_dir_exists=model_dir_exists,
        densepose_exists=densepose_exists,
        detectron2_exists=detectron2_exists,
        inference_script_exists=inference_script_exists,
        requirements_exists=requirements_exists,
        torch_available=torch_available,
        cuda_available=cuda_available,
        device_name=device_name,
        is_valid=is_valid,
        issues=issues,
    )


validate_catvton_setup = inspect_catvton_runtime


class CatVTONValidator:
    """Class-based validator for CatVTON setup."""

    @staticmethod
    def inspect(custom_root: Optional[Path] = None) -> CatVTONRuntimeInspection:
        return inspect_catvton_runtime(custom_root)

