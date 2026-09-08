import os
import shutil
import tempfile
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Force testing environment configuration
os.environ["APP_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test_super_secret_key_for_testing_purposes_only_32b"

# In-memory SQLite for test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# Database Safety Guard: Prevent running destructive tests against production databases
target_db = os.environ.get("DATABASE_URL", SQLALCHEMY_DATABASE_URL).lower()
if not ("sqlite" in target_db or "test" in target_db or "memory" in target_db):
    raise RuntimeError(
        f"SAFETY VIOLATION: Refusing to run tests against non-test database: {target_db}. "
        "Test database URL must contain 'test' or use SQLite/in-memory."
    )

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.metrics import metrics_registry

from sqlalchemy import event

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_storage():
    """Create a temporary storage directory for tests."""
    temp_dir = tempfile.mkdtemp()
    settings.STORAGE_ROOT = temp_dir
    settings.UPLOAD_ROOT = os.path.join(temp_dir, "uploads")
    settings.RESULT_ROOT = os.path.join(temp_dir, "results")
    settings.TEMP_ROOT = os.path.join(temp_dir, "tmp")
    settings.TRYON_PRIMARY_PROVIDER = "catvton"
    yield
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Provide a clean isolated database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


from app.core.rate_limit import InMemoryRateLimiter, get_rate_limiter

test_rate_limiter = InMemoryRateLimiter()


@pytest.fixture(scope="function", autouse=True)
def reset_test_rate_limiter():
    test_rate_limiter.reset()
    yield
    test_rate_limiter.reset()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with overridden database and rate-limiter dependencies."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_rate_limiter] = lambda: test_rate_limiter
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


from PIL import Image
from app.storage.local import LocalMediaStorage
from app.domain.enums import FailureCode, OutfitCategory, TryOnJobStatus, UploadStatus
from app.models.outfit import Outfit
from app.models.tryon_job import TryOnJob
from app.models.upload import Upload
from app.models.user import User


@pytest.fixture
def worker_setup(db_session: Session, tmp_path):
    storage = LocalMediaStorage(root_dir=str(tmp_path))

    # Create test person image on storage
    person_img = Image.new("RGB", (768, 1024), color=(200, 200, 200))
    person_key = "uploads/usr_01/person.jpg"
    storage.save(person_key, person_img.tobytes(), content_type="image/jpeg")
    person_path = tmp_path / person_key
    person_path.parent.mkdir(parents=True, exist_ok=True)
    person_img.save(str(person_path), format="JPEG")

    # Create test garment image on storage
    garment_img = Image.new("RGB", (768, 1024), color=(50, 100, 150))
    garment_key = "outfits/shirt.jpg"
    garment_path = tmp_path / garment_key
    garment_path.parent.mkdir(parents=True, exist_ok=True)
    garment_img.save(str(garment_path), format="JPEG")

    user = User(
        public_id="usr_01j7q9abcde123456789012345",
        email="workeruser@example.com",
        name="Worker User",
        hashed_password="hashed_pwd",
    )
    db_session.add(user)
    db_session.flush()

    upload = Upload(
        public_id="upl_01j7q9abcde123456789012345",
        user_id=user.id,
        storage_key=person_key,
        original_filename="person.jpg",
        mime_type="image/jpeg",
        size_bytes=5000,
        status=UploadStatus.ACTIVE.value,
    )
    db_session.add(upload)

    outfit = Outfit(
        public_id="out_01j7q9abcde123456789012345",
        name="Casual Linen Shirt",
        slug="casual-linen-shirt-worker",
        category=OutfitCategory.UPPER_BODY.value,
        storage_key=garment_key,
        is_active=True,
    )
    db_session.add(outfit)
    db_session.flush()

    job = TryOnJob(
        public_id="job_01j7q9abcde123456789012345",
        user_id=user.id,
        person_upload_id=upload.id,
        outfit_id=outfit.id,
        status=TryOnJobStatus.QUEUED.value,
    )
    db_session.add(job)
    db_session.commit()

    return {
        "user": user,
        "upload": upload,
        "outfit": outfit,
        "job": job,
        "storage": storage,
        "tmp_path": tmp_path,
    }


