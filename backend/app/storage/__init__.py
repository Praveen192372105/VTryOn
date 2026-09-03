from app.core.config import settings
from app.storage.base import MediaStorage
from app.storage.local import LocalMediaStorage, default_storage
from app.storage.s3 import S3CompatibleMediaStorage

_s3_storage_instance = None


def get_media_storage() -> MediaStorage:
    """Factory returning configured media storage adapter (LocalMediaStorage or S3CompatibleMediaStorage)."""
    global _s3_storage_instance
    if settings.STORAGE_BACKEND == "s3":
        if _s3_storage_instance is None:
            _s3_storage_instance = S3CompatibleMediaStorage()
        return _s3_storage_instance
    return default_storage


__all__ = [
    "MediaStorage",
    "LocalMediaStorage",
    "S3CompatibleMediaStorage",
    "default_storage",
    "get_media_storage",
]
