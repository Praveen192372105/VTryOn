from typing import Dict, Set, Union

from app.core.exceptions import InvalidTryOnTransitionError
from app.domain.enums import TryOnJobStatus

# Explicit state transition map for Virtual Try-On jobs
ALLOWED_TRYON_TRANSITIONS: Dict[str, Set[str]] = {
    TryOnJobStatus.QUEUED.value: {
        TryOnJobStatus.PROCESSING.value,
        TryOnJobStatus.FAILED.value,
    },
    TryOnJobStatus.PROCESSING.value: {
        TryOnJobStatus.SUCCEEDED.value,
        TryOnJobStatus.FAILED.value,
    },
    TryOnJobStatus.SUCCEEDED.value: set(),  # Terminal state
    TryOnJobStatus.FAILED.value: set(),     # Terminal state
}


def _normalize_status(status: Union[str, TryOnJobStatus]) -> str:
    return status.value if hasattr(status, "value") else str(status)


def validate_tryon_transition(
    current: Union[str, TryOnJobStatus],
    target: Union[str, TryOnJobStatus],
) -> None:
    """
    Validate that transitioning a TryOnJob from `current` to `target` status is allowed.
    Raises InvalidTryOnTransitionError if the transition is prohibited.
    """
    curr_str = _normalize_status(current)
    target_str = _normalize_status(target)

    allowed_targets = ALLOWED_TRYON_TRANSITIONS.get(curr_str, set())
    if target_str not in allowed_targets:
        raise InvalidTryOnTransitionError(
            f"Invalid try-on job state transition from '{curr_str}' to '{target_str}'."
        )


def is_terminal_tryon_status(status: Union[str, TryOnJobStatus]) -> bool:
    """
    Check if a TryOnJob status is a terminal state (SUCCEEDED or FAILED).
    """
    status_str = _normalize_status(status)
    return status_str in (TryOnJobStatus.SUCCEEDED.value, TryOnJobStatus.FAILED.value)


def is_active_tryon_status(status: Union[str, TryOnJobStatus]) -> bool:
    """
    Check if a TryOnJob is currently active in the queue or GPU worker (QUEUED or PROCESSING).
    """
    status_str = _normalize_status(status)
    return status_str in (TryOnJobStatus.QUEUED.value, TryOnJobStatus.PROCESSING.value)
