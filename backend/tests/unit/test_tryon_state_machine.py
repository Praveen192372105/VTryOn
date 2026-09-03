import pytest

from app.core.exceptions import InvalidTryOnTransitionError
from app.domain.enums import TryOnJobStatus
from app.domain.state_machine import (
    is_active_tryon_status,
    is_terminal_tryon_status,
    validate_tryon_transition,
)


def test_allowed_state_transitions():
    """Verify strictly allowed canonical state transitions."""
    # QUEUED -> PROCESSING
    validate_tryon_transition(TryOnJobStatus.QUEUED, TryOnJobStatus.PROCESSING)
    # QUEUED -> FAILED (Allowed on queue submission failure compensation)
    validate_tryon_transition(TryOnJobStatus.QUEUED, TryOnJobStatus.FAILED)
    # PROCESSING -> SUCCEEDED
    validate_tryon_transition(TryOnJobStatus.PROCESSING, TryOnJobStatus.SUCCEEDED)
    # PROCESSING -> FAILED
    validate_tryon_transition(TryOnJobStatus.PROCESSING, TryOnJobStatus.FAILED)


def test_forbidden_state_transitions():
    """Verify forbidden state transitions raise InvalidTryOnTransitionError."""
    # Cannot jump directly from QUEUED to SUCCEEDED without PROCESSING
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.QUEUED, TryOnJobStatus.SUCCEEDED)

    # Terminal SUCCEEDED cannot transition to anything
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.SUCCEEDED, TryOnJobStatus.FAILED)
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.SUCCEEDED, TryOnJobStatus.PROCESSING)

    # Terminal FAILED cannot transition to anything
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.FAILED, TryOnJobStatus.PROCESSING)
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.FAILED, TryOnJobStatus.SUCCEEDED)


def test_cancelled_status_is_prohibited_in_v1():
    """Verify CANCELLED is not accepted as a valid transition in V1."""
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.QUEUED, "cancelled")
    with pytest.raises(InvalidTryOnTransitionError):
        validate_tryon_transition(TryOnJobStatus.PROCESSING, "cancelled")


def test_terminal_and_active_status_predicates():
    """Verify terminal and active state checks."""
    assert is_terminal_tryon_status(TryOnJobStatus.SUCCEEDED) is True
    assert is_terminal_tryon_status(TryOnJobStatus.FAILED) is True
    assert is_terminal_tryon_status(TryOnJobStatus.QUEUED) is False
    assert is_terminal_tryon_status(TryOnJobStatus.PROCESSING) is False

    assert is_active_tryon_status(TryOnJobStatus.QUEUED) is True
    assert is_active_tryon_status(TryOnJobStatus.PROCESSING) is True
    assert is_active_tryon_status(TryOnJobStatus.SUCCEEDED) is False
    assert is_active_tryon_status(TryOnJobStatus.FAILED) is False
