import io
from pathlib import Path
from unittest.mock import MagicMock
import pytest

from app.core.config import settings
from app.storage import get_media_storage
from app.storage.local import LocalMediaStorage
from app.storage.s3 import S3CompatibleMediaStorage


@pytest.mark.service
def test_storage_factory_selection():
    # Local backend returns LocalMediaStorage
    settings.STORAGE_BACKEND = "local"
    storage_local = get_media_storage()
    assert isinstance(storage_local, LocalMediaStorage)

    # S3 backend returns S3CompatibleMediaStorage
    settings.STORAGE_BACKEND = "s3"
    storage_s3 = get_media_storage()
    assert isinstance(storage_s3, S3CompatibleMediaStorage)

    # Reset back to local
    settings.STORAGE_BACKEND = "local"


@pytest.mark.service
def test_s3_storage_operations(tmp_path: Path):
    s3_storage = S3CompatibleMediaStorage(
        bucket_name="test-bucket",
        endpoint_url="http://localhost:9000",
        cache_dir=tmp_path / "cache",
    )

    # Mock boto3 client
    mock_boto = MagicMock()
    s3_storage._client = mock_boto

    # 1. Test save
    data = b"fake image payload"
    stored = s3_storage.save("people/usr_1/image.jpg", data, content_type="image/jpeg")
    assert stored.storage_key == "people/usr_1/image.jpg"
    assert stored.size_bytes == len(data)
    mock_boto.put_object.assert_called_once_with(
        Bucket="test-bucket",
        Key="people/usr_1/image.jpg",
        Body=data,
        ContentType="image/jpeg",
    )

    # 2. Test get
    mock_boto.get_object.return_value = {"Body": io.BytesIO(data)}
    retrieved = s3_storage.get("people/usr_1/image.jpg")
    assert retrieved == data

    # 3. Test open
    mock_boto.get_object.return_value = {"Body": io.BytesIO(data)}
    stream = s3_storage.open("people/usr_1/image.jpg")
    assert stream.read() == data

    # 4. Test exists
    mock_boto.head_object.return_value = {"ContentLength": len(data)}
    assert s3_storage.exists("people/usr_1/image.jpg") is True

    # 5. Test delete
    assert s3_storage.delete("people/usr_1/image.jpg") is True
    mock_boto.delete_object.assert_called_once_with(
        Bucket="test-bucket",
        Key="people/usr_1/image.jpg",
    )

    # 6. Test presigned URL
    mock_boto.generate_presigned_url.return_value = "https://s3.amazonaws.com/test-bucket/people/usr_1/image.jpg?signed=true"
    url = s3_storage.get_signed_url("people/usr_1/image.jpg", expires_in=300)
    assert "https://" in url
    mock_boto.generate_presigned_url.assert_called_once()
