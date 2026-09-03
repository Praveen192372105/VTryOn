import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.constants import TokenType
from app.core.exceptions import (
    AccessTokenExpiredError,
    InvalidAccessTokenError,
    ValidationError,
)
from app.utils.time import utc_now

# Precomputed dummy bcrypt hash for constant-time dummy verification on unknown emails
_DUMMY_BCRYPT_HASH = "$2b$12$KIXeFzQ.uIqZ4bE9U.n95.Q0QW9P5Rz5kZ5Q5P3p5kQ5P3p5kQ5P3"


def normalize_email(email: str) -> str:
    """Canonical email normalization using casefolding and whitespace stripping."""
    return email.strip().casefold()


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using bcrypt.
    Enforces minimum length of 8 and maximum length of 128 characters.
    """
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long.")
    if len(password) > 128:
        raise ValidationError("Password exceeds maximum allowed length of 128 characters.")

    # Bcrypt maximum effective password length is 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def dummy_verify_password(plain_password: str) -> None:
    """Simulate password verification when an email is not found to mitigate timing attacks."""
    verify_password(plain_password, _DUMMY_BCRYPT_HASH)


def hash_token(token: str) -> str:
    """
    Deterministic SHA-256 hash for lookup and verification of opaque refresh tokens.
    Never persists raw refresh tokens in the database.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> Tuple[str, str, datetime]:
    """
    Generate an opaque, high-entropy refresh token string,
    its SHA-256 hexadecimal hash for database persistence, and its expiration datetime in UTC.
    """
    raw_token = f"rt_{secrets.token_urlsafe(48)}"
    token_hash = hash_token(raw_token)
    expires_at = utc_now() + timedelta(days=settings.REFRESH_TOKEN_DAYS)
    return raw_token, token_hash, expires_at


def create_access_token(
    user_public_id: str,
    now: Optional[datetime] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> Tuple[str, int]:
    """
    Create a signed JWT access token.
    Returns (jwt_string, expires_in_seconds).
    `sub` claim is strictly the external user public ID (usr_...).
    """
    current_time = now or utc_now()
    expires_in_seconds = settings.ACCESS_TOKEN_MINUTES * 60
    expire = current_time + timedelta(seconds=expires_in_seconds)

    to_encode: Dict[str, Any] = {
        "sub": user_public_id,
        "jti": secrets.token_hex(16),
        "iat": int(current_time.timestamp()),
        "exp": int(expire.timestamp()),
        "type": TokenType.ACCESS.value if hasattr(TokenType.ACCESS, "value") else str(TokenType.ACCESS),
    }

    if additional_claims:
        to_encode.update(additional_claims)

    jwt_secret = settings.JWT_SECRET.get_secret_value() if settings.JWT_SECRET else settings.SECRET_KEY
    encoded_jwt = jwt.encode(
        to_encode,
        jwt_secret,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt, expires_in_seconds


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.
    Enforces algorithm, signature, expiration, type claim, and subject format.
    Raises AccessTokenExpiredError or InvalidAccessTokenError.
    """
    try:
        jwt_secret = settings.JWT_SECRET.get_secret_value() if settings.JWT_SECRET else settings.SECRET_KEY
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise AccessTokenExpiredError()
    except (JWTError, Exception):
        raise InvalidAccessTokenError()

    token_type = payload.get("type")
    if token_type != TokenType.ACCESS.value and token_type != str(TokenType.ACCESS):
        raise InvalidAccessTokenError("Invalid token type. Expected access token.")

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str) or not sub.startswith("usr_"):
        raise InvalidAccessTokenError("Invalid token subject. Expected valid user public ID.")

    return payload
