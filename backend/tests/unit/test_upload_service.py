import io
from unittest.mock import MagicMock
import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.core.exceptions import UploadInUseError, UploadNotFoundError, UploadPersistenceFailedError
from app.domain.ownership import CurrentUser
from app.services.upload_service import UploadService
from app.storage.local import LocalMediaStorage


from app.db.models.user import User


@pytest.fixture
def current_user(db_session: Session):
    user = User(
        public_id="usr_01m1hupunit000000000001",
        email="uploader@example.com",
        name="Uploader Unit",
        hashed_password="hash",
    )
    db_session.add(user)
    db_session.commit()
    return CurrentUser(id=user.id, public_id=user.public_id, email=user.email)


def make_valid_image_bytes() -> bytes:
    img = Image.new("RGB", (300, 400), color=(120, 140, 160))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_upload_service_create_success(db_session: Session, current_user, tmp_path):
    storage = LocalMediaStorage(root_dir=tmp_path)
    service = UploadService(db=db_session, storage=storage)

    content = make_valid_image_bytes()
    res = service.create_person_upload(user=current_user, filename="my_photo.jpg", content=content)

    assert res.id.startswith("upl_")
    assert res.width == 300
    assert res.height == 400
    assert res.mime_type == "image/jpeg"
    assert res.original_filename == "my_photo.jpg"


def test_upload_service_database_failure_cleans_up_storage(db_session: Session, current_user, tmp_path):
    storage = LocalMediaStorage(root_dir=tmp_path)
    service = UploadService(db=db_session, storage=storage)

    # Force database commit to fail
    db_session.commit = MagicMock(side_effect=Exception("Database connection dropped"))

    content = make_valid_image_bytes()
    with pytest.raises(UploadPersistenceFailedError):
        service.create_person_upload(user=current_user, filename="failing.jpg", content=content)


def test_upload_service_delete_active_job_conflict(db_session: Session, current_user, tmp_path):
    storage = LocalMediaStorage(root_dir=tmp_path)
    service = UploadService(db=db_session, storage=storage)

    content = make_valid_image_bytes()
    res = service.create_person_upload(user=current_user, filename="in_use.jpg", content=content)

    # Mock count_active_jobs_for_upload to return 1 active job
    service.upload_repo.count_active_jobs_for_upload = MagicMock(return_value=1)

    with pytest.raises(UploadInUseError):
        service.delete_owned_upload(user=current_user, upload_id=res.id)
