import ast
from pathlib import Path
import pytest

from app.db.base import Base
from app.db import models
from app.main import app
from app.workers.celery_app import celery_app


def test_fastapi_app_initialization_and_routes():
    """Verify FastAPI instance initializes and registers all canonical v1 routes."""
    assert app is not None
    openapi_schema = app.openapi()
    route_paths = list(openapi_schema.get("paths", {}).keys())

    # Verify root health & readiness
    assert "/health" in route_paths
    assert "/ready" in route_paths

    # Verify canonical v1 route groups
    assert any(p.startswith("/api/v1/auth") for p in route_paths)
    assert any(p.startswith("/api/v1/users") for p in route_paths)
    assert any(p.startswith("/api/v1/uploads") for p in route_paths)
    assert any(p.startswith("/api/v1/outfits") for p in route_paths)
    assert any(p.startswith("/api/v1/favorites") for p in route_paths)
    assert any(p.startswith("/api/v1/try-ons") for p in route_paths)


def test_sqlalchemy_model_metadata_discovery():
    """Verify all 7 core domain tables are registered in SQLAlchemy metadata."""
    registered_tables = Base.metadata.tables.keys()

    expected_tables = {
        "users",
        "auth_sessions",
        "uploads",
        "outfits",
        "favorites",
        "try_on_jobs",
        "try_on_results",
    }

    for tbl in expected_tables:
        assert tbl in registered_tables, f"Table '{tbl}' is missing from SQLAlchemy Base metadata."


def test_celery_task_registration():
    """Verify background worker tasks are discovered and registered in Celery."""
    assert "app.workers.tasks.tryons.process_tryon_job" in celery_app.tasks


def test_routes_do_not_import_catvton_directly():
    """
    ARCHITECTURE GUARD:
    Verify that route modules under app/api/ NEVER import CatVTON directly.
    """
    api_dir = Path(__file__).resolve().parent.parent.parent / "app" / "api"
    api_py_files = list(api_dir.rglob("*.py"))

    for py_file in api_py_files:
        content = py_file.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(py_file))

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    assert not alias.name.startswith("CatVTON"), (
                        f"Direct CatVTON import '{alias.name}' detected in route file: {py_file}"
                    )
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                assert not module.startswith("CatVTON"), (
                    f"Direct CatVTON import from '{module}' detected in route file: {py_file}"
                )


def test_repositories_do_not_import_fastapi():
    """
    ARCHITECTURE GUARD:
    Verify that persistence repositories under app/repositories/ NEVER import FastAPI or HTTP concepts.
    """
    repo_dir = Path(__file__).resolve().parent.parent.parent / "app" / "repositories"
    repo_py_files = list(repo_dir.rglob("*.py"))

    forbidden_imports = {"fastapi", "starlette"}

    for py_file in repo_py_files:
        content = py_file.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(py_file))

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    assert alias.name not in forbidden_imports, (
                        f"Forbidden transport import '{alias.name}' detected in repository: {py_file}"
                    )
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                root_pkg = module.split(".")[0]
                assert root_pkg not in forbidden_imports, (
                    f"Forbidden transport import from '{module}' detected in repository: {py_file}"
                )


def test_routes_do_not_execute_direct_sql():
    """
    ARCHITECTURE GUARD:
    Verify route endpoints under app/api/v1/ do not execute direct SQLAlchemy statements.
    """
    v1_dir = Path(__file__).resolve().parent.parent.parent / "app" / "api" / "v1"
    v1_py_files = [f for f in v1_dir.glob("*.py") if f.name != "router.py"]

    forbidden_patterns = [".execute(", ".query(", ".commit()", ".rollback()"]

    for py_file in v1_py_files:
        content = py_file.read_text(encoding="utf-8")
        for pattern in forbidden_patterns:
            assert pattern not in content, (
                f"Direct database operation '{pattern}' detected in route module: {py_file}"
            )
