from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, unsigned_bigint_id
from app.domain.ids import ResourcePrefix, generate_public_id


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(unsigned_bigint_id(), primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: generate_public_id(ResourcePrefix.UPLOAD),
    )
    user_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("users.id", ondelete="CASCADE", name="fk_uploads_user_id_users"),
        nullable=False,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(32), default="person", server_default="person", nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    size_bytes: Mapped[int] = mapped_column(
        BigInteger().with_variant(BIGINT(unsigned=True), "mysql").with_variant(Integer, "sqlite"),
        nullable=False,
    )
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active", server_default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_uploads_owner_created", "user_id", "status", "created_at"),
        Index("ix_uploads_hash", "user_id", "sha256"),
    )

    user: Mapped["User"] = relationship("User", back_populates="uploads")
    try_on_jobs: Mapped[List["TryOnJob"]] = relationship("TryOnJob", back_populates="person_upload")

    def __init__(self, **kwargs):
        if "original_filename" in kwargs and "original_name" not in kwargs:
            kwargs["original_name"] = kwargs.pop("original_filename")
        super().__init__(**kwargs)

    @property
    def original_filename(self) -> str:
        return self.original_name

    @original_filename.setter
    def original_filename(self, value: str):
        self.original_name = value
