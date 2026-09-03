from datetime import datetime, timezone
from sqlalchemy import BigInteger, DateTime, Integer, MetaData
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Explicit naming convention for deterministic Alembic & MySQL constraints
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models with unified naming conventions."""
    metadata = metadata


def unsigned_bigint_id():
    """Generates a portable BIGINT UNSIGNED primary/foreign key type definition."""
    return BigInteger().with_variant(BIGINT(unsigned=True), "mysql").with_variant(Integer, "sqlite")


class TimestampMixin:
    """Mixin for models requiring created_at and updated_at UTC timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
