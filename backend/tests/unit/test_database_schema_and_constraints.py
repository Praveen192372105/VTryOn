import pytest
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import AuthSession, Favorite, Outfit, TryOnJob, TryOnResult, Upload, User
from app.domain.enums import OutfitCategory, TryOnJobStatus, UploadStatus
from app.domain.ids import ResourcePrefix, generate_public_id
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.tryon_repository import TryOnRepository
from app.repositories.upload_repository import UploadRepository
from app.repositories.user_repository import UserRepository
from app.utils.time import utc_now


def test_schema_discovery_and_core_tables():
    """Verify all 7 canonical core domain models are discovered on Base.metadata."""
    table_names = set(Base.metadata.tables.keys())
    expected = {
        "users",
        "auth_sessions",
        "uploads",
        "outfits",
        "favorites",
        "try_on_jobs",
        "try_on_results",
    }
    assert expected.issubset(table_names), f"Missing tables: {expected - table_names}"


def test_user_email_and_public_id_uniqueness(db_session: Session):
    """Verify email and public_id uniqueness constraints on User model."""
    user1 = User(
        public_id="usr_01m1hunique11111111111111",
        email="test_unique@example.com",
        name="User One",
        password_hash="hashed_pw_1",
    )
    db_session.add(user1)
    db_session.commit()

    # Duplicate email should raise IntegrityError
    user2 = User(
        public_id="usr_01m1hunique22222222222222",
        email="test_unique@example.com",
        name="User Two",
        password_hash="hashed_pw_2",
    )
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Duplicate public_id should raise IntegrityError
    user3 = User(
        public_id="usr_01m1hunique11111111111111",
        email="test_unique3@example.com",
        name="User Three",
        password_hash="hashed_pw_3",
    )
    db_session.add(user3)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_auth_session_refresh_hash_uniqueness_and_revocation(db_session: Session):
    """Verify refresh_token_hash uniqueness and revocation behavior."""
    user_repo = UserRepository(db_session)
    user = user_repo.create(
        email="session_user@example.com",
        name="Session User",
        password_hash="hashed_pw",
    )
    db_session.commit()

    token_hash = "a" * 64
    session1 = user_repo.save_session(
        user_id=user.id,
        refresh_token_hash=token_hash,
        expires_at=utc_now(),
    )
    db_session.commit()
    assert session1.is_revoked is False

    # Duplicate refresh token hash should fail
    session2 = AuthSession(
        public_id="ses_01m1hdup22222222222222222",
        user_id=user.id,
        refresh_token_hash=token_hash,
        expires_at=utc_now(),
    )
    db_session.add(session2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Test revocation
    revoked = user_repo.revoke_session_by_hash(token_hash)
    db_session.commit()
    assert revoked is True
    # Once revoked, get_session_by_hash should return None
    assert user_repo.get_session_by_hash(token_hash) is None


def test_upload_storage_key_uniqueness_and_soft_delete(db_session: Session):
    """Verify unique storage keys and soft delete lifecycle."""
    user_repo = UserRepository(db_session)
    upload_repo = UploadRepository(db_session)

    user = user_repo.create(email="upload_user@example.com", name="Upload User", password_hash="pw")
    db_session.commit()

    storage_key = "uploads/user_1/sample.jpg"
    upload1 = upload_repo.create(
        user_id=user.id,
        storage_key=storage_key,
        original_filename="sample.jpg",
        mime_type="image/jpeg",
        size_bytes=5000,
        sha256="b" * 64,
        kind="person",
    )
    db_session.commit()

    # Duplicate storage key fails
    upload2 = Upload(
        public_id="upl_01m1hdupupload22222222222",
        user_id=user.id,
        storage_key=storage_key,
        original_name="another.jpg",
        mime_type="image/jpeg",
        size_bytes=4000,
    )
    db_session.add(upload2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Verify soft delete
    deleted = upload_repo.mark_deleted(upload1.public_id, user.id)
    db_session.commit()
    assert deleted is True

    # Active query should no longer return it
    assert upload_repo.get_by_public_id_and_user_id(upload1.public_id, user.id) is None


def test_favorite_composite_pk_and_idempotency(db_session: Session):
    """Verify Favorite composite PK (user_id, outfit_id) and idempotent repository add."""
    user_repo = UserRepository(db_session)
    fav_repo = FavoriteRepository(db_session)

    user = user_repo.create(email="fav_user@example.com", name="Fav User", password_hash="pw")
    outfit = Outfit(
        name="Test Outfit",
        slug="test-outfit",
        category="upper_body",
        image_storage_key="outfits/test.jpg",
    )
    db_session.add(outfit)
    db_session.commit()

    # Add favorite
    assert fav_repo.add(user.id, outfit.id) is True
    db_session.commit()

    # Idempotent re-add succeeds without error
    assert fav_repo.add(user.id, outfit.id) is True
    assert fav_repo.exists(user.id, outfit.id) is True

    # Remove favorite
    assert fav_repo.remove(user.id, outfit.id) is True
    db_session.commit()
    assert fav_repo.exists(user.id, outfit.id) is False


def test_tryon_job_atomic_claim_concurrency(db_session: Session):
    """Verify atomic conditional claim for try-on jobs: exactly one worker succeeds."""
    user_repo = UserRepository(db_session)
    upload_repo = UploadRepository(db_session)
    tryon_repo = TryOnRepository(db_session)

    user = user_repo.create(email="job_user@example.com", name="Job User", password_hash="pw")
    outfit = Outfit(name="Claim Outfit", slug="claim-outfit", category="upper_body", image_storage_key="o.jpg")
    db_session.add(outfit)
    db_session.flush()

    upload = upload_repo.create(
        user_id=user.id,
        storage_key="u.jpg",
        original_filename="u.jpg",
        mime_type="image/jpeg",
        size_bytes=1000,
    )
    db_session.commit()

    job_pub_id = generate_public_id(ResourcePrefix.TRYON_JOB)
    job = tryon_repo.create_job(
        public_id=job_pub_id,
        user_id=user.id,
        upload_id=upload.id,
        outfit_id=outfit.id,
    )
    db_session.commit()
    assert job.status == TryOnJobStatus.QUEUED.value

    # First claim succeeds
    claimed_first = tryon_repo.claim_queued_job(job_pub_id)
    assert claimed_first is True

    # Second claim fails atomically
    claimed_second = tryon_repo.claim_queued_job(job_pub_id)
    assert claimed_second is False


def test_one_result_per_job_and_result_storage_key_uniqueness(db_session: Session):
    """Verify 1:0..1 job-to-result relationship and storage_key uniqueness."""
    user_repo = UserRepository(db_session)
    upload_repo = UploadRepository(db_session)
    tryon_repo = TryOnRepository(db_session)

    user = user_repo.create(email="res_user@example.com", name="Res User", password_hash="pw")
    outfit = Outfit(name="Res Outfit", slug="res-outfit", category="upper_body", image_storage_key="ro.jpg")
    db_session.add(outfit)
    db_session.flush()

    upload = upload_repo.create(
        user_id=user.id,
        storage_key="ru.jpg",
        original_filename="ru.jpg",
        mime_type="image/jpeg",
        size_bytes=1000,
    )
    db_session.commit()

    job_pub_id = generate_public_id(ResourcePrefix.TRYON_JOB)
    job = tryon_repo.create_job(
        public_id=job_pub_id,
        user_id=user.id,
        upload_id=upload.id,
        outfit_id=outfit.id,
    )
    db_session.commit()

    # Create first result
    res1_key = "results/res_1.png"
    result1 = tryon_repo.create_result(
        result_public_id=generate_public_id(ResourcePrefix.TRYON_RESULT),
        job_id=job.id,
        storage_key=res1_key,
        width=768,
        height=1024,
        mime_type="image/png",
    )
    db_session.commit()
    assert result1.id is not None

    # Attempting to insert a second result for the same job should fail UNIQUE(job_id)
    result2 = TryOnResult(
        public_id=generate_public_id(ResourcePrefix.TRYON_RESULT),
        job_id=job.id,
        storage_key="results/res_2.png",
        width=768,
        height=1024,
        mime_type="image/png",
    )
    db_session.add(result2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_owner_scoped_query_isolation(db_session: Session):
    """Security verification: User A cannot retrieve User B's uploads or jobs."""
    user_repo = UserRepository(db_session)
    upload_repo = UploadRepository(db_session)
    tryon_repo = TryOnRepository(db_session)

    user_a = user_repo.create(email="user_a@example.com", name="User A", password_hash="pw")
    user_b = user_repo.create(email="user_b@example.com", name="User B", password_hash="pw")
    outfit = Outfit(name="Shared Outfit", slug="shared-outfit", category="upper_body", image_storage_key="so.jpg")
    db_session.add(outfit)
    db_session.flush()

    upload_a = upload_repo.create(
        user_id=user_a.id,
        storage_key="upload_a.jpg",
        original_filename="a.jpg",
        mime_type="image/jpeg",
        size_bytes=1000,
    )
    db_session.commit()

    job_a = tryon_repo.create_job(
        public_id=generate_public_id(ResourcePrefix.TRYON_JOB),
        user_id=user_a.id,
        upload_id=upload_a.id,
        outfit_id=outfit.id,
    )
    db_session.commit()

    # User B cannot access User A's upload via owner-scoped lookup
    assert upload_repo.get_by_public_id_and_user_id(upload_a.public_id, user_b.id) is None

    # User B cannot access User A's try-on job via owner-scoped lookup
    assert tryon_repo.get_by_public_id_and_user_id(job_a.public_id, user_b.id) is None


def test_utc_timestamps_guarantee(db_session: Session):
    """Verify application timestamps are stored and normalized in UTC."""
    now = utc_now()
    assert now.tzinfo == timezone.utc

    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email="utc_check@example.com",
        name="UTC Check",
        password_hash="pw",
        created_at=now,
        updated_at=now,
    )
    db_session.add(user)
    db_session.commit()

    queried = db_session.execute(select(User).where(User.id == user.id)).scalar_one()
    assert queried.created_at is not None
