from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, unsigned_bigint_id


class Favorite(Base):
    __tablename__ = "favorites"

    user_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("users.id", ondelete="CASCADE", name="fk_favorites_user_id_users"),
        primary_key=True,
    )
    outfit_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("outfits.id", ondelete="CASCADE", name="fk_favorites_outfit_id_outfits"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_favorites_created", "user_id", "created_at"),
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    outfit: Mapped["Outfit"] = relationship("Outfit", back_populates="favorites")
