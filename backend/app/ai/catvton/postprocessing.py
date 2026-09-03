import hashlib
import io
from PIL import Image

from app.ai.catvton.exceptions import CatVTONOutputError
from app.ai.catvton.types import EncodedTryOnResult


def validate_and_normalize_output(
    image: Image.Image,
    min_width: int = 100,
    min_height: int = 100,
) -> Image.Image:
    """
    Validate that the generated object is a valid, non-empty RGB PIL image.
    """
    if not isinstance(image, Image.Image):
        raise CatVTONOutputError("CatVTON pipeline did not return a valid PIL Image object.")

    if image.width < min_width or image.height < min_height:
        raise CatVTONOutputError(
            f"Generated image dimensions ({image.width}x{image.height}) are below minimum acceptable threshold ({min_width}x{min_height})."
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

    # Encode to buffer (metadata stripped automatically when creating fresh save)
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
