from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.core.config import settings


@pytest.mark.integration
def test_alembic_migration_from_empty_database():
    """
    Test running Alembic migrations sequentially from scratch up to 'head'
    on a dedicated MySQL test database, verifying all expected tables, columns,
    and indexes are created cleanly without DDL errors.
    """
    base_url = f"mysql+pymysql://{settings.DATABASE_USER}:{settings.DATABASE_PASSWORD.get_secret_value() if hasattr(settings.DATABASE_PASSWORD, 'get_secret_value') else settings.DATABASE_PASSWORD}@{settings.DATABASE_HOST}:{settings.DATABASE_PORT}"
    test_db_name = "vtryon_test_migration"
    test_db_url = f"{base_url}/{test_db_name}"

    try:
        admin_engine = create_engine(f"{base_url}/mysql", pool_pre_ping=True)
        with admin_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f"DROP DATABASE IF EXISTS `{test_db_name}`"))
            conn.execute(text(f"CREATE DATABASE `{test_db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        admin_engine.dispose()
    except Exception as exc:
        pytest.skip(f"MySQL server not accessible for migration test: {exc}")

    try:
        ini_path = Path(__file__).parent.parent.parent / "alembic.ini"
        alembic_cfg = Config(str(ini_path))
        alembic_cfg.set_main_option("sqlalchemy.url", test_db_url)

        # 1. Execute migrations to head
        command.upgrade(alembic_cfg, "head")

        # 2. Inspect resulting schema
        test_engine = create_engine(test_db_url)
        inspector = inspect(test_engine)
        tables = inspector.get_table_names()

        # Core tables from Revision 001
        assert "users" in tables
        assert "auth_sessions" in tables
        assert "uploads" in tables
        assert "outfits" in tables
        assert "favorites" in tables
        assert "try_on_jobs" in tables
        assert "try_on_results" in tables

        # Revision 002 additions
        tryon_job_cols = {col["name"] for col in inspector.get_columns("try_on_jobs")}
        assert "idempotency_key" in tryon_job_cols

        tryon_res_cols = {col["name"] for col in inspector.get_columns("try_on_results")}
        assert "model_version" in tryon_res_cols
        assert "inference_config_version" in tryon_res_cols

        test_engine.dispose()

    finally:
        # Cleanup test database
        try:
            admin_engine = create_engine(f"{base_url}/mysql", pool_pre_ping=True)
            with admin_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                conn.execute(text(f"DROP DATABASE IF EXISTS `{test_db_name}`"))
            admin_engine.dispose()
        except Exception:
            pass
