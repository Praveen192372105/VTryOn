from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, unsigned_bigint_id
from app.domain.ids import ResourcePrefix, generate_public_id


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(unsigned_bigint_id(), primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: generate_public_id(ResourcePrefix.AUTH_SESSION),
    )
    user_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("users.id", ondelete="CASCADE", name="fk_auth_sessions_user_id_users"),
        nullable=False,
        index=True,
    )
    refresh_token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_sessions_user_active", "user_id", "revoked_at", "expires_at"),
    )

    user: Mapped["User"] = relationship("User", back_populates="sessions")

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None
