"""
V Try-On Image Processing & Output Encoding
============================================
Lightweight, self-contained Pillow-based postprocessing, sanitization,
and cryptographic hashing for generated try-on images.
Zero dependencies on PyTorch or local GPU models.
"""

from dataclasses import dataclass
import hashlib
import io
import logging
from typing import Tuple
from PIL import Image

logger = logging.getLogger("vtryon.ai.processing")


class ImageProcessingError(Exception):
    """Raised when an output image fails validation, sanitization, or encoding."""
    pass


@dataclass(frozen=True)
class EncodedTryOnResult:
    """Canonical encoded representation of a synthesized try-on image."""
    data: bytes
    mime_type: str
    extension: str
    width: int
    height: int
    size_bytes: int
    sha256: str


def validate_and_normalize_output(
    image: Image.Image,
    min_width: int = 100,
    min_height: int = 100,
) -> Image.Image:
    """
    Validate that the generated object is a valid, non-empty RGB PIL image.
    Converts RGBA or grayscale images into canonical RGB mode.
    """
    if not isinstance(image, Image.Image):
        raise ImageProcessingError("Try-on provider did not return a valid PIL Image object.")

    if image.width < min_width or image.height < min_height:
        raise ImageProcessingError(
            f"Generated image dimensions ({image.width}x{image.height}) are below minimum threshold ({min_width}x{min_height})."
        )

    if image.mode != "RGB":
        image = image.convert("RGB")

    return image


def encode_tryon_result(
    image: Image.Image,
    format: str = "JPEG",
    quality: int = 95,
) -> EncodedTryOnResult:
    """
    Sanitize, strip metadata, canonically encode, and compute SHA-256 over result image bytes.
    """
    norm_image = validate_and_normalize_output(image)

    buf = io.BytesIO()
    fmt_upper = format.upper()
    if fmt_upper in ("JPEG", "JPG"):
        norm_image.save(buf, format="JPEG", quality=quality, optimize=True)
        mime_type = "image/jpeg"
        extension = "jpg"
    elif fmt_upper == "PNG":
        norm_image.save(buf, format="PNG", optimize=True)
        mime_type = "image/png"
        extension = "png"
    else:
        norm_image.save(buf, format="JPEG", quality=quality)
        mime_type = "image/jpeg"
        extension = "jpg"

    encoded_bytes = buf.getvalue()
    sha256_hash = hashlib.sha256(encoded_bytes).hexdigest()

    return EncodedTryOnResult(
        data=encoded_bytes,
        mime_type=mime_type,
        extension=extension,
        width=norm_image.width,
        height=norm_image.height,
        size_bytes=len(encoded_bytes),
        sha256=sha256_hash,
    )


__all__ = [
    "ImageProcessingError",
    "EncodedTryOnResult",
    "validate_and_normalize_output",
    "encode_tryon_result",
]
