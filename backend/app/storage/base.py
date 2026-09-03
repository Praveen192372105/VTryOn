from typing import BinaryIO, Optional, Protocol


class StoredMedia(str):
    """
    Result descriptor for stored media objects.
    Subclasses str so it can be passed directly where a storage_key string is expected,
    while also exposing typed metadata attributes.
    """
    storage_key: str
    size_bytes: int

    def __new__(cls, storage_key: str, size_bytes: int):
        instance = super().__new__(cls, storage_key)
        instance.storage_key = storage_key
        instance.size_bytes = size_bytes
        return instance


class MediaStorage(Protocol):
    """
    Protocol defining the media storage interface (Local disk, S3, MinIO, R2, etc.).
    """

    def save(self, key: str, data: bytes, content_type: Optional[str] = None) -> StoredMedia:
        """
        Save binary data to the given storage key atomically. Returns StoredMedia.
        """
        ...

    def get(self, key: str) -> bytes:
        """
        Retrieve binary content from the given storage key.
        """
        ...

    def open(self, key: str) -> BinaryIO:
        """
        Open binary read-only stream for the given storage key.
        """
        ...

    def delete(self, key: str) -> bool:
        """
        Delete an object by key. Idempotent: returns True if deleted, False if not found.
        """
        ...

    def exists(self, key: str) -> bool:
        """
        Check if an object exists at the given storage key.
        """
        ...

    def resolve_path(self, key: str) -> str:
        """
        Resolve storage key to a local filesystem path (for local/cached execution).
        """
        ...

    def get_url(self, key: str) -> str:
        """
        Generate a web-accessible URL for client delivery where applicable.
        """
        ...
