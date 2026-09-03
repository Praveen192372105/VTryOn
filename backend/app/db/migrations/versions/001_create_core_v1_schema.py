"""Create core V1 schema for V Try-On platform

Revision ID: 001_create_core_v1_schema
Revises: 
Create Date: 2026-09-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = "001_create_core_v1_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------
    # 1. users table
    # -------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("public_id", sa.String(50), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
        ),
        sa.UniqueConstraint("public_id", name="uq_users_public_id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_users_public_id", "users", ["public_id"])
    op.create_index("ix_users_email", "users", ["email"])

    # -------------------------------------------------------------
    # 2. auth_sessions table
    # -------------------------------------------------------------
    op.create_table(
        "auth_sessions",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("public_id", sa.String(50), nullable=False),
        sa.Column(
            "user_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("users.id", ondelete="CASCADE", name="fk_auth_sessions_user_id_users"),
            nullable=False,
        ),
        sa.Column("refresh_token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.UniqueConstraint("public_id", name="uq_auth_sessions_public_id"),
        sa.UniqueConstraint("refresh_token_hash", name="uq_auth_sessions_refresh_token_hash"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_auth_sessions_public_id", "auth_sessions", ["public_id"])
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_sessions_user_active", "auth_sessions", ["user_id", "revoked_at", "expires_at"])

    # -------------------------------------------------------------
    # 3. uploads table
    # -------------------------------------------------------------
    op.create_table(
        "uploads",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("public_id", sa.String(50), nullable=False),
        sa.Column(
            "user_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("users.id", ondelete="CASCADE", name="fk_uploads_user_id_users"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(32), nullable=False, server_default="person"),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("mime_type", sa.String(64), nullable=False),
        sa.Column(
            "size_bytes",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            nullable=False,
        ),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("sha256", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("public_id", name="uq_uploads_public_id"),
        sa.UniqueConstraint("storage_key", name="uq_uploads_storage_key"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_uploads_public_id", "uploads", ["public_id"])
    op.create_index("ix_uploads_user_id", "uploads", ["user_id"])
    op.create_index("ix_uploads_owner_created", "uploads", ["user_id", "status", "created_at"])
    op.create_index("ix_uploads_hash", "uploads", ["user_id", "sha256"])

    # -------------------------------------------------------------
    # 4. outfits table
    # -------------------------------------------------------------
    op.create_table(
        "outfits",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("public_id", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64), nullable=False, server_default="upper_body"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_storage_key", sa.String(500), nullable=False),
        sa.Column("thumbnail_storage_key", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
        ),
        sa.UniqueConstraint("public_id", name="uq_outfits_public_id"),
        sa.UniqueConstraint("slug", name="uq_outfits_slug"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_outfits_public_id", "outfits", ["public_id"])
    op.create_index("ix_outfits_catalog", "outfits", ["is_active", "category", "sort_order"])

    # -------------------------------------------------------------
    # 5. favorites table (Composite PK)
    # -------------------------------------------------------------
    op.create_table(
        "favorites",
        sa.Column(
            "user_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("users.id", ondelete="CASCADE", name="fk_favorites_user_id_users"),
            primary_key=True,
        ),
        sa.Column(
            "outfit_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("outfits.id", ondelete="CASCADE", name="fk_favorites_outfit_id_outfits"),
            primary_key=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_favorites_created", "favorites", ["user_id", "created_at"])

    # -------------------------------------------------------------
    # 6. try_on_jobs table
    # -------------------------------------------------------------
    op.create_table(
        "try_on_jobs",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("public_id", sa.String(50), nullable=False),
        sa.Column(
            "user_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("users.id", ondelete="CASCADE", name="fk_try_on_jobs_user_id_users"),
            nullable=False,
        ),
        sa.Column(
            "person_upload_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("uploads.id", ondelete="RESTRICT", name="fk_try_on_jobs_person_upload_id_uploads"),
            nullable=False,
        ),
        sa.Column(
            "outfit_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("outfits.id", ondelete="RESTRICT", name="fk_try_on_jobs_outfit_id_outfits"),
            nullable=False,
        ),
        sa.Column("status", sa.String(32), nullable=False, server_default="queued"),
        sa.Column("celery_task_id", sa.String(100), nullable=True),
        sa.Column("error_code", sa.String(80), nullable=True),
        sa.Column("error_message", sa.String(500), nullable=True),
        sa.Column(
            "queued_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
        ),
        sa.UniqueConstraint("public_id", name="uq_try_on_jobs_public_id"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_try_on_jobs_public_id", "try_on_jobs", ["public_id"])
    op.create_index("ix_try_on_jobs_user_id", "try_on_jobs", ["user_id"])
    op.create_index("ix_try_on_jobs_person_upload_id", "try_on_jobs", ["person_upload_id"])
    op.create_index("ix_try_on_jobs_outfit_id", "try_on_jobs", ["outfit_id"])
    op.create_index("ix_tryons_queue_state", "try_on_jobs", ["status", "queued_at"])
    op.create_index("ix_tryons_owner_created", "try_on_jobs", ["user_id", "created_at"])

    # -------------------------------------------------------------
    # 7. try_on_results table (1:1 with TryOnJob)
    # -------------------------------------------------------------
    op.create_table(
        "try_on_results",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("public_id", sa.String(50), nullable=False),
        sa.Column(
            "job_id",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            sa.ForeignKey("try_on_jobs.id", ondelete="CASCADE", name="fk_try_on_results_job_id_try_on_jobs"),
            nullable=False,
        ),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("mime_type", sa.String(64), nullable=False, server_default="image/png"),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column(
            "size_bytes",
            sa.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql"),
            nullable=True,
        ),
        sa.Column("sha256", sa.String(64), nullable=True),
        sa.Column("execution_time_seconds", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
        ),
        sa.UniqueConstraint("public_id", name="uq_try_on_results_public_id"),
        sa.UniqueConstraint("job_id", name="uq_try_on_results_job_id"),
        sa.UniqueConstraint("storage_key", name="uq_try_on_results_storage_key"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_try_on_results_public_id", "try_on_results", ["public_id"])
    op.create_index("ix_try_on_results_job_id", "try_on_results", ["job_id"])


def downgrade() -> None:
    # Drop tables in exact reverse dependency order
    op.drop_table("try_on_results")
    op.drop_table("try_on_jobs")
    op.drop_table("favorites")
    op.drop_table("outfits")
    op.drop_table("uploads")
    op.drop_table("auth_sessions")
    op.drop_table("users")
