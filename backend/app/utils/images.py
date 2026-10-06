import hashlib
import io
import re
from dataclasses import dataclass
from typing import Optional

from PIL import Image, ImageFile, ImageOps

from app.core.config import settings
from app.core.exceptions import (
    AnimatedImageNotSupportedError,
    ImageDimensionsInvalidError,
    ImagePixelLimitExceededError,
    InvalidImageError,
    InvalidStorageKeyError,
    UnsupportedImageTypeError,
)

# Reject truncated images to avoid corrupted decoding
ImageFile.LOAD_TRUNCATED_IMAGES = False

# Supported raster image formats for decoding
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


@dataclass(frozen=True)
class NormalizedImage:
    """
    Representation of a decoded, sanitized, and normalized image buffer.
    All EXIF/GPS metadata has been stripped, and pixels are normalized to RGB.
    """
    data: bytes
    format: str
    extension: str
    mime_type: str
    width: int
    height: int
    size_bytes: int
    sha256: str


def build_person_storage_key(
    *,
    user_public_id: str,
    upload_public_id: str,
    extension: str = "jpg",
) -> str:
    """
    Generate a server-controlled, deterministic POSIX storage key.
    Format: people/<user_public_id>/<upload_public_id>.<extension>
    Strictly validates component characters to prevent path injection.
    """
    clean_user = user_public_id.strip()
    clean_upload = upload_public_id.strip()
    clean_ext = extension.lstrip(".").lower().strip()

    if not re.match(r"^usr_[0-9a-zA-Z]+$", clean_user):
        raise InvalidStorageKeyError(f"Invalid user identifier for storage key: '{clean_user}'")

    if not re.match(r"^upl_[0-9a-zA-Z]+$", clean_upload):
        raise InvalidStorageKeyError(f"Invalid upload identifier for storage key: '{clean_upload}'")

    if not re.match(r"^[a-z0-9]+$", clean_ext):
        clean_ext = "jpg"

    return f"people/{clean_user}/{clean_upload}.{clean_ext}"


def normalize_person_image(
    data: bytes,
    *,
    min_width: Optional[int] = None,
    min_height: Optional[int] = None,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    max_pixels: Optional[int] = None,
) -> NormalizedImage:
    """
    Validate, sanitize, and normalize an untrusted image buffer for person try-on.
    1. Protects against decompression bombs via explicit pixel ceilings.
    2. Strictly decodes and verifies image integrity.
    3. Rejects unsupported formats (e.g. BMP, TIFF, GIF, SVG).
    4. Rejects animated WebP/GIF frames.
    5. Applies EXIF orientation transposition so images display upright.
    6. Enforces minimum and maximum dimensions.
    7. Converts any color mode (RGBA, CMYK, grayscale) to clean RGB with white alpha background.
    8. Discards all metadata (EXIF, GPS, camera model, comments).
    9. Re-encodes canonically to JPEG (quality=95).
    10. Computes SHA-256 over final persisted bytes.
    """
    if not data:
        raise InvalidImageError("Image data buffer is empty.")

    eff_min_w = min_width or settings.MIN_IMAGE_WIDTH
    eff_min_h = min_height or settings.MIN_IMAGE_HEIGHT
    eff_max_w = max_width or settings.MAX_IMAGE_WIDTH
    eff_max_h = max_height or settings.MAX_IMAGE_HEIGHT
    eff_max_pix = max_pixels or settings.MAX_IMAGE_PIXELS

    original_max_pixels = Image.MAX_IMAGE_PIXELS
    Image.MAX_IMAGE_PIXELS = eff_max_pix

    try:
        # Step 1: Open and verify basic image integrity
        with Image.open(io.BytesIO(data)) as raw_img:
            raw_format = (raw_img.format or "").upper()
            if raw_format not in ALLOWED_IMAGE_FORMATS:
                raise UnsupportedImageTypeError(
                    f"Unsupported image format '{raw_format}'. Allowed formats: JPEG, PNG, WebP."
                )
            # Verify file structure
            raw_img.verify()

        # Step 2: Reopen for pixel decoding and transformations
        with Image.open(io.BytesIO(data)) as img:
            # Step 3: Check for animation
            is_animated = getattr(img, "is_animated", False)
            n_frames = getattr(img, "n_frames", 1)
            if is_animated or n_frames > 1:
                raise AnimatedImageNotSupportedError(
                    "Animated images are not supported for person try-on."
                )

            # Step 4: Apply EXIF orientation
            try:
                transposed = ImageOps.exif_transpose(img)
                if transposed is not None:
                    img = transposed
            except Exception:
                # If EXIF transposition fails, proceed with original pixels
                pass

            # Step 5: Check dimension and pixel limits
            width, height = img.size
            if width < eff_min_w or height < eff_min_h:
                raise ImageDimensionsInvalidError(
                    f"Image dimensions ({width}x{height}) are below minimum required {eff_min_w}x{eff_min_h} pixels."
                )

            if width > eff_max_w or height > eff_max_h:
                raise ImageDimensionsInvalidError(
                    f"Image dimensions ({width}x{height}) exceed maximum allowed {eff_max_w}x{eff_max_h} pixels."
                )

            total_pixels = width * height
            if total_pixels > eff_max_pix:
                raise ImagePixelLimitExceededError(
                    f"Image total pixels ({total_pixels}) exceed maximum allowed limit of {eff_max_pix}."
                )

            # Step 6: Color mode normalization to RGB
            if img.mode in ("RGBA", "LA"):
                # Composite alpha against a pure white background
                background = Image.new("RGB", img.size, (255, 255, 255))
                alpha_channel = img.split()[-1]
                background.paste(img.convert("RGB"), mask=alpha_channel)
                normalized_img = background
            elif img.mode != "RGB":
                normalized_img = img.convert("RGB")
            else:
                normalized_img = img.copy()

            # Step 7: Fresh canonical re-encoding (Metadata & EXIF stripped)
            out_buffer = io.BytesIO()
            normalized_img.save(
                out_buffer,
                format="JPEG",
                quality=95,
                optimize=True,
            )
            canonical_bytes = out_buffer.getvalue()

    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ImagePixelLimitExceededError(
            f"Image decompression bomb detected or pixel limit exceeded: {str(exc)}"
        )
    except (UnsupportedImageTypeError, AnimatedImageNotSupportedError, ImageDimensionsInvalidError, ImagePixelLimitExceededError):
        raise
    except Exception as exc:
        raise InvalidImageError(f"Corrupt or invalid image file: {str(exc)}")
    finally:
        Image.MAX_IMAGE_PIXELS = original_max_pixels

    # Step 8: Content integrity hash over persisted bytes
    sha256_hash = hashlib.sha256(canonical_bytes).hexdigest()

    return NormalizedImage(
        data=canonical_bytes,
        format="JPEG",
        extension="jpg",
        mime_type="image/jpeg",
        width=width,
        height=height,
        size_bytes=len(canonical_bytes),
        sha256=sha256_hash,
    )


@dataclass
class ImageMetadata:
    width: int
    height: int
    format: str
    mode: str
    size_bytes: int


def convert_to_rgb(img: Image.Image) -> Image.Image:
    """Convert any image mode to RGB, flattening transparency over white background."""
    if img.mode in ("RGBA", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        alpha = img.split()[-1]
        background.paste(img.convert("RGB"), mask=alpha)
        return background
    elif img.mode != "RGB":
        return img.convert("RGB")
    return img


def detect_mime_type(data: bytes) -> str:
    """Detect MIME type from image bytes header."""
    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = (img.format or "").upper()
            if fmt == "PNG":
                return "image/png"
            elif fmt == "WEBP":
                return "image/webp"
            return "image/jpeg"
    except Exception:
        return "application/octet-stream"


def extract_image_metadata(data: bytes) -> ImageMetadata:
    """Extract dimension and format metadata from image bytes."""
    with Image.open(io.BytesIO(data)) as img:
        return ImageMetadata(
            width=img.width,
            height=img.height,
            format=img.format or "JPEG",
            mode=img.mode,
            size_bytes=len(data),
        )


def validate_image(data: bytes) -> bool:
    """Basic validation of image file integrity."""
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        return True
    except Exception:
        return False


def create_thumbnail(data: bytes, size: tuple[int, int] = (256, 341)) -> bytes:
    """Generate a JPEG thumbnail from image bytes."""
    with Image.open(io.BytesIO(data)) as img:
        rgb_img = convert_to_rgb(img)
        rgb_img.thumbnail(size, Image.Resampling.LANCZOS)
        out_buf = io.BytesIO()
        rgb_img.save(out_buf, format="JPEG", quality=85)
        return out_buf.getvalue()


