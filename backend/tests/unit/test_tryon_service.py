import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import (
    OutfitInactiveError,
    OutfitNotFoundError,
    QueueSubmissionError,
    ResourceConflictError,
    UploadNotFoundError,
)
from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.domain.ownership import CurrentUser
from app.models.outfit import Outfit
from app.models.upload import Upload
from app.models.user import User
from app.schemas.tryon import CreateTryOnRequest
from app.services.tryon_service import TryOnService
from app.workers.dispatchers import InMemoryTryOnJobDispatcher


@pytest.fixture
def test_setup(db_session: Session):
    user = User(
        public_id="usr_01j7q9abcde123456789012345",
        email="testuser@example.com",
        name="Test User",
        hashed_password="hashed_pwd",
    )
    db_session.add(user)
    db_session.flush()

    upload = Upload(
        public_id="upl_01j7q9abcde123456789012345",
        user_id=user.id,
        storage_key="uploads/usr_01/person.jpg",
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=5000,
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit = Outfit(
        public_id="out_01j7q9abcde123456789012345",
        name="Casual Linen Shirt",
        slug="casual-linen-shirt",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key="outfits/shirt.jpg",
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()

    current_user = CurrentUser(
        id=user.id,
        public_id=user.public_id,
        email=user.email,
    )

    return {
        "user": user,
        "current_user": current_user,
        "upload": upload,
        "outfit": outfit,
    }


def test_tryon_service_create_job_success(db_session: Session, test_setup):
    dispatcher = InMemoryTryOnJobDispatcher()
    service = TryOnService(db=db_session, dispatcher=dispatcher)

    req = CreateTryOnRequest(
        person_upload_id=test_setup["upload"].public_id,
        outfit_id=test_setup["outfit"].public_id,
    )

    response = service.create_job(user=test_setup["current_user"], payload=req)

    assert response.job_id.startswith("job_")
    assert response.status == TryOnJobStatus.QUEUED
    assert response.created_at is not None
    assert response.job_id in dispatcher.dispatched_jobs


def test_tryon_service_create_job_unowned_upload(db_session: Session, test_setup):
    dispatcher = InMemoryTryOnJobDispatcher()
    service = TryOnService(db=db_session, dispatcher=dispatcher)

    other_user = CurrentUser(id=999, public_id="usr_other", email="other@example.com")
    req = CreateTryOnRequest(
        person_upload_id=test_setup["upload"].public_id,
        outfit_id=test_setup["outfit"].public_id,
    )

    # Must raise 404 UploadNotFoundError when upload belongs to another user
    with pytest.raises(UploadNotFoundError):
        service.create_job(user=other_user, payload=req)

    assert len(dispatcher.dispatched_jobs) == 0


def test_tryon_service_create_job_inactive_outfit(db_session: Session, test_setup):
    dispatcher = InMemoryTryOnJobDispatcher()
    service = TryOnService(db=db_session, dispatcher=dispatcher)

    test_setup["outfit"].is_active = False
    db_session.commit()

    req = CreateTryOnRequest(
        person_upload_id=test_setup["upload"].public_id,
        outfit_id=test_setup["outfit"].public_id,
    )

    with pytest.raises(OutfitInactiveError):
        service.create_job(user=test_setup["current_user"], payload=req)

    assert len(dispatcher.dispatched_jobs) == 0


def test_tryon_service_queue_failure_compensation(db_session: Session, test_setup):
    dispatcher = InMemoryTryOnJobDispatcher(should_fail=True)
    service = TryOnService(db=db_session, dispatcher=dispatcher)

    req = CreateTryOnRequest(
        person_upload_id=test_setup["upload"].public_id,
        outfit_id=test_setup["outfit"].public_id,
    )

    with pytest.raises(QueueSubmissionError):
        service.create_job(user=test_setup["current_user"], payload=req)
