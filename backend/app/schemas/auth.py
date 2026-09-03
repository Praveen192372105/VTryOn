from typing import Optional
from pydantic import EmailStr, Field, field_validator

from app.schemas.common import BaseSchema
from app.schemas.user import UserProfileResponse


class RegisterRequest(BaseSchema):
    """
    User registration payload contract.
    Enforces string trimming, valid email syntax, and password bounds.
    """
    name: str = Field(..., min_length=1, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password")

    @field_validator("name")
    @classmethod
    def trim_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Name cannot be empty or only whitespace")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class LoginRequest(BaseSchema):
    """
    User login credential payload contract.
    """
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, max_length=128, description="User password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class RefreshTokenRequest(BaseSchema):
    """
    Session refresh token request payload contract.
    """
    refresh_token: str = Field(..., min_length=10, description="Valid refresh token string")


class LogoutRequest(BaseSchema):
    """
    Session logout request payload contract.
    """
    refresh_token: str = Field(..., min_length=10, description="Active refresh token to revoke")


class LogoutResponse(BaseSchema):
    """
    Session logout acknowledgment payload contract.
    """
    message: str = Field(default="Session successfully terminated.", description="Logout status message")


class TokenResponse(BaseSchema):
    """
    Authentication token envelope returned on successful login or session refresh.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type (bearer)")
    expires_in: int = Field(..., description="Access token expiration duration in seconds")
    refresh_token: Optional[str] = Field(default=None, description="Optional rotated refresh token")
    user: UserProfileResponse = Field(..., description="Authenticated user profile")


class AuthSessionData(BaseSchema):
    """Internal session representation for token generation."""
    session_id: str
    user_id: int
    public_id: str
    email: str
