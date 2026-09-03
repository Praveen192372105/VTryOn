from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from PIL import Image

from app.core.config import settings
from app.core.redis import redis_admission_lock
from app.core.security import create_access_token, get_password_hash
from app.db.models.outfit import Outfit
from app.db.models.tryon import TryOnJob
from app.db.models.upload import Upload
from app.db.models.user import User
from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.storage.local import default_storage


def create_user_and_media(db_session: Session, idx: int) -> tuple[User, str, dict, Upload, Outfit]:
    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email=f"cap_user_{idx}_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
        name=f"Cap User {idx}",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token, _ = create_access_token(user_public_id=user.public_id)
    headers = {"Authorization": f"Bearer {token}"}

    img = Image.new("RGB", (768, 1024), color=(220, 220, 220))
    raw_bytes = img.tobytes()

    person_key = f"uploads/{user.public_id}/person.jpg"
    default_storage.save(person_key, raw_bytes, content_type="image/jpeg")
    upload = Upload(
        public_id=generate_public_id(ResourcePrefix.UPLOAD),
        user_id=user.id,
        storage_key=person_key,
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=len(raw_bytes),
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit_key = f"outfits/shirt_{user.id}.jpg"
    default_storage.save(outfit_key, raw_bytes, content_type="image/jpeg")
    outfit = Outfit(
        public_id=generate_public_id(ResourcePrefix.OUTFIT),
        name="Cotton Shirt",
        slug=f"shirt-cap-{user.id}-{generate_public_id(ResourcePrefix.OUTFIT)[-6:]}",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key=outfit_key,
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()

    return user, token, headers, upload, outfit


def test_user_active_tryon_capacity_limit_exceeded(client: TestClient, db_session: Session):
    """
    Test that a user with MAX_ACTIVE_TRYONS_PER_USER active jobs (QUEUED/PROCESSING)
    is rejected with HTTP 429 and error code TRYON_CAPACITY_LIMIT.
    Ensures NO new job is created in MySQL and NO Celery task is dispatched.
    """
    user, _, headers, upload, outfit = create_user_and_media(db_session, 1)

    # Pre-seed MAX_ACTIVE_TRYONS_PER_USER active jobs for this user
    max_active = settings.MAX_ACTIVE_TRYONS_PER_USER
    for i in range(max_active):
        job = TryOnJob(
            public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
            user_id=user.id,
            person_upload_id=upload.id,
            outfit_id=outfit.id,
            status=TryOnJobStatus.QUEUED.value if i == 0 else TryOnJobStatus.PROCESSING.value,
        )
        db_session.add(job)
    db_session.commit()

    initial_job_count = db_session.query(TryOnJob).filter_by(user_id=user.id).count()
    assert initial_job_count == max_active

    mock_dispatch = MagicMock()
    with patch("app.workers.dispatchers.CeleryTryOnJobDispatcher.dispatch", mock_dispatch):
        res = client.post(
            "/api/v1/try-ons",
            headers=headers,
            json={"person_upload_id": upload.public_id, "outfit_id": outfit.public_id},
        )

    # Must return 429 Too Many Requests
    assert res.status_code == 429
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "TRYON_CAPACITY_LIMIT"

    # Invariants: NO new DB job persisted, NO Celery task dispatched
    current_job_count = db_session.query(TryOnJob).filter_by(user_id=user.id).count()
    assert current_job_count == initial_job_count
    mock_dispatch.assert_not_called()


def test_user_capacity_isolation_between_users(client: TestClient, db_session: Session):
    """
    Verify that User A reaching active job capacity does NOT block User B.
    """
    user_a, _, headers_a, upload_a, outfit_a = create_user_and_media(db_session, 2)
    user_b, _, headers_b, upload_b, outfit_b = create_user_and_media(db_session, 3)

    # Fill User A's capacity
    for _ in range(settings.MAX_ACTIVE_TRYONS_PER_USER):
        job = TryOnJob(
            public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
            user_id=user_a.id,
            person_upload_id=upload_a.id,
            outfit_id=outfit_a.id,
            status=TryOnJobStatus.QUEUED.value,
        )
        db_session.add(job)
    db_session.commit()

    # User A is blocked
    res_a = client.post(
        "/api/v1/try-ons",
        headers=headers_a,
        json={"person_upload_id": upload_a.public_id, "outfit_id": outfit_a.public_id},
    )
    assert res_a.status_code == 429
    assert res_a.json()["error"]["code"] == "TRYON_CAPACITY_LIMIT"

    # User B can submit normally -> 202 Accepted
    with patch("app.workers.dispatchers.CeleryTryOnJobDispatcher.dispatch", return_value="fake_task_b"):
        res_b = client.post(
            "/api/v1/try-ons",
            headers=headers_b,
            json={"person_upload_id": upload_b.public_id, "outfit_id": outfit_b.public_id},
        )
    assert res_b.status_code == 202
    assert res_b.json()["data"]["status"] == "queued"


def test_global_queued_capacity_guard(client: TestClient, db_session: Session):
    """
    Test that when the global queue limit MAX_QUEUED_TRYONS_GLOBAL is reached,
    submissions return 503 TRYON_CAPACITY_UNAVAILABLE.
    """
    user, _, headers, upload, outfit = create_user_and_media(db_session, 4)

    mock_dispatch = MagicMock()
    with patch("app.repositories.tryon_repository.TryOnRepository.count_queued_jobs_global", return_value=settings.MAX_QUEUED_TRYONS_GLOBAL):
        with patch("app.workers.dispatchers.CeleryTryOnJobDispatcher.dispatch", mock_dispatch):
            res = client.post(
                "/api/v1/try-ons",
                headers=headers,
                json={"person_upload_id": upload.public_id, "outfit_id": outfit.public_id},
            )

    assert res.status_code == 503
    assert res.json()["error"]["code"] == "TRYON_CAPACITY_UNAVAILABLE"
    mock_dispatch.assert_not_called()


def test_redis_admission_lock_unit():
    """Unit test verifying token-safe acquisition and release of redis_admission_lock."""
    mock_client = MagicMock()
    mock_client.set.return_value = True

    with patch("app.core.redis.get_redis_client", return_value=mock_client):
        with redis_admission_lock("test:lock:key", ttl_seconds=5) as acquired:
            assert acquired is True
            mock_client.set.assert_called_once()

        # Unlock Lua script must be evaluated upon exit
        mock_client.eval.assert_called_once()
