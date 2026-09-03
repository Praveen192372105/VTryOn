import pytest
from app.core.exceptions import (
    AccessDeniedError,
    ResourceNotFoundError,
    TryOnJobActiveError,
    UploadInUseError,
)
from app.domain.enums import TryOnJobStatus
from app.domain.ownership import (
    ensure_resource_owner,
    ensure_tryon_deletable,
    ensure_upload_not_in_use,
)


def test_ensure_resource_owner_matching():
    # Should not raise any exception when owner matches
    ensure_resource_owner(owner_id="usr_01", current_user_id="usr_01")


def test_ensure_resource_owner_mismatch_hides_existence():
    # Default hide_existence=True must raise 404 ResourceNotFoundError to prevent resource enumeration
    with pytest.raises(ResourceNotFoundError) as exc_info:
        ensure_resource_owner(
            owner_id="usr_target_owner",
            current_user_id="usr_attacker",
            resource_name="person upload",
            hide_existence=True,
        )
    assert exc_info.value.status_code == 404
    assert "not found" in exc_info.value.message.lower()


def test_ensure_resource_owner_mismatch_explicit_forbidden():
    with pytest.raises(AccessDeniedError) as exc_info:
        ensure_resource_owner(
            owner_id="usr_target_owner",
            current_user_id="usr_attacker",
            resource_name="catalogue admin item",
            hide_existence=False,
        )
    assert exc_info.value.status_code == 403


def test_ensure_upload_not_in_use():
    # Safe when 0 active jobs
    ensure_upload_not_in_use(active_jobs_count=0, upload_id="upl_test_01")

    # Conflict when >0 active jobs
    with pytest.raises(UploadInUseError) as exc_info:
        ensure_upload_not_in_use(active_jobs_count=2, upload_id="upl_test_01")
    assert exc_info.value.status_code == 409
    assert exc_info.value.code == "UPLOAD_IN_USE"


def test_ensure_tryon_deletable():
    # Terminal states can be deleted
    ensure_tryon_deletable(TryOnJobStatus.SUCCEEDED, "job_01")
    ensure_tryon_deletable(TryOnJobStatus.FAILED, "job_02")

    # Active states cannot be deleted
    with pytest.raises(TryOnJobActiveError) as exc_info:
        ensure_tryon_deletable(TryOnJobStatus.QUEUED, "job_03")
    assert exc_info.value.status_code == 409
    assert exc_info.value.code in ("TRYON_JOB_ACTIVE", "TRYON_JOB_IN_PROGRESS")

    with pytest.raises(TryOnJobActiveError):
        ensure_tryon_deletable(TryOnJobStatus.PROCESSING, "job_04")
