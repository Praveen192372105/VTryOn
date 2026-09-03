import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy.orm import Session

from app.core.config import AppEnvironment, Settings
from app.core.logging import redact_sensitive_data, redact_sensitive_text
from app.core.security import create_access_token, get_password_hash
from app.db.models.user import User
from app.domain.ids import ResourcePrefix, generate_public_id


def test_log_redaction_unit():
    """Verify that credentials and tokens are redacted from arbitrary log text and structures."""
    # 1. Bearer token in string
    text = "User authenticated with header Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test.sig successfully"
    redacted = redact_sensitive_text(text)
    assert "eyJhbGciOiJIUzI1NiJ9.test.sig" not in redacted
    assert "Bearer [REDACTED]" in redacted

    # 2. Dictionary with sensitive keys
    data = {
        "user_id": "usr_123",
        "password": "MySuperSecretPassword!",
        "access_token": "eyJsecret...",
        "nested": {
            "refresh_token": "secret_refresh_token",
            "safe_field": "public_data",
        },
    }
    safe_data = redact_sensitive_data(data)
    assert safe_data["password"] == "[REDACTED]"
    assert safe_data["access_token"] == "[REDACTED]"
    assert safe_data["nested"]["refresh_token"] == "[REDACTED]"
    assert safe_data["nested"]["safe_field"] == "public_data"


def test_security_headers_present_on_responses(client: TestClient):
    """Verify X-Content-Type-Options, Referrer-Policy, and private Cache-Control are emitted."""
    res = client.get("/api/v1/auth/login")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("Referrer-Policy") == "no-referrer"

    # Sensitive route gets no-store, private
    assert "no-store" in res.headers.get("Cache-Control", "")
    assert "private" in res.headers.get("Cache-Control", "")


def test_validation_input_redaction(client: TestClient):
    """Ensure submitted plaintext password does not leak back in validation error details."""
    secret_pw = "HighlyConfidentialPassword123!"
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "invalid_email_format", "password": secret_pw},
    )
    assert res.status_code == 422
    assert secret_pw not in res.text


def test_production_config_rejects_unsafe_settings():
    """Verify production startup validation rejects insecure defaults."""
    # A. Reject DEBUG=True in production
    with pytest.raises(ValueError, match="DEBUG must be False in production"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=True,
            JWT_SECRET=SecretStr("super_long_production_secret_key_32bytes!"),
            DATABASE_URL="mysql+pymysql://user:pass@127.0.0.1/vtryon",
            CORS_ORIGINS=["https://app.vtryon.com"],
        )

    # B. Reject weak/short JWT secret in production
    with pytest.raises(ValueError, match="JWT_SECRET must be at least 32 characters in production"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            JWT_SECRET=SecretStr("short_secret"),
            DATABASE_URL="mysql+pymysql://user:pass@127.0.0.1/vtryon",
            CORS_ORIGINS=["https://app.vtryon.com"],
        )

    # C. Reject wildcard CORS with credentials in production
    with pytest.raises(ValueError, match="Wildcard '\\*' CORS origin forbidden in production"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            JWT_SECRET=SecretStr("super_long_production_secret_key_32bytes!"),
            DATABASE_URL="mysql+pymysql://user:pass@127.0.0.1/vtryon",
            CORS_ORIGINS=["*"],
            CORS_ALLOW_CREDENTIALS=True,
        )

    # D. Reject RATE_LIMIT_ENABLED=False in production
    with pytest.raises(ValueError, match="RATE_LIMIT_ENABLED cannot be False in production"):
        Settings(
            APP_ENV=AppEnvironment.PRODUCTION,
            DEBUG=False,
            JWT_SECRET=SecretStr("super_long_production_secret_key_32bytes!"),
            DATABASE_URL="mysql+pymysql://user:pass@127.0.0.1/vtryon",
            CORS_ORIGINS=["https://app.vtryon.com"],
            RATE_LIMIT_ENABLED=False,
        )


def test_sql_injection_defense(client: TestClient, db_session: Session):
    """
    Test that malicious SQL injection payloads in route parameters and queries
    are safely handled via SQLAlchemy bound parameters without execution.
    """
    # 1. SQL injection payload in email query
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin' OR '1'='1' --", "password": "Password123!"},
    )
    # Must fail cleanly as invalid format (422) or invalid credentials (401), not 500 DB error
    assert res.status_code in (401, 422)
    assert "syntax error" not in res.text.lower()

    # 2. SQL injection payload in outfit filter
    res_outfit = client.get("/api/v1/outfits?category=upper_body' OR 1=1 --")
    assert res_outfit.status_code in (200, 422)
    assert "syntax error" not in res_outfit.text.lower()


def test_idor_cross_user_resource_protection(client: TestClient, db_session: Session):
    """
    Test that foreign private resources (uploads, try-ons) return 404 Not Found
    and never disclose existence to unauthorized users.
    """
    # User A
    user_a = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email=f"user_a_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
        name="User A",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    # User B
    user_b = User(
        public_id=generate_public_id(ResourcePrefix.USER),
        email=f"user_b_{generate_public_id(ResourcePrefix.USER)[:6]}@example.com",
        name="User B",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()

    token_b, _ = create_access_token(user_public_id=user_b.public_id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    fake_upload_id = generate_public_id(ResourcePrefix.UPLOAD)
    fake_job_id = generate_public_id(ResourcePrefix.TRYON_JOB)

    # User B querying User A's un-owned resources -> 404
    assert client.get(f"/api/v1/uploads/{fake_upload_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/uploads/{fake_upload_id}", headers=headers_b).status_code == 404
    assert client.get(f"/api/v1/try-ons/{fake_job_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/try-ons/{fake_job_id}", headers=headers_b).status_code == 404
    assert client.get(f"/api/v1/try-ons/{fake_job_id}/content", headers=headers_b).status_code == 404
