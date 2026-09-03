import os
import shutil
import tempfile
from pathlib import Path
from typing import BinaryIO, Optional, Union

from app.core.config import settings
from app.core.exceptions import (
    InvalidStorageKeyError,
    StorageError,
    StorageObjectNotFoundError,
    UploadStorageFailedError,
)
from app.storage.base import StoredMedia


class LocalMediaStorage:
    """
    Local filesystem media storage implementation.
    Safely resolves keys within configured root and prevents directory traversal attacks.
    Executes atomic writes using destination filesystem temp files.
    """

    def __init__(self, root_dir: Optional[Union[str, Path]] = None):
        self.root_dir = Path(root_dir).resolve() if root_dir else settings.resolved_storage_root
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def _get_safe_path(self, key: str) -> Path:
        """
        Validate and resolve key into an absolute Path within root_dir.
        Guards against directory traversal attacks (e.g., ../../etc/passwd, C:\\Windows, NUL bytes).
        """
        if not key or not isinstance(key, str):
            raise InvalidStorageKeyError("Storage key must be a non-empty string.")

        if "\x00" in key:
            raise InvalidStorageKeyError("Null byte detected in storage key.")

        # Disallow absolute paths or Windows drive letters in keys
        if key.startswith("/") or key.startswith("\\") or (len(key) > 1 and key[1] == ":"):
            raise InvalidStorageKeyError(f"Absolute paths not permitted in storage key: '{key}'")

        # Disallow explicit traversal tokens
        parts = key.replace("\\", "/").split("/")
        if ".." in parts:
            raise InvalidStorageKeyError(f"Directory traversal detected in storage key: '{key}'")

        clean_key = "/".join(p for p in parts if p and p != ".")
        target_path = (self.root_dir / clean_key).resolve()

        root_resolved = self.root_dir.resolve()
        try:
            target_path.relative_to(root_resolved)
        except ValueError:
            raise InvalidStorageKeyError(f"Access denied: Path traversal outside storage root: '{key}'")

        return target_path

    def save(self, key: str, data: bytes, content_type: Optional[str] = None) -> StoredMedia:
        """
        Save file atomically using temp file write + atomic rename (os.replace).
        Cleans up temporary files in all failure scenarios.
        """
        target_path = self._get_safe_path(key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                dir=str(target_path.parent),
                prefix=".tmp_upload_",
                delete=False,
            ) as tmp_file:
                tmp_path = Path(tmp_file.name)
                tmp_file.write(data)
                tmp_file.flush()
                os.fsync(tmp_file.fileno())

            # Atomic rename / replace on same filesystem
            os.replace(str(tmp_path), str(target_path))
            canonical_key = key.replace("\\", "/").lstrip("/")
            return StoredMedia(canonical_key, len(data))
        except Exception as exc:
            if tmp_path and tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass
            raise UploadStorageFailedError(f"Failed to persist media to storage: {str(exc)}")

    def get(self, key: str) -> bytes:
        """
        Read binary content of file.
        """
        target_path = self._get_safe_path(key)
        if not target_path.is_file():
            raise StorageObjectNotFoundError(f"Storage object not found: '{key}'")
        try:
            return target_path.read_bytes()
        except Exception as exc:
            raise StorageError(f"Failed to read storage object '{key}': {str(exc)}")

    def open(self, key: str) -> BinaryIO:
        """
        Open binary read-only stream for storage object.
        """
        target_path = self._get_safe_path(key)
        if not target_path.is_file():
            raise StorageObjectNotFoundError(f"Storage object not found: '{key}'")
        try:
            return open(target_path, "rb")
        except Exception as exc:
            raise StorageError(f"Failed to open storage object stream '{key}': {str(exc)}")

    def delete(self, key: str) -> bool:
        """
        Delete file if it exists. Idempotent: returns True if deleted, False if already absent.
        """
        try:
            target_path = self._get_safe_path(key)
            if target_path.is_file():
                target_path.unlink()
                return True
            return False
        except (InvalidStorageKeyError, StorageObjectNotFoundError):
            return False
        except Exception as exc:
            raise StorageError(f"Failed to delete storage object '{key}': {str(exc)}")

    def exists(self, key: str) -> bool:
        """
        Check if file exists on disk.
        """
        try:
            target_path = self._get_safe_path(key)
            return target_path.is_file()
        except Exception:
            return False

    def resolve_path(self, key: str) -> str:
        """
        Get absolute local filesystem path.
        """
        return str(self._get_safe_path(key))

    def get_url(self, key: str) -> str:
        """
        Return web-accessible delivery URL for static assets.
        """
        clean_key = key.replace("\\", "/").lstrip("/")
        base = settings.MEDIA_BASE_URL.rstrip("/")
        return f"{base}/{clean_key}"


default_storage = LocalMediaStorage()
