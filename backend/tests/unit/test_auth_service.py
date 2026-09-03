from datetime import timedelta
import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AccountInactiveError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    RefreshTokenExpiredError,
    SessionRevokedError,
)
from app.core.security import hash_token
from app.db.models.user import User
from app.domain.ownership import CurrentUser
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import AuthService
from app.utils.time import utc_now


def test_auth_service_register_success(db_session: Session):
    """Verify registration creates user, initial session, and returns token pair."""
    service = AuthService(db=db_session)
    req = RegisterRequest(
        name="  Eswar Test  ",
        email="Eswar.Test@example.com",
        password="ValidPassword123!",
    )
    res = service.register(req)

    assert res.access_token is not None
    assert res.refresh_token is not None
    assert res.token_type == "bearer"
    assert res.expires_in > 0
    assert res.user.name == "Eswar Test"
    assert res.user.email == "eswar.test@example.com"
    assert res.user.id.startswith("usr_")

    # Verify password hash was persisted in DB, not plaintext
    db_user = service.user_repo.get_by_email("eswar.test@example.com")
    assert db_user is not None
    assert db_user.password_hash != "ValidPassword123!"


def test_auth_service_register_duplicate_email(db_session: Session):
    """Verify duplicate email registration is rejected."""
    service = AuthService(db=db_session)
    req1 = RegisterRequest(
        name="User One",
        email="duplicate@example.com",
        password="ValidPassword123!",
    )
    service.register(req1)

    req2 = RegisterRequest(
        name="User Two",
        email="DUPLICATE@example.com",  # Case difference
        password="AnotherPassword123!",
    )
    with pytest.raises(EmailAlreadyRegisteredError):
        service.register(req2)


def test_auth_service_login_success(db_session: Session):
    """Verify login succeeds with valid credentials and normalizes email."""
    service = AuthService(db=db_session)
    service.register(
        RegisterRequest(
            name="Login User",
            email="login_user@example.com",
            password="SecurePassword123!",
        )
    )

    login_res = service.login(
        LoginRequest(
            email="LOGIN_USER@example.com",
            password="SecurePassword123!",
        )
    )
    assert login_res.access_token is not None
    assert login_res.refresh_token is not None
    assert login_res.user.email == "login_user@example.com"


def test_auth_service_login_invalid_password(db_session: Session):
    """Verify wrong password raises generic InvalidCredentialsError."""
    service = AuthService(db=db_session)
    service.register(
        RegisterRequest(
            name="Login User",
            email="login_user2@example.com",
            password="SecurePassword123!",
        )
    )

    with pytest.raises(InvalidCredentialsError, match="Invalid email or password"):
        service.login(
            LoginRequest(
                email="login_user2@example.com",
                password="WrongPassword123!",
            )
        )


def test_auth_service_login_unknown_email(db_session: Session):
    """Verify unknown email raises identical generic InvalidCredentialsError."""
    service = AuthService(db=db_session)

    with pytest.raises(InvalidCredentialsError, match="Invalid email or password"):
        service.login(
            LoginRequest(
                email="nonexistent@example.com",
                password="SomePassword123!",
            )
        )


def test_auth_service_login_inactive_user(db_session: Session):
    """Verify inactive user cannot log in."""
    service = AuthService(db=db_session)
    reg = service.register(
        RegisterRequest(
            name="Inactive User",
            email="inactive@example.com",
            password="SecurePassword123!",
        )
    )
    # Deactivate user
    db_user = service.user_repo.get_by_email("inactive@example.com")
    assert db_user is not None
    db_user.is_active = False
    db_session.commit()

    with pytest.raises(AccountInactiveError):
        service.login(
            LoginRequest(
                email="inactive@example.com",
                password="SecurePassword123!",
            )
        )


def test_auth_service_refresh_rotation_and_replay_detection(db_session: Session):
    """
    Verify refresh rotation:
    1. First refresh with token A succeeds, revokes token A, and returns token B.
    2. Second refresh attempt with token A fails immediately as revoked (replay detection).
    """
    service = AuthService(db=db_session)
    reg_res = service.register(
        RegisterRequest(
            name="Rotation User",
            email="rotation@example.com",
            password="SecurePassword123!",
        )
    )
    token_a = reg_res.refresh_token

    # 1. Rotate token A -> token B
    refresh_res = service.refresh(token_a)
    token_b = refresh_res.refresh_token
    assert token_b is not None
    assert token_b != token_a
    assert refresh_res.access_token is not None

    # Verify token A session is now revoked in database
    hash_a = hash_token(token_a)
    session_a = service.session_repo.get_by_token_hash(hash_a)
    assert session_a is not None
    assert session_a.revoked_at is not None

    # 2. Replay attempt using token A must fail
    with pytest.raises(SessionRevokedError):
        service.refresh(token_a)

    # 3. Valid use of token B must succeed
    refresh_res_2 = service.refresh(token_b)
    assert refresh_res_2.refresh_token != token_b


def test_auth_service_refresh_expired_token(db_session: Session):
    """Verify expired refresh token is rejected."""
    service = AuthService(db=db_session)
    reg_res = service.register(
        RegisterRequest(
            name="Expire User",
            email="expire@example.com",
            password="SecurePassword123!",
        )
    )
    token = reg_res.refresh_token
    token_hash = hash_token(token)

    # Artificially expire the session in the database
    session = service.session_repo.get_by_token_hash(token_hash)
    assert session is not None
    session.expires_at = utc_now() - timedelta(hours=1)
    db_session.commit()

    with pytest.raises(RefreshTokenExpiredError):
        service.refresh(token)


def test_auth_service_refresh_unknown_token(db_session: Session):
    """Verify unknown refresh token is rejected."""
    service = AuthService(db=db_session)
    with pytest.raises(InvalidRefreshTokenError):
        service.refresh("rt_completely_unknown_token_value_123456789")


def test_auth_service_logout(db_session: Session):
    """Verify logout revokes session so it can no longer be refreshed."""
    service = AuthService(db=db_session)
    reg_res = service.register(
        RegisterRequest(
            name="Logout User",
            email="logout@example.com",
            password="SecurePassword123!",
        )
    )
    token = reg_res.refresh_token

    # Logout
    assert service.logout(token) is True

    # Subsequent refresh attempt must fail
    with pytest.raises(SessionRevokedError):
        service.refresh(token)

    # Repeated logout is safe and idempotent
    assert service.logout(token) is True


def test_auth_service_get_current_profile(db_session: Session):
    """Verify get_current_profile returns safe user profile."""
    service = AuthService(db=db_session)
    reg_res = service.register(
        RegisterRequest(
            name="Profile User",
            email="profile@example.com",
            password="SecurePassword123!",
        )
    )
    db_user = service.user_repo.get_by_email("profile@example.com")
    assert db_user is not None

    current_user = CurrentUser(
        id=db_user.id,
        public_id=db_user.public_id,
        email=db_user.email,
        name=db_user.name,
    )
    profile = service.get_current_profile(current_user)
    assert profile.id == db_user.public_id
    assert profile.name == "Profile User"
    assert profile.email == "profile@example.com"
