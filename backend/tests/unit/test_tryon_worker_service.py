from unittest.mock import MagicMock, patch
from pathlib import Path
import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.ai.providers import GenerationMode, ProviderRegistry, TryOnProviderResult
from app.ai.providers.types import ProviderPermanentError
from app.core.exceptions import StorageError
from app.domain.enums import FailureCode, OutfitCategory, TryOnJobStatus, UploadStatus
from app.models.outfit import Outfit
from app.models.tryon_job import TryOnJob
from app.models.upload import Upload
from app.models.user import User
from app.services.tryon_worker import TryOnWorkerService
from app.storage.local import LocalMediaStorage


def _create_mock_registry(generate_return=None, generate_side_effect=None):
    mock_provider = MagicMock()
    mock_provider.name = "catvton"
    if generate_side_effect:
        mock_provider.generate.side_effect = generate_side_effect
    else:
        res_img = generate_return or Image.new("RGB", (768, 1024), color=(255, 255, 255))
        mock_provider.generate.return_value = TryOnProviderResult(
            provider="catvton",
            output_image=res_img,
            generation_mode=GenerationMode.ACCURATE.value,
            model="catvton-1.0-v1",
        )
    registry = ProviderRegistry(primary_name="catvton")
    registry.register(mock_provider)
    return registry, mock_provider


def test_tryon_worker_service_success(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    registry, mock_provider = _create_mock_registry()

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is True
    mock_provider.generate.assert_called_once()

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

    registry, mock_provider = _create_mock_registry()
    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is True
    # Asserts that inference was NOT executed for already succeeded job
    mock_provider.generate.assert_not_called()


def test_tryon_worker_service_idempotency_on_failed_job(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    worker_setup["job"].status = TryOnJobStatus.FAILED.value
    db_session.commit()

    registry, mock_provider = _create_mock_registry()
    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is False
    # Asserts that inference was NOT executed for already failed job
    mock_provider.generate.assert_not_called()


def test_tryon_worker_service_provider_failure(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    registry, mock_provider = _create_mock_registry(
        generate_side_effect=ProviderPermanentError("Model synthesis failed permanently.", provider="catvton")
    )

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        success = worker.process(worker_setup["job"].public_id)

    assert success is False
    with TestingSessionLocal() as check_db:
        from app.repositories.tryon_repository import TryOnRepository
        refreshed_job = TryOnRepository(check_db).get_by_public_id(worker_setup["job"].public_id)
        assert refreshed_job.status == TryOnJobStatus.FAILED.value
        assert refreshed_job.failure_code == FailureCode.INFERENCE_FAILED.value


def test_tryon_worker_service_missing_input_media(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    # Delete garment storage file
    garment_path = worker_setup["tmp_path"] / "outfits" / "shirt.jpg"
    garment_path.unlink(missing_ok=True)

    registry, mock_provider = _create_mock_registry()
    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
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
    registry, mock_provider = _create_mock_registry()

    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
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


def test_tryon_worker_service_handles_stale_processing_delivery(db_session: Session, worker_setup):
    from tests.conftest import TestingSessionLocal
    # Simulate a job that was left in PROCESSING when a previous worker process died
    worker_setup["job"].status = TryOnJobStatus.PROCESSING.value
    db_session.commit()

    registry, mock_provider = _create_mock_registry()
    worker = TryOnWorkerService(
        storage=worker_setup["storage"],
        registry=registry,
    )

    with patch("app.services.tryon_worker.SessionLocal", side_effect=TestingSessionLocal):
        # Delivery with retry_count=0 represents a worker restart redelivery
        success = worker.process(worker_setup["job"].public_id, retry_count=0)

    assert success is False
    mock_provider.generate.assert_not_called()

    # Verify that the orphaned job was cleanly transitioned to FAILED in the DB
    with TestingSessionLocal() as check_db:
        from app.repositories.tryon_repository import TryOnRepository
        refreshed_job = TryOnRepository(check_db).get_by_public_id(worker_setup["job"].public_id)
        assert refreshed_job.status == TryOnJobStatus.FAILED.value
        assert refreshed_job.failure_code == FailureCode.WORKER_FAILURE.value
