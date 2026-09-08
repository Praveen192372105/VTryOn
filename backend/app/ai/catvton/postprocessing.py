"""
Postprocessing, validation, and encoding utilities for CatVTON results.
"""

import hashlib
import io
from dataclasses import dataclass
from typing import Tuple
import numpy as np
from PIL import Image, ImageFilter
from app.ai.catvton.exceptions import CatVTONInferenceError


@dataclass(frozen=True)
class EncodedResult:
    data: bytes
    sha256: str
    width: int
    height: int
    size_bytes: int
    mime_type: str


def validate_result_image(image: Image.Image, min_width: int = 256, min_height: int = 256) -> None:
    """Validates that the output image is valid, non-empty, and has expected dimensions."""
    if not isinstance(image, Image.Image):
        raise CatVTONInferenceError("Result is not a valid PIL Image instance.")
    
    w, h = image.size
    if w < min_width or h < min_height:
        raise CatVTONInferenceError(f"Result image dimensions ({w}x{h}) below minimum required ({min_width}x{min_height}).")

    arr = np.array(image)
    if arr.size == 0 or (int(arr.min()) == 0 and int(arr.max()) == 0) or float(arr.mean()) < 1.0:
        raise CatVTONInferenceError(
            f"Generated try-on output image is corrupt or completely black (min={arr.min()}, max={arr.max()}, mean={arr.mean():.2f})."
        )


def repaint_background(person_image: Image.Image, mask_image: Image.Image, result_image: Image.Image) -> Image.Image:
    """
    Blends the original background outside the agnostic try-on mask back onto the result.
    Smooths edge transitions with Gaussian blur.
    """
    _, h = result_image.size
    kernel_size = max(3, (h // 50) | 1)
    blurred_mask = mask_image.filter(ImageFilter.GaussianBlur(kernel_size))
    
    person_np = np.array(person_image.convert("RGB").resize(result_image.size, Image.Resampling.LANCZOS))
    result_np = np.array(result_image.convert("RGB"))
    mask_np = np.array(blurred_mask.convert("L").resize(result_image.size, Image.Resampling.NEAREST)) / 255.0
    mask_np = mask_np[..., np.newaxis]

    repainted = person_np * (1.0 - mask_np) + result_np * mask_np
    return Image.fromarray(np.clip(repainted, 0, 255).astype(np.uint8))


def encode_result(image: Image.Image, format: str = "JPEG", quality: int = 95) -> EncodedResult:
    """Encodes PIL Image into bytes in-memory and calculates SHA-256 checksum."""
    validate_result_image(image)
    rgb_image = image.convert("RGB")
    buf = io.BytesIO()
    
    fmt_upper = format.upper()
    if fmt_upper in ("JPEG", "JPG"):
        rgb_image.save(buf, format="JPEG", quality=quality, optimize=True)
        mime_type = "image/jpeg"
    elif fmt_upper == "PNG":
        rgb_image.save(buf, format="PNG", optimize=True)
        mime_type = "image/png"
    else:
        rgb_image.save(buf, format="JPEG", quality=quality)
        mime_type = "image/jpeg"

    raw_bytes = buf.getvalue()
    sha256 = hashlib.sha256(raw_bytes).hexdigest()
    w, h = rgb_image.size
    
    return EncodedResult(
        data=raw_bytes,
        sha256=sha256,
        width=w,
        height=h,
        size_bytes=len(raw_bytes),
        mime_type=mime_type,
    )
