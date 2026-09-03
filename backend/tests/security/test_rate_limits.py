import time
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import (
    InMemoryRateLimiter,
    RateLimitDecision,
    RedisRateLimiter,
    fingerprint_credential,
    get_rate_limiter,
)
from app.core.security import create_access_token, get_password_hash
from app.db.models.user import User
from app.domain.ids import ResourcePrefix, generate_public_id


def test_in_memory_rate_limiter_unit():
    """Unit test for InMemoryRateLimiter sliding window semantics."""
    limiter = InMemoryRateLimiter()
    key = "test:user:1"

    # Limit = 2 per 5 seconds
    d1 = limiter.check(key=key, limit=2, window_seconds=5)
    assert d1.allowed is True
    assert d1.remaining == 1

    d2 = limiter.check(key=key, limit=2, window_seconds=5)
    assert d2.allowed is True
    assert d2.remaining == 0

    # 3rd request should be rejected
    d3 = limiter.check(key=key, limit=2, window_seconds=5)
    assert d3.allowed is False
    assert d3.remaining == 0
    assert d3.retry_after > 0

    # Separate key is not blocked (isolation)
    d_other = limiter.check(key="test:user:2", limit=2, window_seconds=5)
    assert d_other.allowed is True


def test_redis_rate_limiter_fail_open_on_outage():
    """Verify RedisRateLimiter safely fails open when Redis is unreachable."""
    broken_client = MagicMock()
    broken_client.register_script.side_effect = Exception("Connection refused to Redis")

    limiter = RedisRateLimiter(client=broken_client)
    decision = limiter.check(key="login:acc:test", limit=5, window_seconds=60)

    # Must fail open per Phase 13 resilience policy
    assert decision.allowed is True
    assert decision.remaining == 5


def test_fingerprint_credential():
    """Verify credential fingerprinting hashes inputs and does not store raw plaintext."""
    email = "SensitiveUser@Example.COM"
    fp = fingerprint_credential(email)
    assert fp != email
    assert len(fp) == 32
    # Case insensitivity & trimming
    assert fp == fingerprint_credential(" sensitiveuser@example.com ")


def test_route_login_rate_limiting(client: TestClient, db_session: Session):
    """Test POST /auth/login rate limiting per account and per IP."""
    limiter = InMemoryRateLimiter()
    from app.main import app

    app.dependency_overrides[get_rate_limiter] = lambda: limiter

    try:
        # Create user
        email = f"rl_login_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com"
        user = User(
            public_id=generate_public_id(ResourcePrefix.USER),
            email=email,
            name="RL User",
            hashed_password=get_password_hash("CorrectPass123!"),
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        # Exhaust login limit (e.g. settings.RATE_LIMIT_LOGIN_PER_MINUTE)
        limit = settings.RATE_LIMIT_LOGIN_PER_MINUTE
        for _ in range(limit):
            res = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword!"})
            assert res.status_code == 401

        # The limit+1 request must be rejected with 429
        blocked = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword!"})
        assert blocked.status_code == 429
        body = blocked.json()
        assert body["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Retry-After" in blocked.headers
    finally:
        app.dependency_overrides.pop(get_rate_limiter, None)


def test_route_register_rate_limiting(client: TestClient):
    """Test POST /auth/register rate limiting per IP."""
    limiter = InMemoryRateLimiter()
    from app.main import app

    app.dependency_overrides[get_rate_limiter] = lambda: limiter

    try:
        limit = settings.RATE_LIMIT_REGISTER_PER_HOUR
        for i in range(limit):
            res = client.post(
                "/api/v1/auth/register",
                json={
                    "name": f"Reg User {i}",
                    "email": f"reg_user_{i}_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
                    "password": "Password123!",
                },
            )
            assert res.status_code == 201

        # Exceed limit
        blocked = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Excess User",
                "email": f"excess_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
                "password": "Password123!",
            },
        )
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Retry-After" in blocked.headers
    finally:
        app.dependency_overrides.pop(get_rate_limiter, None)


def test_route_upload_rate_limiting(client: TestClient, db_session: Session):
    """Test POST /uploads/person rate limiting per user."""
    limiter = InMemoryRateLimiter()
    from app.main import app

    app.dependency_overrides[get_rate_limiter] = lambda: limiter

    try:
        user = User(
            public_id=generate_public_id(ResourcePrefix.USER),
            email=f"upload_rl_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
            name="Upload RL User",
            hashed_password=get_password_hash("Password123!"),
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        token, _ = create_access_token(user_public_id=user.public_id)
        headers = {"Authorization": f"Bearer {token}"}

        limit = settings.RATE_LIMIT_UPLOAD_PER_MINUTE
        # Exhaust user upload counter directly or via mock
        for _ in range(limit):
            decision = limiter.check(
                key=f"upload:user:{user.public_id}",
                limit=limit,
                window_seconds=60,
            )
            assert decision.allowed is True

        # Now calling upload route exceeds limit
        from io import BytesIO
        from PIL import Image

        img = Image.new("RGB", (768, 1024), color=(255, 255, 255))
        buf = BytesIO()
        img.save(buf, format="JPEG")
        files = {"file": ("test.jpg", buf.getvalue(), "image/jpeg")}

        blocked = client.post("/api/v1/uploads/person", headers=headers, files=files)
        assert blocked.status_code == 429
        assert blocked.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    finally:
        app.dependency_overrides.pop(get_rate_limiter, None)
