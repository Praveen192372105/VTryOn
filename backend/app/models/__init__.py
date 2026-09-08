"""Backward-compatibility aliases for database models."""
from app.db.models.user import User
from app.db.models.auth_session import AuthSession
from app.db.models.upload import Upload
from app.db.models.outfit import Outfit
from app.db.models.favorite import Favorite
from app.db.models.tryon import TryOnJob, TryOnResult

__all__ = [
    "User",
    "AuthSession",
    "Upload",
    "Outfit",
    "Favorite",
    "TryOnJob",
    "TryOnResult",
]
