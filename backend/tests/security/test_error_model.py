import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from PIL import Image

from app.core.exceptions import ServiceUnavailableError
from app.core.rate_limit import RateLimitExceededError
from app.core.security import create_access_token, get_password_hash
from app.db.models.outfit import Outfit
from app.db.models.user import User
from app.domain.enums import OutfitCategory
from app.domain.ids import ResourcePrefix, generate_public_id
from app.storage.local import default_storage


def create_user(db_session: Session, idx: int) -> tuple[User, str, dict]:
    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email=f"err_user_{idx}_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
        name=f"Error User {idx}",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token, _ = create_access_token(user_public_id=user.public_id)
    headers = {"Authorization": f"Bearer {token}"}
    return user, token, headers


def assert_canonical_error_envelope(response, expected_status: int, expected_code: str):
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}: {response.text}"
    body = response.json()

    # Canonical envelope checks
    assert body["success"] is False
    assert "error" in body
    assert body["error"]["code"] == expected_code
    assert isinstance(body["error"]["message"], str)
    assert len(body["error"]["message"]) > 0
    assert "request_id" in body
    assert body["request_id"].startswith("req_") or len(body["request_id"]) > 0
    assert response.headers.get("X-Request-ID") == body["request_id"]


def test_400_bad_request_envelope(client: TestClient, db_session: Session):
    """Test 400 Bad Request on inactive outfit."""
    user, _, headers = create_user(db_session, 1)

    from app.db.models.upload import Upload
    from app.domain.enums import UploadStatus

    upload = Upload(
        public_id=generate_public_id(ResourcePrefix.UPLOAD),
        user_id=user.id,
        storage_key="uploads/test.jpg",
        original_filename="test.jpg",
        mime_type="image/jpeg",
        size_bytes=100,
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit = Outfit(
        public_id=generate_public_id(ResourcePrefix.OUTFIT),
        name="Inactive Hat",
        slug="inactive-hat-400",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key="outfits/hat.jpg",
        is_active=False,
    )
    db_session.add(outfit)
    db_session.commit()

    res = client.post(
        "/api/v1/try-ons",
        headers=headers,
        json={"person_upload_id": upload.public_id, "outfit_id": outfit.public_id},
    )
    assert_canonical_error_envelope(res, 400, "OUTFIT_INACTIVE")


def test_401_unauthorized_envelope(client: TestClient):
    """Test 401 Unauthorized with WWW-Authenticate header."""
    res = client.get("/api/v1/users/me")
    assert_canonical_error_envelope(res, 401, "AUTHENTICATION_REQUIRED")
    assert res.headers.get("WWW-Authenticate") == "Bearer"


def test_404_not_found_envelope(client: TestClient, db_session: Session):
    """Test 404 Not Found on nonexistent resource."""
    _, _, headers = create_user(db_session, 2)
    res = client.get(f"/api/v1/outfits/{generate_public_id(ResourcePrefix.OUTFIT)}", headers=headers)
    assert_canonical_error_envelope(res, 404, "OUTFIT_NOT_FOUND")


def test_409_conflict_envelope(client: TestClient, db_session: Session):
    """Test 409 Conflict on duplicate email registration."""
    user, _, _ = create_user(db_session, 3)
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Duplicate", "email": user.email, "password": "Password123!"},
    )
    assert_canonical_error_envelope(res, 409, "EMAIL_ALREADY_REGISTERED")


def test_413_payload_too_large_envelope(client: TestClient, db_session: Session):
    """Test 413 Payload Too Large on oversized upload."""
    _, _, headers = create_user(db_session, 4)
    # 13 MB exceeds 12 MB max upload
    oversized_data = b"0" * (13 * 1024 * 1024)
    files = {"file": ("large.jpg", oversized_data, "image/jpeg")}
    res = client.post("/api/v1/uploads/person", headers=headers, files=files)
    assert_canonical_error_envelope(res, 413, "UPLOAD_TOO_LARGE")


def test_415_unsupported_media_type_envelope(client: TestClient, db_session: Session):
    """Test 415 Unsupported Media Type on unsupported format (e.g. BMP)."""
    _, _, headers = create_user(db_session, 5)
    # Real BMP image
    bmp_header = (
        b"BM"  # Signature
        + (100).to_bytes(4, "little")
        + b"\x00\x00\x00\x00"
        + (54).to_bytes(4, "little")
        + (40).to_bytes(4, "little")
        + (1).to_bytes(4, "little")
        + (1).to_bytes(4, "little")
        + (1).to_bytes(2, "little")
        + (24).to_bytes(2, "little")
        + b"\x00" * 24
        + b"\xff\x00\x00\x00"
    )
    files = {"file": ("test.bmp", bmp_header, "image/bmp")}
    res = client.post("/api/v1/uploads/person", headers=headers, files=files)
    assert_canonical_error_envelope(res, 415, "UNSUPPORTED_IMAGE_TYPE")


def test_422_validation_error_envelope(client: TestClient):
    """Test 422 Unprocessable Entity on schema validation failure."""
    res = client.post("/api/v1/auth/register", json={"email": "invalid_email_no_at"})
    assert_canonical_error_envelope(res, 422, "VALIDATION_ERROR")
    body = res.json()
    assert isinstance(body["error"]["details"], list)
    assert len(body["error"]["details"]) > 0


def test_429_too_many_requests_envelope(client: TestClient, db_session: Session):
    """Test 429 Too Many Requests with Retry-After header."""
    _, _, headers = create_user(db_session, 6)

    # Use dependency override or trigger rate limit directly
    from app.main import app
    from app.core.rate_limit import RateLimitDecision, RateLimiter, get_rate_limiter

    class DenyingLimiter:
        def check(self, *, key: str, limit: int, window_seconds: int) -> RateLimitDecision:
            return RateLimitDecision(allowed=False, limit=limit, remaining=0, reset_seconds=45, retry_after=45)

    app.dependency_overrides[get_rate_limiter] = lambda: DenyingLimiter()
    try:
        res = client.post(
            "/api/v1/try-ons",
            headers=headers,
            json={
                "person_upload_id": generate_public_id(ResourcePrefix.UPLOAD),
                "outfit_id": generate_public_id(ResourcePrefix.OUTFIT),
            },
        )
        assert_canonical_error_envelope(res, 429, "RATE_LIMIT_EXCEEDED")
        assert res.headers.get("Retry-After") == "45"
    finally:
        app.dependency_overrides.pop(get_rate_limiter, None)


def test_500_internal_server_error_envelope(client: TestClient, db_session: Session):
    """Test 500 Internal Server Error sanitizes sensitive stack traces."""
    _, _, headers = create_user(db_session, 7)
    from unittest.mock import patch

    client.raise_server_exceptions = False
    with patch("app.services.tryon_service.TryOnService.get_job", side_effect=RuntimeError("Secret internal path /var/run/cuda")):
        res = client.get(f"/api/v1/try-ons/{generate_public_id(ResourcePrefix.TRYON_JOB)}", headers=headers)

    assert_canonical_error_envelope(res, 500, "INTERNAL_SERVER_ERROR")
    # Must NOT expose stack trace or secret path
    assert "Secret internal path" not in res.text
    assert "/var/run/cuda" not in res.text


def test_503_service_unavailable_envelope(client: TestClient):
    """Test 503 Service Unavailable when core dependency is unreachable."""
    from unittest.mock import patch

    with patch("app.api.v1.endpoints.health.check_redis_connectivity", return_value=False):
        res = client.get("/api/v1/health/ready")

    assert_canonical_error_envelope(res, 503, "REDIS_UNAVAILABLE")
