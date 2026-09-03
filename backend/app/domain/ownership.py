from dataclasses import dataclass
from typing import Optional

from app.core.exceptions import (
    AccessDeniedError,
    ResourceNotFoundError,
    TryOnJobActiveError,
    UploadInUseError,
)
from app.domain.enums import TryOnJobStatus
from app.domain.state_machine import is_active_tryon_status


@dataclass(frozen=True)
class CurrentUser:
    """
    Domain representation of an authenticated user principal passed to services.
    Decoupled from HTTP transport and tokens.
    """
    id: int
    public_id: str
    email: str
    name: Optional[str] = None
    is_active: bool = True


def ensure_resource_owner(
    owner_id: str,
    current_user_id: str,
    resource_name: str = "resource",
    hide_existence: bool = True,
) -> None:
    """
    Validate that the resource belongs to the current user.
    If `hide_existence=True` (default for private uploads/jobs), raises ResourceNotFoundError (404)
    to prevent leaking resource existence to other authenticated users.
    Otherwise raises AccessDeniedError (403).
    """
    if owner_id != current_user_id:
        if hide_existence:
            raise ResourceNotFoundError(f"The requested {resource_name} was not found.")
        raise AccessDeniedError(f"You do not have permission to access this {resource_name}.")


def ensure_upload_not_in_use(active_jobs_count: int, upload_id: str) -> None:
    """
    Ensure an upload is not being actively processed by a queued or running try-on job.
    Raises UploadInUseError (409 Conflict) if active jobs depend on it.
    """
    if active_jobs_count > 0:
        raise UploadInUseError(
            f"Cannot delete upload '{upload_id}'. It is currently in use by {active_jobs_count} active try-on job(s)."
        )


def ensure_tryon_deletable(status: str | TryOnJobStatus, job_id: str) -> None:
    """
    Ensure a try-on job is not actively running before allowing deletion.
    Raises TryOnJobActiveError (409 Conflict) if the job is QUEUED or PROCESSING.
    """
    status_val = status.value if hasattr(status, "value") else str(status)
    if is_active_tryon_status(status_val):
        raise TryOnJobActiveError(
            f"Cannot delete try-on job '{job_id}' while it is currently in status '{status_val}'."
        )
