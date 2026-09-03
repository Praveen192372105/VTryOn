import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models.outfit import Outfit
from app.db.models.upload import Upload
from app.db.models.user import User
from app.domain.enums import OutfitCategory, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id


@pytest.fixture
def auth_headers(db_session: Session, client: TestClient):
    """Register and log in a test user, returning auth Bearer headers."""
    email = f"idempotency_{generate_public_id(ResourcePrefix.USER)}@example.com"
    pwd = "StrongPassword123!"
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": pwd},
    )
    assert reg_resp.status_code == 201

    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    user_id = login_resp.json()["data"]["user"]["id"]
    return {"Authorization": f"Bearer {token}"}, user_id


@pytest.fixture
def setup_upload_and_outfits(db_session: Session, auth_headers):
    headers, user_public_id = auth_headers
    user = db_session.query(User).filter(User.public_id == user_public_id).first()

    # Create active person upload
    upload = Upload(
        public_id=generate_public_id(ResourcePrefix.UPLOAD),
        user_id=user.id,
        storage_key=f"people/{user.public_id}/test_photo.jpg",
        original_filename="photo.jpg",
        mime_type="image/jpeg",
        size_bytes=10240,
        width=1024,
        height=1024,
        sha256="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        status=UploadStatus.ACTIVE,
    )
    db_session.add(upload)

    # Create two outfits
    outfit1 = Outfit(
        public_id=generate_public_id(ResourcePrefix.OUTFIT),
        name="Summer Dress",
        slug=f"summer-dress-{generate_public_id(ResourcePrefix.OUTFIT)}",
        category=OutfitCategory.DRESS.value,
        image_storage_key="outfits/summer_dress.jpg",
        is_active=True,
    )
    outfit2 = Outfit(
        public_id=generate_public_id(ResourcePrefix.OUTFIT),
        name="Leather Jacket",
        slug=f"leather-jacket-{generate_public_id(ResourcePrefix.OUTFIT)}",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/leather_jacket.jpg",
        is_active=True,
    )
    db_session.add(outfit1)
    db_session.add(outfit2)
    db_session.commit()

    return upload.public_id, outfit1.public_id, outfit2.public_id


@pytest.mark.service
def test_idempotent_tryon_submission_replay(client: TestClient, auth_headers, setup_upload_and_outfits):
    headers, _ = auth_headers
    upload_id, outfit1_id, _ = setup_upload_and_outfits
    idempotency_key = "idemp_test_key_abc_123"

    request_payload = {
        "person_upload_id": upload_id,
        "outfit_id": outfit1_id,
    }

    # 1. First submission: creates job
    resp1 = client.post(
        "/api/v1/try-ons",
        json=request_payload,
        headers={**headers, "Idempotency-Key": idempotency_key},
    )
    assert resp1.status_code == 202
    data1 = resp1.json()["data"]
    job1_id = data1["id"]
    assert data1["status"] == "queued"
    assert data1["idempotency_key"] == idempotency_key

    # 2. Second submission with exact same key and payload: idempotent replay
    resp2 = client.post(
        "/api/v1/try-ons",
        json=request_payload,
        headers={**headers, "Idempotency-Key": idempotency_key},
    )
    assert resp2.status_code == 202
    data2 = resp2.json()["data"]
    assert data2["id"] == job1_id  # Returns exact same job ID!
    assert data2["idempotency_key"] == idempotency_key


@pytest.mark.service
def test_idempotent_tryon_submission_conflict(client: TestClient, auth_headers, setup_upload_and_outfits):
    headers, _ = auth_headers
    upload_id, outfit1_id, outfit2_id = setup_upload_and_outfits
    idempotency_key = "idemp_test_conflict_key_456"

    # 1. First submission with outfit1
    resp1 = client.post(
        "/api/v1/try-ons",
        json={"person_upload_id": upload_id, "outfit_id": outfit1_id},
        headers={**headers, "Idempotency-Key": idempotency_key},
    )
    assert resp1.status_code == 202

    # 2. Reused key with different outfit -> 409 Conflict
    resp2 = client.post(
        "/api/v1/try-ons",
        json={"person_upload_id": upload_id, "outfit_id": outfit2_id},
        headers={**headers, "Idempotency-Key": idempotency_key},
    )
    assert resp2.status_code == 409
    err = resp2.json()["error"]
    assert "IDEMPOTENCY_KEY_REUSED" in err["message"] or "already used" in err["message"]


@pytest.mark.service
def test_invalid_idempotency_key_format(client: TestClient, auth_headers, setup_upload_and_outfits):
    headers, _ = auth_headers
    upload_id, outfit1_id, _ = setup_upload_and_outfits

    # Control character in Idempotency-Key
    resp = client.post(
        "/api/v1/try-ons",
        json={"person_upload_id": upload_id, "outfit_id": outfit1_id},
        headers={**headers, "Idempotency-Key": "bad key with spaces and \x00 null"},
    )
    assert resp.status_code == 422
