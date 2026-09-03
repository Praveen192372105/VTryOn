import io
import pytest
from PIL import Image

from app.core.exceptions import (
    AnimatedImageNotSupportedError,
    ImageDimensionsInvalidError,
    ImagePixelLimitExceededError,
    InvalidImageError,
    UnsupportedImageTypeError,
)
from app.utils.images import build_person_storage_key, normalize_person_image


def create_test_image_bytes(format="JPEG", size=(300, 400), mode="RGB", color=(200, 100, 50)) -> bytes:
    img = Image.new(mode, size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def test_normalize_valid_jpeg():
    data = create_test_image_bytes(format="JPEG", size=(400, 500))
    norm = normalize_person_image(data, min_width=256, min_height=256)
    assert norm.format == "JPEG"
    assert norm.width == 400
    assert norm.height == 500
    assert norm.mime_type == "image/jpeg"
    assert len(norm.sha256) == 64


def test_normalize_valid_png_alpha_compositing():
    # Create RGBA image
    data = create_test_image_bytes(format="PNG", size=(300, 300), mode="RGBA", color=(100, 150, 200, 128))
    norm = normalize_person_image(data, min_width=256, min_height=256)
    assert norm.format == "JPEG"
    assert norm.mime_type == "image/jpeg"
    # Decoded normalized bytes should be RGB
    with Image.open(io.BytesIO(norm.data)) as img:
        assert img.mode == "RGB"


def test_normalize_valid_webp():
    data = create_test_image_bytes(format="WEBP", size=(350, 450))
    norm = normalize_person_image(data, min_width=256, min_height=256)
    assert norm.format == "JPEG"
    assert norm.width == 350
    assert norm.height == 450


def test_reject_corrupt_bytes():
    corrupt = b"not_an_image_binary_garbage_content_123456789"
    with pytest.raises(InvalidImageError):
        normalize_person_image(corrupt)


def test_reject_unsupported_format_bmp():
    data = create_test_image_bytes(format="BMP", size=(300, 300))
    with pytest.raises(UnsupportedImageTypeError):
        normalize_person_image(data)


def test_reject_unsupported_format_gif():
    data = create_test_image_bytes(format="GIF", size=(300, 300))
    with pytest.raises(UnsupportedImageTypeError):
        normalize_person_image(data)


def test_reject_below_minimum_dimensions():
    data = create_test_image_bytes(format="JPEG", size=(100, 100))
    with pytest.raises(ImageDimensionsInvalidError):
        normalize_person_image(data, min_width=256, min_height=256)


def test_reject_above_maximum_dimensions():
    data = create_test_image_bytes(format="JPEG", size=(500, 500))
    with pytest.raises(ImageDimensionsInvalidError):
        normalize_person_image(data, max_width=400, max_height=400)


def test_reject_pixel_limit_exceeded():
    data = create_test_image_bytes(format="JPEG", size=(500, 500))  # 250,000 pixels
    with pytest.raises(ImagePixelLimitExceededError):
        normalize_person_image(data, min_width=100, min_height=100, max_pixels=200_000)


def test_build_person_storage_key_valid_and_invalid():
    key = build_person_storage_key(user_public_id="usr_01m1h0001", upload_public_id="upl_01m1h0002")
    assert key == "people/usr_01m1h0001/upl_01m1h0002.jpg"

    # Directory traversal attempts in user id should be rejected
    from app.core.exceptions import InvalidStorageKeyError
    with pytest.raises(InvalidStorageKeyError):
        build_person_storage_key(user_public_id="../../etc", upload_public_id="upl_01m1h0002")
