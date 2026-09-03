import io
import logging
from pathlib import Path
from typing import Any, Optional, Tuple, Union
from PIL import Image, ImageDraw, ImageFilter

from app.ai.catvton.exceptions import CatVTONInvalidInputError, CatVTONPreprocessingError
from app.domain.enums import OutfitCategory

logger = logging.getLogger("vtryon.ai.preprocessing")


def map_outfit_category(category: Union[OutfitCategory, str]) -> str:
    """
    Map backend OutfitCategory enum to CatVTON cloth_type string.
    Supported upstream values: 'upper', 'lower', 'overall'.
    """
    cat_val = category.value if hasattr(category, "value") else str(category).lower().strip()
    mapping = {
        "upper_body": "upper",
        "lower_body": "lower",
        "dresses": "overall",
        "dress": "overall",
        "upper": "upper",
        "lower": "lower",
        "overall": "overall",
    }
    if cat_val not in mapping:
        raise CatVTONInvalidInputError(f"Unsupported garment category '{category}'. Allowed: upper_body, lower_body, dresses.")
    return mapping[cat_val]


def resize_and_crop(image: Image.Image, size: Tuple[int, int]) -> Image.Image:
    """Resize and center-crop image to fill target dimensions."""
    target_w, target_h = size
    w, h = image.size
    scale = max(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    image = image.resize((new_w, new_h), Image.Resampling.BILINEAR)

    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    right = left + target_w
    bottom = top + target_h
    return image.crop((left, top, right, bottom))


def resize_and_padding(image: Image.Image, size: Tuple[int, int]) -> Image.Image:
    """Resize and center-pad image onto a pure white background."""
    target_w, target_h = size
    w, h = image.size
    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    image = image.resize((new_w, new_h), Image.Resampling.BILINEAR)

    padded = Image.new("RGB", size, (255, 255, 255))
    left = (target_w - new_w) // 2
    top = (target_h - new_h) // 2
    padded.paste(image, (left, top))
    return padded


def load_image_rgb(input_source: Union[str, Path, bytes, Image.Image]) -> Image.Image:
    """Safely decode and normalize any image input to an RGB PIL Image."""
    try:
        if isinstance(input_source, (str, Path)):
            with Image.open(str(input_source)) as img:
                return img.convert("RGB")
        elif isinstance(input_source, bytes):
            with Image.open(io.BytesIO(input_source)) as img:
                return img.convert("RGB")
        elif isinstance(input_source, Image.Image):
            return input_source.convert("RGB")
        else:
            raise CatVTONInvalidInputError(f"Unsupported image input type: {type(input_source)}")
    except CatVTONInvalidInputError:
        raise
    except Exception as exc:
        raise CatVTONInvalidInputError(f"Failed to decode image input: {str(exc)}") from exc


def prepare_images(
    person_image_input: Union[str, Path, bytes, Image.Image],
    garment_image_input: Union[str, Path, bytes, Image.Image],
    target_width: int = 768,
    target_height: int = 1024,
) -> Tuple[Image.Image, Image.Image]:
    """
    Load, normalize to RGB, and resize/pad images for CatVTON pipeline.
    """
    person_img = load_image_rgb(person_image_input)
    garment_img = load_image_rgb(garment_image_input)

    person_img = resize_and_crop(person_img, (target_width, target_height))
    garment_img = resize_and_padding(garment_img, (target_width, target_height))

    return person_img, garment_img


preprocess_for_catvton = prepare_images


def generate_fallback_mask(
    person_img: Image.Image,
    cloth_type: str,
) -> Image.Image:
    """
    Generate an approximate heuristic mask for testing or environments
    where SCHP/DensePose checkpoints are not loaded.
    """
    width, height = person_img.size
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)

    if cloth_type == "upper":
        # Torso and arm region
        draw.rectangle([int(width * 0.15), int(height * 0.20), int(width * 0.85), int(height * 0.60)], fill=255)
    elif cloth_type == "lower":
        # Lower body and legs
        draw.rectangle([int(width * 0.20), int(height * 0.50), int(width * 0.80), int(height * 0.95)], fill=255)
    else:  # overall / dress
        # Full torso down to ankles
        draw.rectangle([int(width * 0.15), int(height * 0.20), int(width * 0.85), int(height * 0.90)], fill=255)

    return mask.filter(ImageFilter.GaussianBlur(9))
