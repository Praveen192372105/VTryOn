from datetime import timedelta
import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.auth_session import AuthSession
from app.db.models.user import User
from app.domain.ids import ResourcePrefix, generate_public_id
from app.repositories.sessions import SessionRepository
from app.utils.time import utc_now


def test_auth_session_hash_uniqueness(db_session: Session):
    """Verify unique constraint on refresh_token_hash."""
    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email="sess_unique@example.com",
        name="Session User",
        password_hash="fake_hash",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    repo = SessionRepository(db=db_session)
    duplicate_hash = "a" * 64
    expires = utc_now() + timedelta(days=30)

    repo.create(user_id=user.id, refresh_token_hash=duplicate_hash, expires_at=expires)
    db_session.commit()

    with pytest.raises(IntegrityError):
        repo.create(user_id=user.id, refresh_token_hash=duplicate_hash, expires_at=expires)
        db_session.commit()
    db_session.rollback()


def test_auth_session_user_cascade_deletion(db_session: Session):
    """Verify deleting a user cascades to delete their auth_sessions."""
    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email="cascade_user@example.com",
        name="Cascade User",
        password_hash="fake_hash",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    repo = SessionRepository(db=db_session)
    sess = repo.create(
        user_id=user.id,
        refresh_token_hash="b" * 64,
        expires_at=utc_now() + timedelta(days=30),
    )
    db_session.commit()

    # Delete user
    db_session.delete(user)
    db_session.commit()

    # Session should be removed by cascade
    assert repo.get_by_token_hash("b" * 64) is None


def test_atomic_rotation_rollback_protection(db_session: Session):
    """
    Verify transaction rollback on failed rotation:
    If creating the replacement session fails, the old session revocation must roll back.
    """
    user = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email="rollback_user@example.com",
        name="Rollback User",
        password_hash="fake_hash",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    repo = SessionRepository(db=db_session)
    hash_old = "c" * 64
    repo.create(user_id=user.id, refresh_token_hash=hash_old, expires_at=utc_now() + timedelta(days=30))
    db_session.commit()

    # Simulate rotation that encounters an error after revocation but before commit
    try:
        repo.atomic_revoke_active(hash_old)
        # Force a failure (e.g. invalid user_id violation)
        invalid_session = AuthSession(
            public_id=generate_public_id(ResourcePrefix.AUTH_SESSION),
            user_id=99999999,  # Non-existent user
            refresh_token_hash="d" * 64,
            expires_at=utc_now() + timedelta(days=30),
        )
        db_session.add(invalid_session)
        db_session.commit()
    except Exception:
        db_session.rollback()

    # After rollback, the old session must still be active and unrevoked!
    old_session = repo.get_by_token_hash(hash_old)
    assert old_session is not None
    assert old_session.revoked_at is None
