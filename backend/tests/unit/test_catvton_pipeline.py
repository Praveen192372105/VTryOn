from pathlib import Path
from PIL import Image
import pytest

from app.ai.catvton.exceptions import (
    CatVTONInvalidInputError,
    CatVTONOutOfMemoryError,
    CatVTONOutputError,
)
from app.ai.catvton.pipeline import CatVTONPipeline
from app.ai.catvton.postprocessing import encode_tryon_result, validate_and_normalize_output
from app.ai.catvton.preprocessing import (
    map_outfit_category,
    resize_and_crop,
    resize_and_padding,
)
from app.ai.catvton.types import TryOnInput
from app.domain.enums import OutfitCategory


def test_category_mapping_valid_and_invalid():
    assert map_outfit_category(OutfitCategory.UPPER_BODY) == "upper"
    assert map_outfit_category(OutfitCategory.LOWER_BODY) == "lower"
    assert map_outfit_category(OutfitCategory.DRESS) == "overall"
    assert map_outfit_category("upper_body") == "upper"
    assert map_outfit_category("dresses") == "overall"

    with pytest.raises(CatVTONInvalidInputError):
        map_outfit_category("unsupported_category_name")


def test_preprocessing_resize_and_padding():
    img = Image.new("RGB", (300, 300), color=(100, 150, 200))
    cropped = resize_and_crop(img, (200, 400))
    assert cropped.size == (200, 400)

    padded = resize_and_padding(img, (400, 500))
    assert padded.size == (400, 500)


def test_postprocessing_validation_and_encoding():
    img = Image.new("RGBA", (300, 400), color=(100, 120, 140, 255))
    norm = validate_and_normalize_output(img)
    assert norm.mode == "RGB"
    assert norm.size == (300, 400)

    # Encode to JPEG
    encoded = encode_tryon_result(norm, format="JPEG", quality=95)
    assert encoded.mime_type == "image/jpeg"
    assert encoded.extension == "jpg"
    assert encoded.width == 300
    assert encoded.height == 400
    assert len(encoded.sha256) == 64
    assert len(encoded.data) > 0


def test_postprocessing_rejects_invalid_output():
    with pytest.raises(CatVTONOutputError):
        validate_and_normalize_output("not_an_image")

    tiny = Image.new("RGB", (50, 50))
    with pytest.raises(CatVTONOutputError):
        validate_and_normalize_output(tiny)


def test_mock_pipeline_generate(tmp_path: Path):
    person_path = tmp_path / "person.jpg"
    garment_path = tmp_path / "garment.jpg"

    Image.new("RGB", (300, 400), color=(200, 150, 100)).save(str(person_path))
    Image.new("RGB", (300, 400), color=(50, 100, 150)).save(str(garment_path))

    pipeline = CatVTONPipeline(mock_mode=True)
    tryon_input = TryOnInput(
        person_path=person_path,
        garment_path=garment_path,
        garment_category=OutfitCategory.UPPER_BODY,
    )

    output = pipeline.generate(tryon_input)
    assert output.image is not None
    assert output.width > 0
    assert output.height > 0
    assert output.duration_ms >= 0
