import pytest
from pydantic import ValidationError

from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.tryon import CreateTryOnRequest


def test_register_request_validation():
    # Valid register
    req = RegisterRequest(
        name="  Jane Doe  ",
        email="User@Example.COM",
        password="secure-password-123",
    )
    assert req.name == "Jane Doe"  # Trimmed
    assert req.email == "user@example.com"  # Normalized

    # Invalid empty name
    with pytest.raises(ValidationError):
        RegisterRequest(name="   ", email="user@example.com", password="password123")

    # Short password
    with pytest.raises(ValidationError):
        RegisterRequest(name="Jane", email="user@example.com", password="123")


def test_login_request_validation():
    req = LoginRequest(email="User@Example.COM", password="password123")
    assert req.email == "user@example.com"


def test_create_tryon_request_validation():
    valid_upload_id = generate_public_id(ResourcePrefix.UPLOAD)
    valid_outfit_id = generate_public_id(ResourcePrefix.OUTFIT)

    # Valid try-on request
    req = CreateTryOnRequest(
        person_upload_id=valid_upload_id,
        outfit_id=valid_outfit_id,
    )
    assert req.person_upload_id == valid_upload_id
    assert req.outfit_id == valid_outfit_id

    # Invalid prefix for upload
    with pytest.raises(ValidationError):
        CreateTryOnRequest(
            person_upload_id="usr_01j7q9abcde123456789012345",
            outfit_id=valid_outfit_id,
        )

    # Invalid prefix for outfit
    with pytest.raises(ValidationError):
        CreateTryOnRequest(
            person_upload_id=valid_upload_id,
            outfit_id="upl_01j7q9abcde123456789012345",
        )
