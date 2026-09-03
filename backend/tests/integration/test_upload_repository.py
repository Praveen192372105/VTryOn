from sqlalchemy.orm import Session

from app.db.models.upload import Upload
from app.domain.enums import UploadStatus
from app.repositories.upload_repository import UploadRepository
from app.schemas.pagination import PaginationParams


def test_upload_repository_crud(db_session: Session):
    repo = UploadRepository(db_session)
    from app.db.models.user import User
    user = User(
        public_id="usr_01m1huprepuser0000000001",
        email="uprep@example.com",
        name="Upload Rep User",
        hashed_password="hash",
    )
    db_session.add(user)
    db_session.flush()
    user_id = user.id

    # Create
    upload = repo.create(
        user_id=user_id,
        storage_key="people/usr_42/upl_1.jpg",
        original_filename="selfie.jpg",
        mime_type="image/jpeg",
        size_bytes=1024,
        width=600,
        height=800,
        sha256="fake_sha256_hash",
        public_id="upl_01m1huprep0000000000001",
    )
    db_session.commit()

    # Get by public id and user id
    found = repo.get_by_public_id_and_user_id(upload.public_id, user_id)
    assert found is not None
    assert found.id == upload.id
    assert found.width == 600

    # Foreign user lookup returns None
    assert repo.get_by_public_id_and_user_id(upload.public_id, user_id=999) is None

    # List
    items, total = repo.list_by_user_id(user_id=user_id, pagination=PaginationParams(page=1, page_size=10))
    assert total == 1
    assert len(items) == 1

    # Mark deleted
    assert repo.mark_deleted(upload.public_id, user_id) is True
    db_session.commit()

    # After deletion, active lookup returns None
    assert repo.get_by_public_id_and_user_id(upload.public_id, user_id) is None
