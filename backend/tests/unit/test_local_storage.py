from pathlib import Path
import pytest

from app.core.exceptions import InvalidStorageKeyError, StorageObjectNotFoundError
from app.storage.local import LocalMediaStorage


def test_local_storage_atomic_save_get_and_delete(tmp_path: Path):
    storage = LocalMediaStorage(root_dir=tmp_path)

    key = "people/usr_test001/upl_test002.jpg"
    payload = b"test_canonical_binary_image_data_here"

    # Save
    stored = storage.save(key, payload, content_type="image/jpeg")
    assert stored.storage_key == key
    assert stored.size_bytes == len(payload)

    # Exists & Get
    assert storage.exists(key) is True
    retrieved = storage.get(key)
    assert retrieved == payload

    # Open stream
    with storage.open(key) as f:
        stream_data = f.read()
        assert stream_data == payload

    # Delete
    deleted = storage.delete(key)
    assert deleted is True
    assert storage.exists(key) is False

    # Second delete is idempotent
    assert storage.delete(key) is False


def test_local_storage_path_traversal_rejection(tmp_path: Path):
    storage = LocalMediaStorage(root_dir=tmp_path)

    # Directory traversal keys
    with pytest.raises(InvalidStorageKeyError):
        storage.save("../evil.jpg", b"data")

    with pytest.raises(InvalidStorageKeyError):
        storage.save("people/../../secret.txt", b"data")

    with pytest.raises(InvalidStorageKeyError):
        storage.save("/etc/passwd", b"data")


def test_local_storage_object_not_found(tmp_path: Path):
    storage = LocalMediaStorage(root_dir=tmp_path)
    with pytest.raises(StorageObjectNotFoundError):
        storage.get("people/usr_999/nonexistent.jpg")
