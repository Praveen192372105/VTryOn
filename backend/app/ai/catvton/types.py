from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Any, Dict, List, Optional
from PIL import Image

from app.domain.enums import OutfitCategory


class RuntimeState(StrEnum):
    NOT_LOADED = "not_loaded"
    LOADING = "loading"
    READY = "ready"
    FAILED = "failed"


# Backward-compatible alias
ModelState = RuntimeState


class CatVTONPrecision(StrEnum):
    FP16 = "fp16"
    BF16 = "bf16"
    FP32 = "fp32"
    NO = "no"


@dataclass(frozen=True)
class TryOnInput:
    """Internal normalized input contract for the CatVTON inference pipeline."""
    person_path: Path
    garment_path: Path
    garment_category: OutfitCategory | str = OutfitCategory.UPPER_BODY
    steps: Optional[int] = None
    guidance_scale: Optional[float] = None
    seed: Optional[int] = 555


@dataclass(frozen=True)
class TryOnOutput:
    """Internal raw inference output contract from the CatVTON model."""
    image: Image.Image
    width: int
    height: int
    duration_ms: float


@dataclass(frozen=True)
class EncodedTryOnResult:
    """Validated, sanitized, and canonically encoded virtual try-on result."""
    data: bytes
    mime_type: str
    extension: str
    width: int
    height: int
    size_bytes: int
    sha256: str


# Legacy / backward-compatible types
@dataclass
class CatVTONInput:
    person_image_path: str
    garment_image_path: str
    category: str = "upper_body"


@dataclass
class CatVTONOutput:
    image: Image.Image
    execution_time_seconds: float
    width: int
    height: int


@dataclass
class CatVTONRuntimeInspection:
    root_path: Path
    root_exists: bool
    model_dir_exists: bool
    densepose_exists: bool
    detectron2_exists: bool
    inference_script_exists: bool
    requirements_exists: bool
    torch_available: bool
    cuda_available: bool
    device_name: Optional[str]
    is_valid: bool
    issues: List[str]


@dataclass
class TryOnInferenceOptions:
    person_image_path: str
    garment_image_path: str
    category: str = "upper_body"
    num_inference_steps: int = 40
    guidance_scale: float = 2.5
    seed: Optional[int] = 555
    repaint: bool = False
