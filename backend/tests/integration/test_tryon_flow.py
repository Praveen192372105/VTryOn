from unittest.mock import MagicMock, patch
import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.domain.ownership import CurrentUser
from app.models.outfit import Outfit
from app.models.upload import Upload
from app.models.user import User
from app.schemas.tryon import CreateTryOnRequest
from app.services.tryon_service import TryOnService
from app.services.tryon_worker import TryOnWorkerService
from app.storage.local import LocalMediaStorage
from app.workers.dispatchers import InMemoryTryOnJobDispatcher


def test_end_to_end_tryon_orchestration_flow(db_session: Session, tmp_path):
    """
    Integration test validating the full end-to-end try-on orchestration flow:
    Client Request -> Durable MySQL Job -> Queue Dispatch -> Worker Execution -> MySQL Succeeded State + Result
    """
    storage = LocalMediaStorage(root_dir=str(tmp_path))
    dispatcher = InMemoryTryOnJobDispatcher()

    # 1. Seed user, person image, and outfit
    user_public_id = generate_public_id(ResourcePrefix.USER)
    user = User(
        public_id=user_public_id,
        email="orchestration@example.com",
        name="Orchestration User",
        hashed_password="hashed_pwd",
    )
    db_session.add(user)
    db_session.flush()

    current_user = CurrentUser(
        id=user.id,
        public_id=user.public_id,
        email=user.email,
    )

    # Save real test images to storage
    person_key = f"uploads/{user.public_id}/person.jpg"
    person_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 1000
    person_img = Image.new("RGB", (768, 1024), color=(180, 180, 180))
    person_path = tmp_path / "uploads" / user.public_id / "person.jpg"
    person_path.parent.mkdir(parents=True, exist_ok=True)
    person_img.save(str(person_path))

    upload_public_id = generate_public_id(ResourcePrefix.UPLOAD)
    upload = Upload(
        public_id=upload_public_id,
        user_id=user.id,
        storage_key=person_key,
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=len(person_bytes),
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    garment_key = "outfits/test_dress.jpg"
    garment_img = Image.new("RGB", (768, 1024), color=(30, 80, 140))
    garment_path = tmp_path / "outfits" / "test_dress.jpg"
    garment_path.parent.mkdir(parents=True, exist_ok=True)
    garment_img.save(str(garment_path))

    outfit_public_id = generate_public_id(ResourcePrefix.OUTFIT)
    outfit = Outfit(
        public_id=outfit_public_id,
        name="Summer Floral Dress",
        slug="summer-floral-dress-orch",
        category=OutfitCategory.DRESS.value,
        storage_key=garment_key,
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()

    # 2. Request-Time: Submit try-on job via TryOnService
    service = TryOnService(
        db=db_session,
        storage=storage,
        dispatcher=dispatcher,
    )

    req = CreateTryOnRequest(
        person_upload_id=upload_public_id,
        outfit_id=outfit_public_id,
    )

    created_response = service.create_job(user=current_user, payload=req)
    job_public_id = created_response.job_id

    assert created_response.status == TryOnJobStatus.QUEUED
    assert len(dispatcher.dispatched_jobs) == 1
    assert dispatcher.dispatched_jobs[0] == job_public_id

    # 3. Worker-Time: Process the job with TryOnWorkerService
    from tests.conftest import TestingSessionLocal
    mock_engine = MagicMock()
    mock_result_image = Image.new("RGB", (768, 1024), color=(255, 200, 150))
    mock_engine.generate.return_value = mock_result_image

    worker = TryOnWorkerService(
        storage=storage,
        engine=mock_engine,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(job_public_id)

    assert success is True

    # 4. Verification: Query job details via service (simulating client GET /try-ons/{job_id})
    job_detail = service.get_job(user=current_user, job_id=job_public_id)

    assert job_detail.status == TryOnJobStatus.SUCCEEDED
    assert job_detail.result is not None
    assert job_detail.result.width == 768
    assert job_detail.result.height == 1024
    assert job_detail.result.image_url.startswith(("/api/v1/try-ons/", "/storage/", "/media/"))
