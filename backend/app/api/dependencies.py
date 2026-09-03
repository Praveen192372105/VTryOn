import logging
from typing import Generator, Optional
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AccountInactiveError,
    AuthenticationRequiredError,
    InvalidAccessTokenError,
)
from app.core.security import decode_access_token
from app.db.session import get_db
from app.domain.ownership import CurrentUser
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.favorite_service import FavoriteService
from app.services.outfit_service import OutfitService
from app.services.tryon_service import TryOnService
from app.services.upload_service import UploadService
from app.storage.base import MediaStorage
from app.storage import get_media_storage
from app.workers.dispatchers import CeleryTryOnJobDispatcher, TryOnJobDispatcher

logger = logging.getLogger("vtryon.api.dependencies")
bearer_security = HTTPBearer(auto_error=False)


def get_storage() -> MediaStorage:
    """Provide configured stateless MediaStorage instance (Local or S3)."""
    return get_media_storage()


def get_dispatcher() -> TryOnJobDispatcher:
    """Provide production Celery try-on job dispatcher."""
    return CeleryTryOnJobDispatcher()


def get_auth_service(
    db: Session = Depends(get_db),
) -> AuthService:
    return AuthService(db=db)


def get_upload_service(
    db: Session = Depends(get_db),
    storage: MediaStorage = Depends(get_storage),
) -> UploadService:
    return UploadService(db=db, storage=storage)


def get_outfit_service(
    db: Session = Depends(get_db),
    storage: MediaStorage = Depends(get_storage),
) -> OutfitService:
    return OutfitService(db=db, storage=storage)


def get_favorite_service(
    db: Session = Depends(get_db),
    storage: MediaStorage = Depends(get_storage),
) -> FavoriteService:
    return FavoriteService(db=db, storage=storage)


def get_tryon_service(
    db: Session = Depends(get_db),
    storage: MediaStorage = Depends(get_storage),
    dispatcher: TryOnJobDispatcher = Depends(get_dispatcher),
) -> TryOnService:
    return TryOnService(db=db, storage=storage, dispatcher=dispatcher)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """
    Authenticate request via Bearer JWT access token.
    Enforces token type, signature, expiry, active user record, and contributes
    OpenAPI Bearer authentication scheme.
    """
    if not credentials or not credentials.credentials:
        raise AuthenticationRequiredError("Authentication credentials are required.")

    token = credentials.credentials.strip()
    payload = decode_access_token(token)

    user_public_id = payload.get("sub")
    if not user_public_id:
        raise InvalidAccessTokenError("Token payload missing subject identifier.")

    user_repo = UserRepository(db)
    user = user_repo.get_by_public_id(user_public_id)
    if not user:
        raise InvalidAccessTokenError("Authenticated user record no longer exists.")

    if not user.is_active:
        raise AccountInactiveError("User account has been disabled.")

    return CurrentUser(
        id=user.id,
        public_id=user.public_id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
    )


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_security),
    db: Session = Depends(get_db),
) -> Optional[CurrentUser]:
    """
    Optional authentication dependency.
    Returns CurrentUser if valid token is provided, None otherwise.
    """
    if not credentials or not credentials.credentials:
        return None

    try:
        return get_current_user(credentials=credentials, db=db)
    except Exception:
        return None


from app.core.rate_limit import RateLimiter, get_rate_limiter  # re-export


__all__ = [
    "get_db",
    "get_storage",
    "get_dispatcher",
    "get_auth_service",
    "get_upload_service",
    "get_outfit_service",
    "get_favorite_service",
    "get_tryon_service",
    "get_current_user",
    "get_current_user_optional",
    "get_rate_limiter",
]
