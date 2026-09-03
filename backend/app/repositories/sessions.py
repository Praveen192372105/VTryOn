from datetime import datetime
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db.models.auth_session import AuthSession
from app.domain.ids import ResourcePrefix, generate_public_id
from app.utils.time import utc_now


class SessionRepository:
    """Repository managing auth_sessions persistence, lookup, and atomic revocation."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: int,
        refresh_token_hash: str,
        expires_at: datetime,
        public_id: Optional[str] = None,
    ) -> AuthSession:
        """Create and persist a new auth session record."""
        session = AuthSession(
            public_id=public_id or generate_public_id(ResourcePrefix.AUTH_SESSION),
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            created_at=utc_now(),
        )
        self.db.add(session)
        self.db.flush()
        return session

    def get_by_token_hash(self, token_hash: str) -> Optional[AuthSession]:
        """Lookup session by hash regardless of revocation or expiration state."""
        return self.db.execute(
            select(AuthSession).where(AuthSession.refresh_token_hash == token_hash)
        ).scalar_one_or_none()

    get_by_hash = get_by_token_hash  # Backward compatibility alias

    def get_active_by_token_hash(self, token_hash: str) -> Optional[AuthSession]:
        """Lookup active (non-revoked and unexpired) session by token hash."""
        now = utc_now()
        return self.db.execute(
            select(AuthSession).where(
                AuthSession.refresh_token_hash == token_hash,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
        ).scalar_one_or_none()

    def get_for_update_by_token_hash(self, token_hash: str) -> Optional[AuthSession]:
        """Lookup session with row-level lock for safe concurrent rotation."""
        return self.db.execute(
            select(AuthSession)
            .where(AuthSession.refresh_token_hash == token_hash)
            .with_for_update()
        ).scalar_one_or_none()

    def atomic_revoke_active(self, token_hash: str, revoked_time: Optional[datetime] = None) -> bool:
        """
        Conditionally and atomically revoke an active session.
        Only succeeds if revoked_at IS NULL and expires_at > now.
        Prevents concurrent replay/rotation race conditions.
        """
        raw_now = revoked_time or utc_now()
        now = raw_now.replace(tzinfo=None) if raw_now.tzinfo else raw_now
        stmt = (
            update(AuthSession)
            .where(
                AuthSession.refresh_token_hash == token_hash,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            .values(revoked_at=now)
            .execution_options(synchronize_session=False)
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def revoke_by_hash(self, token_hash: str, revoked_time: Optional[datetime] = None) -> bool:
        """Revoke a session by hash if currently unrevoked."""
        raw_now = revoked_time or utc_now()
        now = raw_now.replace(tzinfo=None) if raw_now.tzinfo else raw_now
        stmt = (
            update(AuthSession)
            .where(
                AuthSession.refresh_token_hash == token_hash,
                AuthSession.revoked_at.is_(None),
            )
            .values(revoked_at=now)
            .execution_options(synchronize_session=False)
        )
        result = self.db.execute(stmt)
        return result.rowcount > 0

    def revoke_all_for_user(self, user_id: int, revoked_time: Optional[datetime] = None) -> int:
        """Revoke all active sessions belonging to a user (e.g., on password reset or account disable)."""
        raw_now = revoked_time or utc_now()
        now = raw_now.replace(tzinfo=None) if raw_now.tzinfo else raw_now
        stmt = (
            update(AuthSession)
            .where(
                AuthSession.user_id == user_id,
                AuthSession.revoked_at.is_(None),
            )
            .values(revoked_at=now)
            .execution_options(synchronize_session=False)
        )
        result = self.db.execute(stmt)
        return result.rowcount
