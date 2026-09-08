"""
Type definitions, metrics, and dataclasses for CatVTON Virtual Try-On Runtime.
"""

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Optional
from PIL import Image


class RuntimeState(StrEnum):
    NOT_LOADED = "NOT_LOADED"
    LOADING = "LOADING"
    READY = "READY"
    FAILED = "FAILED"


@dataclass(frozen=True)
class CatVTONInput:
    person_image_path: Path
    garment_image_path: Path
    category: str
    request_id: Optional[str] = None
    steps: Optional[int] = None


@dataclass(frozen=True)
class CatVTONMetrics:
    model_load_seconds: float
    preprocessing_seconds: float
    inference_seconds: float
    postprocessing_seconds: float
    total_seconds: float


@dataclass(frozen=True)
class CatVTONOutput:
    output_image: Image.Image
    width: int
    height: int
    execution_time_seconds: float
    metrics: CatVTONMetrics
    model_version: str = "CatVTON-SD15-Inpainting"
    inference_config_version: str = "v1-accurate"
