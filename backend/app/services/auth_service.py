import logging
from typing import Optional
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AccountInactiveError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    RefreshTokenExpiredError,
    SessionRevokedError,
)
from app.core.security import (
    create_access_token,
    dummy_verify_password,
    generate_refresh_token,
    hash_password,
    hash_token,
    normalize_email,
    verify_password,
)
from app.domain.ownership import CurrentUser
from app.repositories.sessions import SessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserProfileResponse
from app.utils.time import utc_now

logger = logging.getLogger("vtryon.services.auth")


class AuthService:
    """
    Application service managing user registration, authentication,
    atomic refresh session rotation, logout revocation, and profile retrieval.
    """

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)

    def register(self, payload: RegisterRequest) -> TokenResponse:
        """
        Register a new user account, persist credentials, and issue initial token pair.
        Guarded against concurrent duplicate registrations via transactional integrity.
        """
        clean_email = normalize_email(payload.email)
        clean_name = payload.name.strip()

        # Check existing email pre-condition
        existing = self.user_repo.get_by_email(clean_email)
        if existing:
            raise EmailAlreadyRegisteredError(f"A user with email '{clean_email}' is already registered.")

        pwd_hash = hash_password(payload.password)

        try:
            user = self.user_repo.create(
                email=clean_email,
                name=clean_name,
                password_hash=pwd_hash,
            )
            # Flush user so user.id is generated
            self.db.flush()

            # Create initial refresh session
            raw_refresh, refresh_hash, refresh_expires = generate_refresh_token()
            self.session_repo.create(
                user_id=user.id,
                refresh_token_hash=refresh_hash,
                expires_at=refresh_expires,
            )

            # Issue JWT access token
            access_token, expires_in = create_access_token(user_public_id=user.public_id)

            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise EmailAlreadyRegisteredError(f"A user with email '{clean_email}' is already registered.")
        except Exception:
            self.db.rollback()
            raise

        logger.info(
            f"User account registered successfully: '{user.public_id}'",
            extra={"event": "auth.register.succeeded", "user_public_id": user.public_id},
        )

        user_profile = UserProfileResponse(
            id=user.public_id,
            name=user.name,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            refresh_token=raw_refresh,
            user=user_profile,
        )

    def login(self, payload: LoginRequest) -> TokenResponse:
        """
        Verify credentials, create active session record, and issue token pair.
        Protects against timing attacks on nonexistent accounts.
        """
        clean_email = normalize_email(payload.email)
        user = self.user_repo.get_by_email(clean_email)

        if not user:
            # Timing attack mitigation: simulate bcrypt verification workload
            dummy_verify_password(payload.password)
            logger.warning("auth.login.failed: unknown email", extra={"event": "auth.login.failed"})
            raise InvalidCredentialsError("Invalid email or password.")

        if not verify_password(payload.password, user.password_hash):
            logger.warning(
                f"auth.login.failed: invalid password for user '{user.public_id}'",
                extra={"event": "auth.login.failed", "user_public_id": user.public_id},
            )
            raise InvalidCredentialsError("Invalid email or password.")

        if not user.is_active:
            logger.warning(
                f"auth.login.rejected: inactive user '{user.public_id}'",
                extra={"event": "auth.login.rejected", "user_public_id": user.public_id},
            )
            raise AccountInactiveError("This user account is inactive or disabled.")

        try:
            # Create session record with SHA-256 hash
            raw_refresh, refresh_hash, refresh_expires = generate_refresh_token()
            self.session_repo.create(
                user_id=user.id,
                refresh_token_hash=refresh_hash,
                expires_at=refresh_expires,
            )

            # Issue JWT access token
            access_token, expires_in = create_access_token(user_public_id=user.public_id)

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        logger.info(
            f"User '{user.public_id}' logged in successfully",
            extra={"event": "auth.login.succeeded", "user_public_id": user.public_id},
        )

        user_profile = UserProfileResponse(
            id=user.public_id,
            name=user.name,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            refresh_token=raw_refresh,
            user=user_profile,
        )

    def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Atomic refresh session rotation:
        1. Validate token format and compute SHA-256 hash.
        2. Verify session exists, is unrevoked, and unexpired.
        3. Concurrency-safely revoke old session.
        4. Issue and persist new replacement session and access token in one transaction.
        5. Return new access token and rotated raw refresh token.
        """
        clean_token = refresh_token.strip()
        if not clean_token:
            raise InvalidRefreshTokenError("Refresh token must not be empty.")

        token_hash = hash_token(clean_token)
        session = self.session_repo.get_by_token_hash(token_hash)

        if not session:
            raise InvalidRefreshTokenError("Invalid or unknown refresh token.")

        if session.is_revoked:
            logger.warning(
                f"Replay detected for revoked session: '{session.public_id}'",
                extra={"event": "auth.refresh.replay_detected", "session_public_id": session.public_id},
            )
            raise SessionRevokedError("This authentication session has been revoked.")

        now = utc_now()
        # Normalizing timezone for comparison
        expires_at = session.expires_at if session.expires_at.tzinfo else session.expires_at.replace(tzinfo=now.tzinfo)
        if expires_at <= now:
            raise RefreshTokenExpiredError("The refresh token has expired. Please log in again.")

        try:
            # Atomic conditional revocation: ensures only one concurrent request can rotate this session
            revoked_successfully = self.session_repo.atomic_revoke_active(token_hash, revoked_time=now)
            if not revoked_successfully:
                logger.warning(
                    f"Concurrent rotation conflict for session '{session.public_id}'",
                    extra={"event": "auth.refresh.replay_detected", "session_public_id": session.public_id},
                )
                raise SessionRevokedError("This authentication session has been revoked.")

            user = self.user_repo.get_by_id(session.user_id)
            if not user or not user.is_active:
                raise AccountInactiveError("User account associated with this session is inactive.")

            # Create replacement session (rotation)
            new_raw_rt, new_rt_hash, new_rt_expires = generate_refresh_token()
            self.session_repo.create(
                user_id=user.id,
                refresh_token_hash=new_rt_hash,
                expires_at=new_rt_expires,
            )

            new_access_token, expires_in = create_access_token(user_public_id=user.public_id)

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        logger.info(
            f"Session rotated successfully for user '{user.public_id}'",
            extra={
                "event": "auth.session.rotated",
                "old_session_id": session.public_id,
                "user_public_id": user.public_id,
            },
        )

        user_profile = UserProfileResponse(
            id=user.public_id,
            name=user.name,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=expires_in,
            refresh_token=new_raw_rt,
            user=user_profile,
        )

    def logout(self, refresh_token: str) -> bool:
        """
        Revoke the active session server-side.
        Idempotent: returns True without error if session is already revoked or not found.
        """
        clean_token = refresh_token.strip()
        if not clean_token:
            return True

        token_hash = hash_token(clean_token)
        try:
            self.session_repo.revoke_by_hash(token_hash)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        logger.info("auth.logout.succeeded", extra={"event": "auth.logout.succeeded"})
        return True

    def get_current_profile(self, current_user: CurrentUser) -> UserProfileResponse:
        """Return safe public user profile representation."""
        user = self.user_repo.get_by_id(current_user.id)
        if not user or not user.is_active:
            raise AccountInactiveError("User account not found or disabled.")

        return UserProfileResponse(
            id=user.public_id,
            name=user.name,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
