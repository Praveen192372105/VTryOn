from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.domain.ids import ResourcePrefix, generate_public_id
from app.core.security import normalize_email


class UserRepository:
    """Repository managing User persistence and query operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user by internal BigInt surrogate primary key."""
        return self.db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()

    def get_by_public_id(self, public_id: str) -> Optional[User]:
        """Fetch user by external public identifier (usr_...)."""
        return self.db.execute(
            select(User).where(User.public_id == public_id)
        ).scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by normalized email address."""
        clean_email = normalize_email(email)
        return self.db.execute(
            select(User).where(User.email == clean_email)
        ).scalar_one_or_none()

    def create(
        self,
        email: str,
        name: str,
        password_hash: str,
        public_id: Optional[str] = None,
    ) -> User:
        """Create and flush a new User record."""
        user = User(
            public_id=public_id or generate_public_id(ResourcePrefix.USER),
            email=normalize_email(email),
            name=name.strip(),
            password_hash=password_hash,
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def save_session(
        self,
        user_id: int,
        refresh_token_hash: str,
        expires_at,
        session_public_id: Optional[str] = None,
    ):
        """Delegates session creation to SessionRepository for backward compatibility."""
        from app.repositories.sessions import SessionRepository
        return SessionRepository(self.db).create(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            public_id=session_public_id,
        )

    def get_session_by_hash(self, token_hash: str):
        """Delegates session lookup to SessionRepository for backward compatibility."""
        from app.repositories.sessions import SessionRepository
        return SessionRepository(self.db).get_active_by_token_hash(token_hash)

    def revoke_session_by_hash(self, token_hash: str) -> bool:
        """Delegates session revocation to SessionRepository for backward compatibility."""
        from app.repositories.sessions import SessionRepository
        return SessionRepository(self.db).revoke_by_hash(token_hash)
