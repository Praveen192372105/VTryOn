import ast
from pathlib import Path
import pytest
from pydantic import SecretStr

from app.core.config import (
    AppEnvironment,
    BACKEND_ROOT,
    CatVTONDType,
    Settings,
    get_settings,
)
from app.storage.local import LocalMediaStorage


def test_valid_development_configuration():
    """Verify minimal valid development configuration loads and validates successfully."""
    cfg = Settings(
        APP_NAME="Virtual Try-On API",
        APP_ENV=AppEnvironment.DEVELOPMENT,
        DEBUG=True,
        API_V1_PREFIX="/api/v1",
        DATABASE_URL="mysql+pymysql://root:@localhost:3306/vtryon",
        REDIS_URL="redis://127.0.0.1:6379/0",
        CELERY_BROKER_URL="redis://127.0.0.1:6379/1",
        CELERY_RESULT_BACKEND="redis://127.0.0.1:6379/2",
        JWT_SECRET=SecretStr("vtryon_development_secret_key_super_secure_32_bytes_min"),
        ACCESS_TOKEN_MINUTES=15,
        REFRESH_TOKEN_DAYS=30,
        MAX_UPLOAD_MB=12,
        ALLOWED_IMAGE_TYPES="image/jpeg, image/png, image/webp",
        CATVTON_DEVICE="cuda",
        CATVTON_DTYPE="bf16",
        CATVTON_WIDTH=768,
        CATVTON_HEIGHT=1024,
        CATVTON_MAX_CONCURRENCY=1,
    )
    assert cfg.app.environment == AppEnvironment.DEVELOPMENT
    assert cfg.app.debug is True
    assert cfg.app.api_v1_prefix == "/api/v1"
    assert cfg.media.max_upload_mb == 12
    assert cfg.media.max_upload_bytes == 12 * 1024 * 1024
    assert cfg.media.allowed_image_types == ("image/jpeg", "image/png", "image/webp")
    assert cfg.catvton.device == "cuda"
    assert cfg.catvton.dtype == "bf16"
    assert cfg.catvton.width == 768
    assert cfg.catvton.height == 1024
    assert cfg.catvton.max_concurrency == 1


def test_missing_production_jwt_secret():
    """Verify production requires an explicit non-empty JWT_SECRET."""
    with pytest.raises(ValueError, match="JWT_SECRET must be provided|JWT_SECRET must not be empty"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            DATABASE_URL="mysql+pymysql://user:pass@10.0.0.1:3306/vtryon",
            JWT_SECRET=SecretStr(""),
            SECRET_KEY="",
        )


def test_weak_production_jwt_secret():
    """Verify production rejects known weak placeholders and secrets shorter than 32 chars."""
    with pytest.raises(ValueError, match="Insecure placeholder JWT_SECRET detected"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            DATABASE_URL="mysql+pymysql://user:pass@10.0.0.1:3306/vtryon",
            JWT_SECRET=SecretStr("replace-with-long-random-secret"),
        )

    with pytest.raises(ValueError, match="must be at least 32 characters in production"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            DATABASE_URL="mysql+pymysql://user:pass@10.0.0.1:3306/vtryon",
            JWT_SECRET=SecretStr("short_secret_under_32_chars"),
        )


def test_production_debug_rejection():
    """Verify production strictly rejects DEBUG=True."""
    with pytest.raises(ValueError, match="DEBUG must be False in production environment"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=True,
            DATABASE_URL="mysql+pymysql://user:pass@10.0.0.1:3306/vtryon",
            JWT_SECRET=SecretStr("super_long_production_secret_key_1234567890"),
        )


def test_development_debug_accepted():
    """Verify development permits DEBUG=True."""
    cfg = Settings(
        APP_ENV=AppEnvironment.DEVELOPMENT,
        DEBUG=True,
        DATABASE_URL="mysql+pymysql://root:@localhost:3306/vtryon",
    )
    assert cfg.DEBUG is True
    assert cfg.app.debug is True


def test_api_prefix_validation():
    """Verify API_V1_PREFIX strict validation rules."""
    # Must start with '/'
    with pytest.raises(ValueError, match="must start with '/'"):
        Settings(API_V1_PREFIX="api/v1")

    # Must not end with '/'
    with pytest.raises(ValueError, match="must not end with '/'"):
        Settings(API_V1_PREFIX="/api/v1/")

    # Must not contain whitespace
    with pytest.raises(ValueError, match="must not contain whitespace"):
        Settings(API_V1_PREFIX="/api/ v1")

    # Must not be an absolute URL
    with pytest.raises(ValueError, match="must not be an absolute URL"):
        Settings(API_V1_PREFIX="http://localhost:8000/api")


def test_upload_limits_validation():
    """Verify MAX_UPLOAD_MB boundaries (1 to 50 MB)."""
    with pytest.raises(ValueError, match="MAX_UPLOAD_MB must be between 1 and 50 MB"):
        Settings(MAX_UPLOAD_MB=0)

    with pytest.raises(ValueError, match="MAX_UPLOAD_MB must be between 1 and 50 MB"):
        Settings(MAX_UPLOAD_MB=-5)

    with pytest.raises(ValueError, match="MAX_UPLOAD_MB must be between 1 and 50 MB"):
        Settings(MAX_UPLOAD_MB=500)

    valid_cfg = Settings(MAX_UPLOAD_MB=25)
    assert valid_cfg.MAX_UPLOAD_MB == 25
    assert valid_cfg.media.max_upload_bytes == 25 * 1024 * 1024


def test_allowed_image_types_normalization():
    """Verify ALLOWED_IMAGE_TYPES normalization from CSV and rejection of invalid types."""
    cfg = Settings(ALLOWED_IMAGE_TYPES="image/jpeg, image/png ,image/webp ")
    assert cfg.media.allowed_image_types == ("image/jpeg", "image/png", "image/webp")

    with pytest.raises(ValueError, match="Unsupported MIME type"):
        Settings(ALLOWED_IMAGE_TYPES="image/jpeg,application/pdf")

    with pytest.raises(ValueError, match="ALLOWED_IMAGE_TYPES must not be empty"):
        Settings(ALLOWED_IMAGE_TYPES="")


def test_catvton_concurrency_validation():
    """Verify CATVTON_MAX_CONCURRENCY bounds (1 to 8)."""
    with pytest.raises(ValueError, match="CATVTON_MAX_CONCURRENCY must be at least 1"):
        Settings(CATVTON_MAX_CONCURRENCY=0)

    with pytest.raises(ValueError, match="CATVTON_MAX_CONCURRENCY exceeds maximum allowed limit"):
        Settings(CATVTON_MAX_CONCURRENCY=100)

    cfg = Settings(CATVTON_MAX_CONCURRENCY=1)
    assert cfg.catvton.max_concurrency == 1


def test_catvton_dimensions_validation():
    """Verify CATVTON width and height bounds."""
    with pytest.raises(ValueError, match="CatVTON dimension must be greater than 0"):
        Settings(CATVTON_WIDTH=0)

    with pytest.raises(ValueError, match="CatVTON dimension must not exceed 4096 pixels"):
        Settings(CATVTON_HEIGHT=5000)

    cfg = Settings(CATVTON_WIDTH=768, CATVTON_HEIGHT=1024)
    assert cfg.catvton.width == 768
    assert cfg.catvton.height == 1024


def test_production_database_scheme_validation():
    """Verify production rejects non-MySQL database schemes."""
    with pytest.raises(ValueError, match="Production database URL must use MySQL scheme"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            DATABASE_URL="sqlite:///production.db",
            JWT_SECRET=SecretStr("super_long_production_secret_key_1234567890"),
        )


def test_secret_redaction_and_repr():
    """Verify secrets are never leaked in repr, str, or safe_summary."""
    db_url = "mysql+pymysql://admin:SuperSecretPass123@10.0.0.1:3306/vtryon"
    secret_key = "my_super_secret_jwt_key_that_must_not_leak"
    cfg = Settings(
        DATABASE_URL=db_url,
        JWT_SECRET=SecretStr(secret_key),
    )

    # 1. Repr must not leak password or secret
    rendered_repr = repr(cfg)
    assert "SuperSecretPass123" not in rendered_repr
    assert secret_key not in rendered_repr
    assert "***" in rendered_repr

    # 2. safe_database_url must hide password
    assert "SuperSecretPass123" not in cfg.safe_database_url
    assert "***" in cfg.safe_database_url

    # 3. safe_summary must not leak secrets
    summary = cfg.safe_summary()
    summary_str = str(summary)
    assert "SuperSecretPass123" not in summary_str
    assert secret_key not in summary_str


def test_relative_media_path_resolution():
    """Verify relative media and catvton roots resolve deterministically against BACKEND_ROOT."""
    cfg = Settings(
        MEDIA_ROOT="./storage",
        CATVTON_ROOT="./CatVTON",
    )
    expected_storage = (BACKEND_ROOT / "storage").resolve()
    expected_catvton = (BACKEND_ROOT / "CatVTON").resolve()
    assert cfg.resolved_storage_root == expected_storage
    assert cfg.resolved_catvton_root == expected_catvton


def test_settings_cache_idempotency():
    """Verify get_settings returns the identical cached singleton instance."""
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2


def test_api_and_worker_media_root_consistency():
    """Verify LocalMediaStorage and Settings.media.root share the exact same directory."""
    cfg = get_settings()
    storage = LocalMediaStorage()
    assert storage.root_dir == cfg.media.root
    assert storage.root_dir == cfg.resolved_storage_root


def test_no_os_getenv_in_business_layers():
    """
    Architecture Invariant Test:
    Enforce that no business modules in app/ (api, services, repositories, storage, workers, ai)
    directly invoke os.getenv or os.environ. Only app/core/config.py is permitted.
    """
    app_dir = BACKEND_ROOT / "app"
    forbidden_calls = []

    for py_file in app_dir.rglob("*.py"):
        # Exclude config.py itself
        if py_file.name == "config.py":
            continue

        content = py_file.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(py_file))

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # Check for os.getenv(...)
                if (
                    isinstance(node.func, ast.Attribute)
                    and node.func.attr == "getenv"
                    and isinstance(node.func.value, ast.Name)
                    and node.func.value.id == "os"
                ):
                    forbidden_calls.append(f"{py_file.relative_to(BACKEND_ROOT)}: line {node.lineno} calls os.getenv")
            elif isinstance(node, ast.Subscript):
                # Check for os.environ[...]
                if (
                    isinstance(node.value, ast.Attribute)
                    and node.value.attr == "environ"
                    and isinstance(node.value.value, ast.Name)
                    and node.value.value.id == "os"
                ):
                    forbidden_calls.append(f"{py_file.relative_to(BACKEND_ROOT)}: line {node.lineno} accesses os.environ")

    assert not forbidden_calls, "Forbidden direct environment access detected:\n" + "\n".join(forbidden_calls)
