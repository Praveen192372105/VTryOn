from unittest.mock import MagicMock, patch
from pathlib import Path
import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.ai.catvton.exceptions import CatVTONInferenceError, CatVTONOOMError
from app.core.exceptions import StorageError
from app.domain.enums import FailureCode, OutfitCategory, TryOnJobStatus, UploadStatus
from app.models.outfit import Outfit
from app.models.tryon_job import TryOnJob
from app.models.upload import Upload
from app.models.user import User
from app.services.tryon_worker import TryOnWorkerService
from app.storage.local import LocalMediaStorage


@pytest.fixture
def worker_setup(db_session: Session, tmp_path):
    storage = LocalMediaStorage(root_dir=str(tmp_path))

    # Create test person image on storage
    person_img = Image.new("RGB", (768, 1024), color=(200, 200, 200))
    person_key = "uploads/usr_01/person.jpg"
    storage.save(person_key, person_img.tobytes(), content_type="image/jpeg")
    # Save valid JPEG format
    person_path = tmp_path / person_key
    person_path.parent.mkdir(parents=True, exist_ok=True)
    person_img.save(str(person_path), format="JPEG")

    # Create test garment image on storage
    garment_img = Image.new("RGB", (768, 1024), color=(50, 100, 150))
    garment_key = "outfits/shirt.jpg"
    garment_path = tmp_path / garment_key
    garment_path.parent.mkdir(parents=True, exist_ok=True)
    garment_img.save(str(garment_path), format="JPEG")

    user = User(
        public_id="usr_01j7q9abcde123456789012345",
        email="workeruser@example.com",
        name="Worker User",
        hashed_password="hashed_pwd",
    )
    db_session.add(user)
    db_session.flush()

    upload = Upload(
        public_id="upl_01j7q9abcde123456789012345",
        user_id=user.id,
        storage_key=person_key,
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=5000,
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit = Outfit(
        public_id="out_01j7q9abcde123456789012345",
        name="Casual Linen Shirt",
        slug="casual-linen-shirt-worker",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key=garment_key,
        is_active=True,
    )
    db_session.add(outfit)
    db_session.flush()

    job = TryOnJob(
        public_id="job_01j7q9abcde123456789012345",
        user_id=user.id,
        person_upload_id=upload.id,
        outfit_id=outfit.id,
        status=TryOnJobStatus.QUEUED.value,
    )
    db_session.add(job)
    db_session.commit()

    return {
        "user": user,
        "upload": upload,
        "outfit": outfit,
        "job": job,
        "storage": storage,
        "tmp_path": tmp_path,
    }


def test_tryon_worker_service_success(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    mock_pipeline = MagicMock()
    mock_result_image = Image.new("RGB", (768, 1024), color=(255, 255, 255))
    mock_pipeline.generate.return_value = mock_result_image

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        pipeline=mock_pipeline,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is True
    mock_pipeline.generate.assert_called_once()

    # Verify job status reached SUCCEEDED using a fresh query
    with TestingSessionLocal() as check_db:
        from app.repositories.tryon_repository import TryOnRepository
        refreshed_job = TryOnRepository(check_db).get_by_public_id(worker_setup["job"].public_id)
        assert refreshed_job.status == TryOnJobStatus.SUCCEEDED.value
        assert refreshed_job.completed_at is not None
        assert refreshed_job.result is not None


def test_tryon_worker_service_idempotency_on_succeeded_job(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    worker_setup["job"].status = TryOnJobStatus.SUCCEEDED.value
    db_session.commit()

    mock_pipeline = MagicMock()
    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        pipeline=mock_pipeline,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is True
    # Asserts that inference was NOT executed for already succeeded job
    mock_pipeline.generate.assert_not_called()


def test_tryon_worker_service_idempotency_on_failed_job(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    worker_setup["job"].status = TryOnJobStatus.FAILED.value
    db_session.commit()

    mock_pipeline = MagicMock()
    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        pipeline=mock_pipeline,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is False
    # Asserts that inference was NOT executed for already failed job
    mock_pipeline.generate.assert_not_called()


def test_tryon_worker_service_oom_failure(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    mock_pipeline = MagicMock()
    mock_pipeline.generate.side_effect = CatVTONOOMError("CUDA out of memory during backward pass.")

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        pipeline=mock_pipeline,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is False
    with TestingSessionLocal() as check_db:
        from app.repositories.tryon_repository import TryOnRepository
        refreshed_job = TryOnRepository(check_db).get_by_public_id(worker_setup["job"].public_id)
        assert refreshed_job.status == TryOnJobStatus.FAILED.value
        assert refreshed_job.failure_code == FailureCode.GPU_OUT_OF_MEMORY.value


def test_tryon_worker_service_missing_input_media(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    # Delete garment storage file
    garment_path = worker_setup["tmp_path"] / "outfits" / "shirt.jpg"
    garment_path.unlink(missing_ok=True)

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        pipeline=MagicMock(),
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is False
    with TestingSessionLocal() as check_db:
        from app.repositories.tryon_repository import TryOnRepository
        refreshed_job = TryOnRepository(check_db).get_by_public_id(worker_setup["job"].public_id)
        assert refreshed_job.status == TryOnJobStatus.FAILED.value
        assert refreshed_job.failure_code == FailureCode.INPUT_MEDIA_MISSING.value


def test_tryon_worker_service_storage_compensation_on_db_failure(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    mock_pipeline = MagicMock()
    mock_pipeline.generate.return_value = Image.new("RGB", (768, 1024), color=(255, 255, 255))

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        pipeline=mock_pipeline,
    )

    # Make Session B commit fail
    original_session_local = TestingSessionLocal
    session_call_count = 0

    def failing_session_factory():
        nonlocal session_call_count
        session_call_count += 1
        s = original_session_local()
        if session_call_count == 2:
            # Session B (create_result & mark_succeeded) fails on commit
            s.commit = MagicMock(side_effect=Exception("Database lock error on result insert"))
        return s

    with patch("app.services.tryon_worker.SessionLocal", side_effect=failing_session_factory):
        success = worker.process(worker_setup["job"].public_id)

    assert success is False
    # Verify compensation deleted any saved result from storage
    expected_result_key = f"results/{worker_setup['user'].public_id}/{worker_setup['job'].public_id}/result.jpg"
    assert worker_setup["storage"].exists(expected_result_key) is False
