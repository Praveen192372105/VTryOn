from unittest.mock import MagicMock, patch
from pathlib import Path
import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.ai.catvton.exceptions import CatVTONInvalidInputError, CatVTONOutOfMemoryError
from app.core.exceptions import InvalidImageError, StorageError
from app.domain.enums import FailureCode, OutfitCategory, TryOnJobStatus, UploadStatus
from app.models.outfit import Outfit
from app.models.tryon_job import TryOnJob
from app.models.upload import Upload
from app.models.user import User
from app.services.tryon_worker import (
    RetryableTryOnWorkerError,
    TryOnWorkerService,
    classify_failure,
)
from app.storage.local import LocalMediaStorage


@pytest.fixture
def retry_test_setup(db_session: Session, tmp_path: Path):
    storage = LocalMediaStorage(root_dir=str(tmp_path))

    user = User(
        public_id="usr_retry_test_01",
        email="retryuser@example.com",
        name="Retry User",
        hashed_password="hashed_pwd",
    )
    db_session.add(user)
    db_session.flush()

    person_img = Image.new("RGB", (768, 1024), color=(200, 200, 200))
    person_key = "uploads/usr_retry/person.jpg"
    storage.save(person_key, person_img.tobytes(), content_type="image/jpeg")
    person_path = tmp_path / person_key
    person_path.parent.mkdir(parents=True, exist_ok=True)
    person_img.save(str(person_path), format="JPEG")

    garment_img = Image.new("RGB", (768, 1024), color=(50, 100, 150))
    garment_key = "outfits/shirt.jpg"
    garment_path = tmp_path / garment_key
    garment_path.parent.mkdir(parents=True, exist_ok=True)
    garment_img.save(str(garment_path), format="JPEG")

    upload = Upload(
        public_id="upl_retry_test_01",
        user_id=user.id,
        storage_key=person_key,
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=5000,
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit = Outfit(
        public_id="out_retry_test_01",
        name="Retry Test Shirt",
        slug="retry-test-shirt",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key=garment_key,
        is_active=True,
    )
    db_session.add(outfit)
    db_session.flush()

    job = TryOnJob(
        public_id="job_retry_test_01",
        user_id=user.id,
        person_upload_id=upload.id,
        outfit_id=outfit.id,
        status=TryOnJobStatus.QUEUED.value,
    )
    db_session.add(job)
    db_session.commit()

    return {
        "job": job,
        "storage": storage,
    }


def test_failure_classification_retry_rules():
    """Verify non-retryable vs conditionally retryable classification."""
    # Permanent: Non-retryable
    c_person = classify_failure(InvalidImageError("Corrupt person JPEG"))
    assert c_person.retryable is False
    assert c_person.max_retries == 0
    assert c_person.code == FailureCode.INVALID_PERSON_IMAGE

    c_cat = classify_failure(ValueError("Unsupported garment category"))
    assert c_cat.retryable is False
    assert c_cat.code == FailureCode.UNSUPPORTED_OUTFIT_CATEGORY

    # Conditionally Retryable: OOM
    c_oom = classify_failure(CatVTONOutOfMemoryError("CUDA out of memory"))
    assert c_oom.retryable is True
    assert c_oom.max_retries == 1
    assert c_oom.code == FailureCode.GPU_OUT_OF_MEMORY

    # Conditionally Retryable: Storage
    c_storage = classify_failure(StorageError("Disk write error"))
    assert c_storage.retryable is True
    assert c_storage.max_retries == 2
    assert c_storage.code == FailureCode.STORAGE_WRITE_FAILED


def test_worker_service_raises_retryable_error_on_first_oom(retry_test_setup):
    """When OOM occurs on attempt 0 (first run), worker raises RetryableTryOnWorkerError."""
    from tests.conftest import TestingSessionLocal
    mock_pipeline = MagicMock()
    mock_pipeline.generate.side_effect = CatVTONOutOfMemoryError("CUDA OOM")

    worker = TryOnWorkerService(
        storage=retry_test_setup["storage"],
        pipeline=mock_pipeline,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        with pytest.raises(RetryableTryOnWorkerError) as exc_info:
            worker.process(
                job_public_id=retry_test_setup["job"].public_id,
                retry_count=0,  # First attempt
                raise_on_retry=True,
            )

    assert exc_info.value.code == FailureCode.GPU_OUT_OF_MEMORY
    assert exc_info.value.max_retries == 1


def test_worker_service_persists_failed_on_oom_exhaustion(retry_test_setup):
    """When OOM occurs and retry_count >= max_retries, worker marks job FAILED."""
    from tests.conftest import TestingSessionLocal
    mock_pipeline = MagicMock()
    mock_pipeline.generate.side_effect = CatVTONOutOfMemoryError("CUDA OOM")

    worker = TryOnWorkerService(
        storage=retry_test_setup["storage"],
        pipeline=mock_pipeline,
    )

    # First claim the job to PROCESSING state
    with TestingSessionLocal() as db:
        from app.repositories.tryon_repository import TryOnRepository
        TryOnRepository(db).claim_queued_job(retry_test_setup["job"].public_id)

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(
            job_public_id=retry_test_setup["job"].public_id,
            retry_count=1,  # Retried attempt (exhausted for OOM max_retries=1)
        )

    assert success is False
    with TestingSessionLocal() as check_db:
        from app.repositories.tryon_repository import TryOnRepository
        refreshed = TryOnRepository(check_db).get_by_public_id(retry_test_setup["job"].public_id)
        assert refreshed.status == TryOnJobStatus.FAILED.value
        assert refreshed.error_code == FailureCode.GPU_OUT_OF_MEMORY.value
