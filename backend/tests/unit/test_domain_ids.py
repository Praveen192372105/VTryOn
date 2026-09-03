import pytest
from app.domain.ids import ResourcePrefix, extract_prefix, generate_public_id, validate_public_id


def test_generate_public_ids_for_all_prefixes():
    for prefix in ResourcePrefix:
        pid = generate_public_id(prefix)
        assert pid.startswith(f"{prefix.value}_")
        assert len(pid) == len(prefix.value) + 1 + 26  # prefix + '_' + 26-char ULID
        assert validate_public_id(pid) is True
        assert validate_public_id(pid, expected_prefix=prefix) is True
        assert extract_prefix(pid) == prefix


def test_validate_public_id_invalid_strings():
    assert validate_public_id("") is False
    assert validate_public_id("invalid_id") is False
    assert validate_public_id("usr_123") is False
    assert validate_public_id("unknown_01j7q9abcde123456789012345") is False
    assert validate_public_id(None) is False
    assert validate_public_id(12345) is False


def test_validate_public_id_mismatched_prefix():
    user_id = generate_public_id(ResourcePrefix.USER)
    assert validate_public_id(user_id, expected_prefix=ResourcePrefix.USER) is True
    assert validate_public_id(user_id, expected_prefix=ResourcePrefix.OUTFIT) is False
    assert validate_public_id(user_id, expected_prefix=ResourcePrefix.TRYON_JOB) is False


def test_extract_prefix():
    upload_id = generate_public_id(ResourcePrefix.UPLOAD)
    assert extract_prefix(upload_id) == ResourcePrefix.UPLOAD
    assert extract_prefix("corrupt_id_string") is None
