from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, unsigned_bigint_id
from app.domain.ids import ResourcePrefix, generate_public_id


class TryOnJob(Base, TimestampMixin):
    __tablename__ = "try_on_jobs"

    id: Mapped[int] = mapped_column(unsigned_bigint_id(), primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: generate_public_id(ResourcePrefix.TRYON_JOB),
    )
    user_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("users.id", ondelete="CASCADE", name="fk_try_on_jobs_user_id_users"),
        nullable=False,
        index=True,
    )
    person_upload_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("uploads.id", ondelete="RESTRICT", name="fk_try_on_jobs_person_upload_id_uploads"),
        nullable=False,
        index=True,
    )
    outfit_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("outfits.id", ondelete="RESTRICT", name="fk_try_on_jobs_outfit_id_outfits"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="queued", server_default="queued", nullable=False)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    queued_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_tryons_queue_state", "status", "queued_at"),
        Index("ix_tryons_owner_created", "user_id", "created_at"),
        Index("uq_tryons_user_idempotency", "user_id", "idempotency_key", unique=True),
    )

    user: Mapped["User"] = relationship("User", back_populates="try_on_jobs")
    person_upload: Mapped["Upload"] = relationship("Upload", back_populates="try_on_jobs")
    outfit: Mapped["Outfit"] = relationship("Outfit", back_populates="try_on_jobs")
    result: Mapped[Optional["TryOnResult"]] = relationship(
        "TryOnResult",
        back_populates="job",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def completed_at(self) -> Optional[datetime]:
        return self.finished_at

    @completed_at.setter
    def completed_at(self, value: Optional[datetime]):
        self.finished_at = value

    @property
    def failure_code(self) -> Optional[str]:
        return self.error_code

    @failure_code.setter
    def failure_code(self, value: Optional[str]):
        self.error_code = value

    @property
    def failure_reason(self) -> Optional[str]:
        return self.error_message

    @failure_reason.setter
    def failure_reason(self, value: Optional[str]):
        self.error_message = value



class TryOnResult(Base):
    __tablename__ = "try_on_results"

    id: Mapped[int] = mapped_column(unsigned_bigint_id(), primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: generate_public_id(ResourcePrefix.TRYON_RESULT),
    )
    job_id: Mapped[int] = mapped_column(
        unsigned_bigint_id(),
        ForeignKey("try_on_jobs.id", ondelete="CASCADE", name="fk_try_on_results_job_id_try_on_jobs"),
        unique=True,
        nullable=False,
        index=True,
    )
    storage_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), default="image/png", server_default="image/png", nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    size_bytes: Mapped[Optional[int]] = mapped_column(
        BigInteger().with_variant(BIGINT(unsigned=True), "mysql").with_variant(Integer, "sqlite"),
        nullable=True,
    )
    sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    execution_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    inference_config_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    job: Mapped["TryOnJob"] = relationship("TryOnJob", back_populates="result")
