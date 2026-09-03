import pytest
from app.core.exceptions import StorageError
from app.storage.local import LocalMediaStorage


def test_storage_save_get_delete(tmp_path):
    storage = LocalMediaStorage(root_dir=str(tmp_path))
    test_key = "uploads/person_1.jpg"
    test_data = b"\xff\xd8\xff\xe0\x00\x10JFIF"  # Minimal JPEG header

    # 1. Save
    saved_key = storage.save(test_key, test_data)
    assert saved_key == test_key
    assert storage.exists(test_key) is True

    # 2. Get
    retrieved = storage.get(test_key)
    assert retrieved == test_data

    # 3. Resolve path
    resolved = storage.resolve_path(test_key)
    assert str(tmp_path) in resolved

    # 4. Delete
    deleted = storage.delete(test_key)
    assert deleted is True
    assert storage.exists(test_key) is False


def test_storage_path_traversal_protection(tmp_path):
    storage = LocalMediaStorage(root_dir=str(tmp_path))
    evil_key = "../../../windows/system32/cmd.exe"

    with pytest.raises(StorageError):
        storage.save(evil_key, b"malicious content")
