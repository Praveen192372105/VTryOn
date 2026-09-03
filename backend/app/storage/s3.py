import io
import logging
from pathlib import Path
from typing import BinaryIO, Optional

from app.core.config import settings
from app.core.exceptions import StorageError
from app.storage.base import MediaStorage, StoredMedia

logger = logging.getLogger("vtryon.storage.s3")


class S3CompatibleMediaStorage:
    """
    Production-grade S3-compatible media storage adapter (AWS S3, MinIO, Cloudflare R2).
    Satisfies the MediaStorage protocol.
    Provides local workspace caching via resolve_path for GPU inference workers.
    """
    def __init__(
        self,
        bucket_name: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        region_name: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        cache_dir: Optional[Path] = None,
    ):
        self.bucket_name = bucket_name or settings.S3_BUCKET_NAME or "vtryon-media"
        self.endpoint_url = endpoint_url or settings.S3_ENDPOINT_URL
        self.region_name = region_name or settings.S3_REGION
        self.access_key_id = access_key_id or (
            settings.S3_ACCESS_KEY_ID.get_secret_value() if settings.S3_ACCESS_KEY_ID else None
        )
        self.secret_access_key = secret_access_key or (
            settings.S3_SECRET_ACCESS_KEY.get_secret_value() if settings.S3_SECRET_ACCESS_KEY else None
        )
        self.cache_dir = cache_dir or (Path(settings.resolved_temp_root) / "s3_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                import boto3
                from botocore.config import Config

                self._client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    region_name=self.region_name,
                    aws_access_key_id=self.access_key_id,
                    aws_secret_access_key=self.secret_access_key,
                    config=Config(signature_version="s3v4"),
                )
            except ImportError as err:
                logger.warning(f"boto3 not installed. S3 operations will fail: {err}")
                self._client = None
        return self._client

    def save(self, key: str, data: bytes, content_type: Optional[str] = None) -> StoredMedia:
        clean_key = key.lstrip("/\\")
        if self.client is None:
            raise StorageError("S3 storage client is unavailable (boto3 missing or uninitialized)")
        try:
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type

            self.client.put_object(
                Bucket=self.bucket_name,
                Key=clean_key,
                Body=data,
                **extra_args,
            )
            return StoredMedia(clean_key, len(data))
        except Exception as exc:
            logger.error(f"Failed to save object to S3 key '{clean_key}': {str(exc)}", exc_info=True)
            raise StorageError(f"S3 upload failed: {str(exc)}") from exc

    def get(self, key: str) -> bytes:
        clean_key = key.lstrip("/\\")
        if self.client is None:
            raise StorageError("S3 storage client is unavailable")
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=clean_key)
            return response["Body"].read()
        except Exception as exc:
            logger.error(f"Failed to read object from S3 key '{clean_key}': {str(exc)}")
            raise StorageError(f"S3 get failed: {str(exc)}") from exc

    def open(self, key: str) -> BinaryIO:
        data = self.get(key)
        return io.BytesIO(data)

    def delete(self, key: str) -> bool:
        clean_key = key.lstrip("/\\")
        if self.client is None:
            raise StorageError("S3 storage client is unavailable")
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=clean_key)
            # Also purge from local cache if present
            cached_path = self.cache_dir / clean_key
            if cached_path.exists():
                cached_path.unlink(missing_ok=True)
            return True
        except Exception as exc:
            logger.warning(f"Failed to delete S3 key '{clean_key}': {str(exc)}")
            return False

    def exists(self, key: str) -> bool:
        clean_key = key.lstrip("/\\")
        if self.client is None:
            return False
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=clean_key)
            return True
        except Exception:
            return False

    def resolve_path(self, key: str) -> str:
        """
        Download/cache the S3 object locally and return the absolute filesystem path.
        Essential for local file-path consumers such as PyTorch / OpenCV in CatVTON.
        """
        clean_key = key.lstrip("/\\")
        cached_path = self.cache_dir / clean_key
        if not cached_path.exists():
            data = self.get(clean_key)
            cached_path.parent.mkdir(parents=True, exist_ok=True)
            cached_path.write_bytes(data)
        return str(cached_path.resolve())

    def get_signed_url(self, key: str, expires_in: Optional[int] = None) -> str:
        """Generate a short-lived presigned URL for secure authorized client retrieval."""
        clean_key = key.lstrip("/\\")
        ttl = expires_in or settings.PRIVATE_MEDIA_URL_TTL_SECONDS
        if self.client is None:
            raise StorageError("S3 client is unavailable for URL generation")
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": clean_key},
                ExpiresIn=ttl,
            )
        except Exception as exc:
            logger.error(f"Failed to generate presigned S3 URL: {str(exc)}")
            raise StorageError(f"Presigned URL generation failed: {str(exc)}") from exc


__all__ = ["S3CompatibleMediaStorage"]
