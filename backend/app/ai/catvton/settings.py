"""
Runtime settings and performance preset mappings for CatVTON.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings

@dataclass(frozen=True)
class CatVTONSettings:
    catvton_root: Path
    device: str
    mixed_precision: str
    width: int
    height: int
    inference_steps: int
    guidance_scale: float
    allow_tf32: bool
    repaint: bool
    warmup: bool
    target_latency_seconds: int
    hard_timeout_seconds: int
    cache_preprocessing: bool
    preset: str
    automasker_device: str = "cpu"
    base_model_path: str = "booksforcharlie/stable-diffusion-inpainting"
    resume_path: str = "zhengchong/CatVTON"
    attn_ckpt_version: str = "vitonhd"

    @classmethod
    def from_app_settings(cls, preset: Optional[str] = None) -> "CatVTONSettings":
        chosen_preset = (preset or getattr(settings, "CATVTON_PRESET", "balanced")).lower()
        
        # Base dimensions from settings
        width = int(getattr(settings, "CATVTON_WIDTH", 768))
        height = int(getattr(settings, "CATVTON_HEIGHT", 1024))
        steps = int(getattr(settings, "CATVTON_INFERENCE_STEPS", 30))

        # Adjust for preset if set
        if chosen_preset == "fast":
            width = 384
            height = 512
            steps = min(int(getattr(settings, "CATVTON_INFERENCE_STEPS", 8)), 10)
        elif chosen_preset == "balanced":
            width = 576
            height = 768
            steps = 20
        elif chosen_preset == "quality":
            width = 768
            height = 1024
            steps = 30

        dtype = getattr(settings, "CATVTON_DTYPE", "fp32" if getattr(settings, "CATVTON_DEVICE", "cuda") == "cpu" else "bf16").lower()
        if dtype not in ("fp16", "bf16", "fp32", "no"):
            dtype = "fp32" if getattr(settings, "CATVTON_DEVICE", "cuda") == "cpu" else "bf16"

        attn_version = getattr(settings, "CATVTON_ATTN_CKPT_VERSION", None)
        if not attn_version:
            attn_version = "vitonhd" if height <= 512 else "mix"

        raw_device = getattr(settings, "CATVTON_DEVICE", "cuda")
        if raw_device == "cuda":
            import torch
            if not torch.cuda.is_available():
                resolved_device = "cpu"
            else:
                resolved_device = "cuda"
        else:
            resolved_device = raw_device

        return cls(
            catvton_root=settings.resolved_catvton_root,
            device=resolved_device,
            mixed_precision=dtype,
            width=width,
            height=height,
            inference_steps=steps,
            guidance_scale=float(getattr(settings, "CATVTON_GUIDANCE_SCALE", 2.5)),
            allow_tf32=bool(getattr(settings, "CATVTON_ALLOW_TF32", True)),
            repaint=bool(getattr(settings, "CATVTON_REPAINT", False)),
            warmup=bool(getattr(settings, "CATVTON_WARMUP", True)),
            target_latency_seconds=int(getattr(settings, "CATVTON_TARGET_LATENCY_SECONDS", 60)),
            hard_timeout_seconds=int(getattr(settings, "CATVTON_HARD_TIMEOUT_SECONDS", 90)),
            cache_preprocessing=bool(getattr(settings, "CATVTON_CACHE_PREPROCESSING", True)),
            preset=chosen_preset,
            automasker_device=getattr(settings, "CATVTON_AUTOMASKER_DEVICE", "cpu"),
            attn_ckpt_version=attn_version,
        )

