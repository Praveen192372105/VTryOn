"""Add idempotency key to try_on_jobs and model versioning to try_on_results

Revision ID: 002_add_idempotency_and_model_version
Revises: 001_create_core_v1_schema
Create Date: 2026-09-03

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "002_add_idempotency_and_model_version"
down_revision: Union[str, None] = "001_create_core_v1_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add idempotency_key and unique constraint to try_on_jobs
    op.add_column(
        "try_on_jobs",
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
    )
    op.create_index(
        "uq_tryons_user_idempotency",
        "try_on_jobs",
        ["user_id", "idempotency_key"],
        unique=True,
    )

    # 2. Add model_version and inference_config_version to try_on_results
    op.add_column(
        "try_on_results",
        sa.Column("model_version", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "try_on_results",
        sa.Column("inference_config_version", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    # 1. Remove model_version and inference_config_version from try_on_results
    op.drop_column("try_on_results", "inference_config_version")
    op.drop_column("try_on_results", "model_version")

    # 2. Drop unique index and column from try_on_jobs
    op.drop_index("uq_tryons_user_idempotency", table_name="try_on_jobs")
    op.drop_column("try_on_jobs", "idempotency_key")
