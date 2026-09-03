from datetime import datetime, timedelta, timezone
import pytest
from jose import jwt

from app.core.config import settings
from app.core.constants import TokenType
from app.core.exceptions import (
    AccessTokenExpiredError,
    InvalidAccessTokenError,
    ValidationError,
)
from app.core.security import (
    create_access_token,
    decode_access_token,
    dummy_verify_password,
    generate_refresh_token,
    hash_password,
    hash_token,
    normalize_email,
    verify_password,
)
from app.utils.time import utc_now


def test_password_hashing_and_verification():
    """Verify password hashing creates non-reversible bcrypt hashes with proper verification."""
    password = "SuperSecretPassword123!"
    pwd_hash = hash_password(password)

    # Hash must not match plaintext
    assert pwd_hash != password
    assert pwd_hash.startswith("$2b$")

    # Verification must succeed for correct password and fail for wrong password
    assert verify_password(password, pwd_hash) is True
    assert verify_password("WrongPassword123!", pwd_hash) is False
    assert verify_password("", pwd_hash) is False


def test_password_length_boundaries():
    """Verify password length boundaries (8 to 128 chars)."""
    with pytest.raises(ValidationError, match="at least 8 characters"):
        hash_password("short")

    with pytest.raises(ValidationError, match="exceeds maximum allowed length"):
        hash_password("a" * 129)

    # Boundary valid lengths
    assert verify_password("12345678", hash_password("12345678")) is True
    assert verify_password("a" * 128, hash_password("a" * 128)) is True


def test_dummy_verify_password():
    """Verify dummy verification runs without error for timing attack mitigation."""
    dummy_verify_password("arbitrary_password")


def test_email_normalization():
    """Verify canonical email normalization with casefolding and whitespace stripping."""
    assert normalize_email("  User.Test@Example.COM  ") == "user.test@example.com"
    assert normalize_email("ESWAR@vtryon.io") == "eswar@vtryon.io"
    assert normalize_email("Straße@Example.com") == "strasse@example.com"


def test_refresh_token_generation_and_hashing():
    """Verify opaque refresh token generation and deterministic SHA-256 fingerprinting."""
    raw_token, token_hash, expires_at = generate_refresh_token()

    # Raw token starts with prefix and has high entropy
    assert raw_token.startswith("rt_")
    assert len(raw_token) > 40

    # Hash must be 64-char hex string
    assert len(token_hash) == 64
    assert hash_token(raw_token) == token_hash

    # Expiry must be in the future (around configured days)
    now = utc_now()
    assert expires_at > now
    assert expires_at <= now + timedelta(days=settings.REFRESH_TOKEN_DAYS + 1)


def test_jwt_access_token_creation_and_claims():
    """Verify access token creation contains required claims."""
    user_public_id = "usr_01m1h000000000000000000001"
    token, expires_in = create_access_token(user_public_id=user_public_id)

    assert isinstance(token, str)
    assert expires_in == settings.ACCESS_TOKEN_MINUTES * 60

    payload = decode_access_token(token)
    assert payload["sub"] == user_public_id
    assert payload["type"] == TokenType.ACCESS.value
    assert "jti" in payload
    assert payload["exp"] > payload["iat"]


def test_jwt_access_token_expired():
    """Verify expired token raises AccessTokenExpiredError."""
    user_public_id = "usr_01m1h000000000000000000001"
    past_time = utc_now() - timedelta(hours=2)
    token, _ = create_access_token(user_public_id=user_public_id, now=past_time)

    with pytest.raises(AccessTokenExpiredError):
        decode_access_token(token)


def test_jwt_invalid_signature():
    """Verify token signed with wrong secret is rejected."""
    payload = {
        "sub": "usr_01m1h000000000000000000001",
        "type": TokenType.ACCESS.value,
        "exp": int((utc_now() + timedelta(minutes=15)).timestamp()),
        "iat": int(utc_now().timestamp()),
    }
    tampered_token = jwt.encode(payload, "wrong_secret_key_that_does_not_match", algorithm="HS256")

    with pytest.raises(InvalidAccessTokenError):
        decode_access_token(tampered_token)


def test_jwt_invalid_type_claim():
    """Verify token with non-access type is rejected."""
    payload = {
        "sub": "usr_01m1h000000000000000000001",
        "type": "refresh",  # Deliberate token type confusion attempt
        "exp": int((utc_now() + timedelta(minutes=15)).timestamp()),
        "iat": int(utc_now().timestamp()),
    }
    secret = settings.JWT_SECRET.get_secret_value() if settings.JWT_SECRET else settings.SECRET_KEY
    token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(InvalidAccessTokenError, match="Invalid token type"):
        decode_access_token(token)


def test_jwt_invalid_subject_format():
    """Verify token missing usr_ prefix in subject is rejected."""
    payload = {
        "sub": "plain_sequential_id_1234",
        "type": TokenType.ACCESS.value,
        "exp": int((utc_now() + timedelta(minutes=15)).timestamp()),
        "iat": int(utc_now().timestamp()),
    }
    secret = settings.JWT_SECRET.get_secret_value() if settings.JWT_SECRET else settings.SECRET_KEY
    token = jwt.encode(payload, secret, algorithm="HS256")

    with pytest.raises(InvalidAccessTokenError, match="Invalid token subject"):
        decode_access_token(token)
