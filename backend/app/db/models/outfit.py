from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Boolean, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, unsigned_bigint_id
from app.domain.ids import ResourcePrefix, generate_public_id


class Outfit(Base, TimestampMixin):
    __tablename__ = "outfits"

    id: Mapped[int] = mapped_column(unsigned_bigint_id(), primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: generate_public_id(ResourcePrefix.OUTFIT),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="upper_body", server_default="upper_body", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_storage_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("1"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"), nullable=False)

    __table_args__ = (
        Index("ix_outfits_catalog", "is_active", "category", "sort_order"),
    )

    favorites: Mapped[List["Favorite"]] = relationship("Favorite", back_populates="outfit", cascade="all, delete-orphan")
    try_on_jobs: Mapped[List["TryOnJob"]] = relationship("TryOnJob", back_populates="outfit")

    def __init__(self, **kwargs):
        if "storage_key" in kwargs and "image_storage_key" not in kwargs:
            kwargs["image_storage_key"] = kwargs.pop("storage_key")
        super().__init__(**kwargs)

    @property
    def storage_key(self) -> str:
        return self.image_storage_key

    @storage_key.setter
    def storage_key(self, value: str):
        self.image_storage_key = value
