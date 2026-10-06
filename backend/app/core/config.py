import json
import os
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

# Defensive GPU device index normalization
if os.environ.get("CUDA_VISIBLE_DEVICES") in ("1", ""):
    os.environ["CUDA_VISIBLE_DEVICES"] = "0"

# Project backend root: backend/
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent

KNOWN_WEAK_SECRETS = {
    "replace-with-long-random-secret",
    "replace-with-a-long-random-development-secret",
    "secret",
    "changeme",
    "password",
    "test",
    "admin",
    "123456",
}


class AppEnvironment(str, Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class CatVTONDType(str, Enum):
    BF16 = "bf16"
    FP16 = "fp16"
    FP32 = "fp32"
    FLOAT16 = "float16"
    BFLOAT16 = "bfloat16"
    FLOAT32 = "float32"


# -----------------------------------------------------------------------------
# Strongly Typed Sub-Settings Models
# -----------------------------------------------------------------------------
class AppSettings(BaseModel):
    name: str = "Virtual Try-On API"
    environment: AppEnvironment = AppEnvironment.DEVELOPMENT
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins: Tuple[str, ...] = (
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    )


class DatabaseSettings(BaseModel):
    url: str
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 1800
    echo: bool = False


class RedisSettings(BaseModel):
    url: str = "redis://127.0.0.1:6379/0"


class CelerySettings(BaseModel):
    broker_url: str = "redis://127.0.0.1:6379/1"
    result_backend: str = "redis://127.0.0.1:6379/2"
    default_queue: str = "default"
    gpu_queue: str = "gpu"
    soft_time_limit_seconds: int = 240
    time_limit_seconds: int = 300
    visibility_timeout_seconds: int = 1800
    max_retries: int = 2
    retry_base_seconds: int = 10


class JWTSettings(BaseModel):
    secret: SecretStr
    algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30


class MediaSettings(BaseModel):
    root: Path
    base_url: str = "/media"
    max_upload_mb: int = 12
    allowed_image_types: Tuple[str, ...] = ("image/jpeg", "image/png", "image/webp")
    min_image_width: int = 256
    min_image_height: int = 256
    max_image_width: int = 8192
    max_image_height: int = 8192
    max_image_pixels: int = 40_000_000

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


class CatVTONSettings(BaseModel):
    root: Path = Field(default_factory=lambda: Path("./storage"))
    device: str = "cuda"
    dtype: str = "bf16"
    width: int = 768
    height: int = 1024
    max_concurrency: int = 1
    checkpoint_dir: str = "zhengchong/CatVTON"
    base_model_path: str = "booksforcharlie/stable-diffusion-inpainting"
    inference_steps: int = 40
    guidance_scale: float = 2.5
    allow_tf32: bool = True
    repaint: bool = True

    @property
    def root_path(self) -> Path:
        return self.root


# -----------------------------------------------------------------------------
# Central Root Configuration
# -----------------------------------------------------------------------------
class Settings(BaseSettings):
    """
    Canonical centralized configuration system for V Try-On backend.
    Enforces strong typing, environment safety invariants, and secret redaction.
    """

    # 1. Application Settings
    APP_NAME: str = "Virtual Try-On API"
    APP_ENV: AppEnvironment = AppEnvironment.DEVELOPMENT
    DEBUG: Optional[bool] = None
    APP_DEBUG: bool = True  # Backward compatibility alias
    API_V1_PREFIX: str = "/api/v1"
    API_V1_STR: Optional[str] = None  # Backward compatibility alias
    LOG_LEVEL: str = "INFO"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = False
    DEV_LAN_HOST: Optional[str] = None

    # 2. Database Settings
    DATABASE_HOST: str = "127.0.0.1"
    DATABASE_PORT: int = 3306
    DATABASE_NAME: str = "vtryon"
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = ""
    DATABASE_URL: Optional[str] = None
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_TIMEOUT_SECONDS: Optional[int] = None
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_RECYCLE_SECONDS: Optional[int] = None
    DB_ECHO: bool = False
    DB_SLOW_QUERY_MS: int = 500

    # 3. Redis & Celery Settings
    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    CELERY_BROKER_URL: str = "redis://127.0.0.1:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://127.0.0.1:6379/2"
    CELERY_DEFAULT_QUEUE: str = "default"
    CELERY_GPU_QUEUE: str = "gpu"
    CELERY_GPU_SOFT_TIME_LIMIT_SECONDS: int = 240
    CELERY_GPU_TIME_LIMIT_SECONDS: int = 300
    CELERY_VISIBILITY_TIMEOUT_SECONDS: int = 1800
    CELERY_GPU_MAX_RETRIES: int = 2
    CELERY_GPU_RETRY_BASE_SECONDS: int = 10

    # 4. Authentication & JWT Settings
    JWT_SECRET: Optional[SecretStr] = None
    SECRET_KEY: Optional[str] = None  # Backward compatibility alias
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 15
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: Optional[int] = None  # Backward compatibility alias
    REFRESH_TOKEN_DAYS: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: Optional[int] = None  # Backward compatibility alias

    # 5. Media & Storage Settings
    MEDIA_ROOT: str = "./storage"
    STORAGE_ROOT: Optional[str] = None  # Backward compatibility alias
    UPLOAD_ROOT: Optional[str] = None
    RESULT_ROOT: Optional[str] = None
    TEMP_ROOT: Optional[str] = None
    MEDIA_BASE_URL: str = "/media"
    MAX_UPLOAD_MB: int = 12
    MAX_UPLOAD_BYTES: Optional[int] = None
    ALLOWED_IMAGE_TYPES: Union[str, Tuple[str, ...], List[str]] = (
        "image/jpeg",
        "image/png",
        "image/webp",
    )
    MIN_IMAGE_WIDTH: int = 256
    MIN_IMAGE_HEIGHT: int = 256
    MAX_IMAGE_WIDTH: int = 8192
    MAX_IMAGE_HEIGHT: int = 8192
    MAX_IMAGE_PIXELS: int = 40_000_000

    # S3 / Object Storage Configuration (Phase 14)
    STORAGE_BACKEND: str = "local"  # "local" or "s3"
    S3_BUCKET_NAME: Optional[str] = None
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY_ID: Optional[SecretStr] = None
    S3_SECRET_ACCESS_KEY: Optional[SecretStr] = None
    PRIVATE_MEDIA_URL_TTL_SECONDS: int = 300

    # 6. CatVTON AI Settings
    CATVTON_ROOT: str = "./CatVTON"
    CATVTON_MODEL_DIR: Optional[str] = None
    CATVTON_DEVICE: str = "cuda"
    CATVTON_DTYPE: str = "fp16"
    CATVTON_MIXED_PRECISION: Optional[str] = None  # Backward compatibility alias
    CATVTON_WIDTH: int = 768
    CATVTON_IMAGE_WIDTH: Optional[int] = None  # Backward compatibility alias
    CATVTON_HEIGHT: int = 1024
    CATVTON_IMAGE_HEIGHT: Optional[int] = None  # Backward compatibility alias
    CATVTON_MAX_CONCURRENCY: int = 1
    CATVTON_CHECKPOINT_DIR: str = "zhengchong/CatVTON"
    CATVTON_BASE_MODEL: str = "booksforcharlie/stable-diffusion-inpainting"
    CATVTON_INFERENCE_STEPS: int = 40
    CATVTON_GUIDANCE_SCALE: float = 2.5
    CATVTON_ALLOW_TF32: bool = True
    CATVTON_REPAINT: bool = False

    # Model Versioning & Provenance (Phase 14)
    CATVTON_MODEL_VERSION: str = "catvton-1.0-v1"
    INFERENCE_CONFIG_VERSION: str = "v1-accurate"

    # 6.5 CatVTON Execution & Optimization Settings
    TRYON_PRIMARY_PROVIDER: str = "catvton"
    CATVTON_ENABLED: bool = True
    CATVTON_TARGET_LATENCY_SECONDS: int = 60
    CATVTON_HARD_TIMEOUT_SECONDS: int = 90
    CATVTON_WARMUP: bool = True
    CATVTON_PRESET: str = "fast"
    CATVTON_DTYPE: str = "bf16"
    CATVTON_AUTOMASKER_DEVICE: str = "cpu"
    CATVTON_ALLOW_TF32: bool = True
    CATVTON_WIDTH: int = 768
    CATVTON_HEIGHT: int = 1024
    CATVTON_INFERENCE_STEPS: int = 30
    CATVTON_GUIDANCE_SCALE: float = 2.5
    CATVTON_REPAINT: bool = True
    CATVTON_CACHE_PREPROCESSING: bool = True

    # 7. CORS Configuration
    CORS_ORIGINS: Union[str, List[str], Tuple[str, ...]] = (
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    )
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_ALLOWED_HEADERS: List[str] = ["Authorization", "Content-Type", "X-Request-ID", "Idempotency-Key"]

    # 8. Rate Limiting & Resource Capacity Settings (Phase 13)
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REDIS_PREFIX: str = "vtryon:rate"
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_LOGIN_PER_IP_PER_MINUTE: int = 30
    RATE_LIMIT_REGISTER_PER_HOUR: int = 5
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 15
    RATE_LIMIT_TRYON_PER_MINUTE: int = 8

    MAX_ACTIVE_TRYONS_PER_USER: int = 2
    MAX_QUEUED_TRYONS_GLOBAL: int = 100
    ADMISSION_LOCK_TTL_SECONDS: int = 10
    TRUSTED_PROXY_HEADERS: bool = False

    # 9. Observability & Metrics (Phase 14)
    METRICS_ENABLED: bool = True

    # -------------------------------------------------------------------------
    # Field Normalizers & Validators
    # -------------------------------------------------------------------------
    @field_validator("API_V1_PREFIX", mode="before")
    @classmethod
    def validate_api_prefix(cls, v: Any) -> str:
        if not isinstance(v, str):
            raise ValueError("API_V1_PREFIX must be a string")
        val = v.strip()
        if val.startswith("http://") or val.startswith("https://"):
            raise ValueError("API_V1_PREFIX must not be an absolute URL")
        if not val.startswith("/"):
            raise ValueError(f"API_V1_PREFIX must start with '/': '{v}'")
        if val != "/" and val.endswith("/"):
            raise ValueError(f"API_V1_PREFIX must not end with '/': '{v}'")
        if any(c.isspace() for c in val):
            raise ValueError("API_V1_PREFIX must not contain whitespace")
        return val

    @field_validator("ACCESS_TOKEN_MINUTES", mode="before")
    @classmethod
    def validate_access_token_minutes(cls, v: Any) -> int:
        val = int(v)
        if val <= 0:
            raise ValueError("ACCESS_TOKEN_MINUTES must be greater than 0")
        if val > 43200:  # 30 days
            raise ValueError("ACCESS_TOKEN_MINUTES exceeds maximum allowed limit (43200)")
        return val

    @field_validator("REFRESH_TOKEN_DAYS", mode="before")
    @classmethod
    def validate_refresh_token_days(cls, v: Any) -> int:
        val = int(v)
        if val <= 0:
            raise ValueError("REFRESH_TOKEN_DAYS must be greater than 0")
        if val > 365:
            raise ValueError("REFRESH_TOKEN_DAYS exceeds maximum allowed limit (365)")
        return val

    @field_validator("MAX_UPLOAD_MB", mode="before")
    @classmethod
    def validate_max_upload_mb(cls, v: Any) -> int:
        val = int(v)
        if val < 1 or val > 50:
            raise ValueError("MAX_UPLOAD_MB must be between 1 and 50 MB")
        return val

    @field_validator("ALLOWED_IMAGE_TYPES", mode="before")
    @classmethod
    def normalize_allowed_image_types(cls, v: Any) -> Tuple[str, ...]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    items = json.loads(v)
                    normalized = tuple(str(i).strip().lower() for i in items if str(i).strip())
                except Exception:
                    normalized = tuple(i.strip().lower() for i in v.strip("[]").split(",") if i.strip())
            else:
                normalized = tuple(i.strip().lower() for i in v.split(",") if i.strip())
        elif isinstance(v, (list, tuple, set)):
            normalized = tuple(str(i).strip().lower() for i in v if str(i).strip())
        else:
            raise ValueError("ALLOWED_IMAGE_TYPES must be a string or list/tuple of MIME strings")

        if not normalized:
            raise ValueError("ALLOWED_IMAGE_TYPES must not be empty")

        valid_mimes = {"image/jpeg", "image/png", "image/webp"}
        for mime in normalized:
            if mime not in valid_mimes:
                raise ValueError(f"Unsupported MIME type in ALLOWED_IMAGE_TYPES: '{mime}'")
        return normalized

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def normalize_cors_origins(cls, v: Any) -> Tuple[str, ...]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return tuple(json.loads(v))
                except Exception:
                    pass
            return tuple(i.strip() for i in v.split(",") if i.strip())
        elif isinstance(v, (list, tuple, set)):
            return tuple(str(i).strip() for i in v if str(i).strip())
        return tuple()

    @field_validator("CATVTON_DEVICE", mode="before")
    @classmethod
    def validate_catvton_device(cls, v: Any) -> str:
        val = str(v).strip().lower()
        if val not in {"cuda", "cpu", "mps"}:
            raise ValueError(f"Unsupported CATVTON_DEVICE: '{v}'. Must be cuda, cpu, or mps.")
        return val

    @field_validator("CATVTON_DTYPE", mode="before")
    @classmethod
    def validate_catvton_dtype(cls, v: Any) -> str:
        val = str(v).strip().lower()
        valid = {"bf16", "fp16", "fp32", "float16", "bfloat16", "float32"}
        if val not in valid:
            raise ValueError(f"Unsupported CATVTON_DTYPE: '{v}'. Must be one of {sorted(valid)}.")
        return val

    @field_validator("CATVTON_WIDTH", "CATVTON_HEIGHT", mode="before")
    @classmethod
    def validate_catvton_dimensions(cls, v: Any) -> int:
        val = int(v)
        if val <= 0:
            raise ValueError("CatVTON dimension must be greater than 0")
        if val > 4096:
            raise ValueError("CatVTON dimension must not exceed 4096 pixels")
        return val

    @field_validator("CATVTON_MAX_CONCURRENCY", mode="before")
    @classmethod
    def validate_catvton_concurrency(cls, v: Any) -> int:
        val = int(v)
        if val < 1:
            raise ValueError("CATVTON_MAX_CONCURRENCY must be at least 1")
        if val > 8:
            raise ValueError("CATVTON_MAX_CONCURRENCY exceeds maximum allowed limit (8)")
        return val

    # -------------------------------------------------------------------------
    # Root Post-Initialization & Production Safety Validation
    # -------------------------------------------------------------------------
    @model_validator(mode="after")
    def assemble_and_validate_all(self) -> "Settings":
        # 1. Unify Debug Flag
        if self.DEBUG is not None:
            self.APP_DEBUG = self.DEBUG
        else:
            self.DEBUG = self.APP_DEBUG

        # 2. Unify API Prefix
        if self.API_V1_STR and not self.API_V1_PREFIX:
            self.API_V1_PREFIX = self.API_V1_STR

        # 3. Assemble DATABASE_URL if missing
        if not self.DATABASE_URL:
            auth_part = f"{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@" if self.DATABASE_PASSWORD else f"{self.DATABASE_USER}@"
            self.DATABASE_URL = f"mysql+pymysql://{auth_part}{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

        # 4. Unify JWT Secret
        if not self.JWT_SECRET and self.SECRET_KEY:
            self.JWT_SECRET = SecretStr(self.SECRET_KEY)
        elif not self.JWT_SECRET and not self.SECRET_KEY:
            # For non-production development convenience, fallback to standard dev key
            if self.APP_ENV != AppEnvironment.PRODUCTION:
                self.JWT_SECRET = SecretStr("vtryon_development_secret_key_super_secure_32_bytes_min")
            else:
                raise ValueError("JWT_SECRET must be provided in production environment")

        if self.JWT_SECRET:
            self.SECRET_KEY = self.JWT_SECRET.get_secret_value()

        # 5. Unify Token Expiries
        if self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES:
            self.ACCESS_TOKEN_MINUTES = self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        else:
            self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES = self.ACCESS_TOKEN_MINUTES

        if self.JWT_REFRESH_TOKEN_EXPIRE_DAYS:
            self.REFRESH_TOKEN_DAYS = self.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        else:
            self.JWT_REFRESH_TOKEN_EXPIRE_DAYS = self.REFRESH_TOKEN_DAYS

        # 6. Unify Media Storage Roots
        if self.STORAGE_ROOT and not self.MEDIA_ROOT:
            self.MEDIA_ROOT = self.STORAGE_ROOT
        elif self.MEDIA_ROOT:
            self.STORAGE_ROOT = self.MEDIA_ROOT

        if not self.MAX_UPLOAD_BYTES:
            self.MAX_UPLOAD_BYTES = self.MAX_UPLOAD_MB * 1024 * 1024

        # 7. Unify CatVTON Aliases
        if self.CATVTON_MIXED_PRECISION:
            self.CATVTON_DTYPE = str(self.CATVTON_MIXED_PRECISION).lower()
        if self.CATVTON_IMAGE_WIDTH:
            self.CATVTON_WIDTH = self.CATVTON_IMAGE_WIDTH
        if self.CATVTON_IMAGE_HEIGHT:
            self.CATVTON_HEIGHT = self.CATVTON_IMAGE_HEIGHT

        # CatVTON Device GPU/CPU Auto-Fallback Safety
        try:
            import torch
            if self.CATVTON_DEVICE == "cuda" and not torch.cuda.is_available():
                self.CATVTON_DEVICE = "cpu"
                self.CATVTON_DTYPE = "fp32"
        except Exception:
            pass


        # 8. Celery Timeout and Visibility Validation
        if self.CELERY_GPU_SOFT_TIME_LIMIT_SECONDS <= 0:
            raise ValueError("CELERY_GPU_SOFT_TIME_LIMIT_SECONDS must be greater than 0")
        if self.CELERY_GPU_TIME_LIMIT_SECONDS <= self.CELERY_GPU_SOFT_TIME_LIMIT_SECONDS:
            raise ValueError(
                f"CELERY_GPU_TIME_LIMIT_SECONDS ({self.CELERY_GPU_TIME_LIMIT_SECONDS}) must be strictly greater than "
                f"CELERY_GPU_SOFT_TIME_LIMIT_SECONDS ({self.CELERY_GPU_SOFT_TIME_LIMIT_SECONDS})"
            )
        if self.CELERY_VISIBILITY_TIMEOUT_SECONDS <= self.CELERY_GPU_TIME_LIMIT_SECONDS:
            raise ValueError(
                f"CELERY_VISIBILITY_TIMEOUT_SECONDS ({self.CELERY_VISIBILITY_TIMEOUT_SECONDS}) must be strictly greater than "
                f"CELERY_GPU_TIME_LIMIT_SECONDS ({self.CELERY_GPU_TIME_LIMIT_SECONDS})"
            )

        # 9. Rate Limit & Capacity Bounds Validation
        if self.RATE_LIMIT_LOGIN_PER_MINUTE <= 0:
            raise ValueError("RATE_LIMIT_LOGIN_PER_MINUTE must be greater than 0")
        if self.RATE_LIMIT_LOGIN_PER_IP_PER_MINUTE <= 0:
            raise ValueError("RATE_LIMIT_LOGIN_PER_IP_PER_MINUTE must be greater than 0")
        if self.RATE_LIMIT_REGISTER_PER_HOUR <= 0:
            raise ValueError("RATE_LIMIT_REGISTER_PER_HOUR must be greater than 0")
        if self.RATE_LIMIT_UPLOAD_PER_MINUTE <= 0:
            raise ValueError("RATE_LIMIT_UPLOAD_PER_MINUTE must be greater than 0")
        if self.RATE_LIMIT_TRYON_PER_MINUTE <= 0:
            raise ValueError("RATE_LIMIT_TRYON_PER_MINUTE must be greater than 0")
        if self.MAX_ACTIVE_TRYONS_PER_USER <= 0:
            raise ValueError("MAX_ACTIVE_TRYONS_PER_USER must be greater than 0")
        if self.MAX_QUEUED_TRYONS_GLOBAL <= 0:
            raise ValueError("MAX_QUEUED_TRYONS_GLOBAL must be greater than 0")
        if self.ADMISSION_LOCK_TTL_SECONDS <= 0:
            raise ValueError("ADMISSION_LOCK_TTL_SECONDS must be greater than 0")

        # 10. Database Pool Normalization (Phase 14)
        if self.DB_POOL_TIMEOUT_SECONDS is not None:
            self.DB_POOL_TIMEOUT = self.DB_POOL_TIMEOUT_SECONDS
        if self.DB_POOL_RECYCLE_SECONDS is not None:
            self.DB_POOL_RECYCLE = self.DB_POOL_RECYCLE_SECONDS

        # 11. Storage Backend Validation (Phase 14)
        if self.STORAGE_BACKEND not in ("local", "s3"):
            raise ValueError(f"STORAGE_BACKEND must be 'local' or 's3' (got '{self.STORAGE_BACKEND}')")

        # ---------------------------------------------------------------------
        # Production-Grade Safety Checks
        # ---------------------------------------------------------------------
        if self.APP_ENV == AppEnvironment.PRODUCTION:
            # A. Reject DEBUG in Production
            if self.DEBUG is True:
                raise ValueError("Configuration validation failed: DEBUG must be False in production environment")

            # B. Strict JWT Secret Validation in Production
            if not self.JWT_SECRET or not self.JWT_SECRET.get_secret_value():
                raise ValueError("Configuration validation failed: JWT_SECRET must not be empty in production")

            secret_val = self.JWT_SECRET.get_secret_value().strip()
            if secret_val.lower() in KNOWN_WEAK_SECRETS:
                raise ValueError("Configuration validation failed: Insecure placeholder JWT_SECRET detected for production")

            if len(secret_val) < 32:
                raise ValueError(
                    "Configuration validation failed: JWT_SECRET must be at least 32 characters in production"
                )

            # C. Production Database Scheme Validation
            if not (self.DATABASE_URL.startswith("mysql+pymysql://") or self.DATABASE_URL.startswith("mysql://")):
                raise ValueError(
                    f"Configuration validation failed: Production database URL must use MySQL scheme (got {self.DATABASE_URL.split('://')[0]}://)"
                )

            # D. CORS Wildcard with Credentials Rejection
            cors_list = self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, (list, tuple)) else [self.CORS_ORIGINS]
            if "*" in cors_list or self.CORS_ORIGINS == "*":
                raise ValueError("Configuration validation failed: Wildcard '*' CORS origin forbidden in production")

            # E. Rate Limiting cannot be disabled in production
            if not self.RATE_LIMIT_ENABLED:
                raise ValueError("Configuration validation failed: RATE_LIMIT_ENABLED cannot be False in production")

        return self

    # -------------------------------------------------------------------------
    # Path Anchoring & Resolved Absolute Paths
    # -------------------------------------------------------------------------
    def _resolve_backend_path(self, raw_path: Union[str, Path]) -> Path:
        """Resolves relative paths deterministically against BACKEND_ROOT."""
        p = Path(raw_path)
        if p.is_absolute():
            return p.resolve()
        return (BACKEND_ROOT / p).resolve()

    @property
    def resolved_storage_root(self) -> Path:
        return self._resolve_backend_path(self.MEDIA_ROOT)

    @property
    def resolved_upload_root(self) -> Path:
        return self.resolved_storage_root / "uploads"

    @property
    def resolved_result_root(self) -> Path:
        return self.resolved_storage_root / "results"

    @property
    def resolved_temp_root(self) -> Path:
        return self.resolved_storage_root / "tmp"

    @property
    def resolved_catvton_root(self) -> Path:
        return self._resolve_backend_path(self.CATVTON_ROOT)

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024

    @property
    def safe_database_url(self) -> str:
        """Returns DATABASE_URL with redacted credentials for logging and diagnostics."""
        try:
            return make_url(self.DATABASE_URL).render_as_string(hide_password=True)
        except Exception:
            return "mysql+pymysql://***:***@redacted/redacted"

    @property
    def safe_redis_url(self) -> str:
        """Returns REDIS_URL with redacted credentials for logging and diagnostics."""
        from app.utils.network import redact_url_credentials
        return redact_url_credentials(self.REDIS_URL)

    # -------------------------------------------------------------------------
    # Typed Sub-Settings Views
    # -------------------------------------------------------------------------
    @property
    def app(self) -> AppSettings:
        return AppSettings(
            name=self.APP_NAME,
            environment=self.APP_ENV,
            debug=bool(self.DEBUG),
            api_v1_prefix=self.API_V1_PREFIX,
            cors_origins=tuple(self.CORS_ORIGINS) if isinstance(self.CORS_ORIGINS, (list, tuple)) else (),
        )

    @property
    def database(self) -> DatabaseSettings:
        return DatabaseSettings(
            url=self.DATABASE_URL or "",
            pool_size=self.DB_POOL_SIZE,
            max_overflow=self.DB_MAX_OVERFLOW,
            pool_timeout=self.DB_POOL_TIMEOUT,
            pool_recycle=self.DB_POOL_RECYCLE,
            echo=self.DB_ECHO,
        )

    @property
    def redis(self) -> RedisSettings:
        return RedisSettings(url=self.REDIS_URL)

    @property
    def celery(self) -> CelerySettings:
        return CelerySettings(
            broker_url=self.CELERY_BROKER_URL,
            result_backend=self.CELERY_RESULT_BACKEND,
            default_queue=self.CELERY_DEFAULT_QUEUE,
            gpu_queue=self.CELERY_GPU_QUEUE,
            soft_time_limit_seconds=self.CELERY_GPU_SOFT_TIME_LIMIT_SECONDS,
            time_limit_seconds=self.CELERY_GPU_TIME_LIMIT_SECONDS,
            visibility_timeout_seconds=self.CELERY_VISIBILITY_TIMEOUT_SECONDS,
            max_retries=self.CELERY_GPU_MAX_RETRIES,
            retry_base_seconds=self.CELERY_GPU_RETRY_BASE_SECONDS,
        )

    @property
    def jwt(self) -> JWTSettings:
        return JWTSettings(
            secret=self.JWT_SECRET or SecretStr(""),
            algorithm=self.JWT_ALGORITHM,
            access_token_minutes=self.ACCESS_TOKEN_MINUTES,
            refresh_token_days=self.REFRESH_TOKEN_DAYS,
        )

    @property
    def media(self) -> MediaSettings:
        return MediaSettings(
            root=self.resolved_storage_root,
            base_url=self.MEDIA_BASE_URL,
            max_upload_mb=self.MAX_UPLOAD_MB,
            allowed_image_types=tuple(self.ALLOWED_IMAGE_TYPES)
            if isinstance(self.ALLOWED_IMAGE_TYPES, (tuple, list))
            else (),
            min_image_width=self.MIN_IMAGE_WIDTH,
            min_image_height=self.MIN_IMAGE_HEIGHT,
            max_image_width=self.MAX_IMAGE_WIDTH,
            max_image_height=self.MAX_IMAGE_HEIGHT,
            max_image_pixels=self.MAX_IMAGE_PIXELS,
        )

    @property
    def catvton(self) -> CatVTONSettings:
        return CatVTONSettings(
            root=self.resolved_catvton_root,
            device=self.CATVTON_DEVICE,
            dtype=self.CATVTON_DTYPE,
            width=self.CATVTON_WIDTH,
            height=self.CATVTON_HEIGHT,
            max_concurrency=self.CATVTON_MAX_CONCURRENCY,
            checkpoint_dir=self.CATVTON_CHECKPOINT_DIR,
            base_model_path=self.CATVTON_BASE_MODEL,
            inference_steps=self.CATVTON_INFERENCE_STEPS,
            guidance_scale=self.CATVTON_GUIDANCE_SCALE,
            allow_tf32=self.CATVTON_ALLOW_TF32,
            repaint=self.CATVTON_REPAINT,
        )

    # -------------------------------------------------------------------------
    # Secret Safety & Observability
    # -------------------------------------------------------------------------
    def safe_summary(self) -> Dict[str, Any]:
        """Provides non-sensitive operational configuration for startup logs and diagnostics."""
        return {
            "app_name": self.APP_NAME,
            "environment": self.APP_ENV.value,
            "debug": self.DEBUG,
            "api_v1_prefix": self.API_V1_PREFIX,
            "database_safe_url": self.safe_database_url,
            "redis_url": self.REDIS_URL,
            "celery_broker_url": self.CELERY_BROKER_URL,
            "media_root": str(self.resolved_storage_root),
            "media_base_url": self.MEDIA_BASE_URL,
            "max_upload_mb": self.MAX_UPLOAD_MB,
            "tryon_provider": self.TRYON_PRIMARY_PROVIDER,
            "catvton_preset": self.CATVTON_PRESET,
            "catvton_dtype": self.CATVTON_DTYPE,
            "catvton_device": self.CATVTON_DEVICE,
            "catvton_enabled": self.CATVTON_ENABLED,
        }

    def __repr__(self) -> str:
        return f"<Settings env={self.APP_ENV.value} debug={self.DEBUG} db={self.safe_database_url}>"

    def __str__(self) -> str:
        return self.__repr__()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Returns singleton cached instance of application settings."""
    return Settings()


settings = get_settings()
