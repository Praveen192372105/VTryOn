from app.ai.providers.types import (
    ProviderAuthError,
    ProviderInvalidInputError,
    ProviderPermanentError,
    ProviderRateLimitError,
    ProviderTransientError,
    ProviderUnavailableError,
)
from app.core.exceptions import InvalidImageError, StorageError
from app.domain.enums import FailureCode
from app.services.tryon_worker import TryOnWorkerService


def test_failure_classification_mapping():
    worker = TryOnWorkerService()

    # Provider Unavailable / Auth
    assert worker._classify_error(ProviderUnavailableError("service down")) == FailureCode.MODEL_LOAD_FAILED
    assert worker._classify_error(ProviderAuthError("invalid api key")) == FailureCode.MODEL_LOAD_FAILED

    # Provider Transient / Rate Limit
    assert worker._classify_error(ProviderRateLimitError("429 rate limit")) == FailureCode.INFERENCE_FAILED
    assert worker._classify_error(ProviderTransientError("timeout")) == FailureCode.INFERENCE_FAILED

    # Provider Permanent Error
    assert worker._classify_error(ProviderPermanentError("generation failed")) == FailureCode.INFERENCE_FAILED

    # Invalid Input
    assert worker._classify_error(ProviderInvalidInputError("corrupt face")) == FailureCode.INVALID_PERSON_IMAGE

    # Storage & Media
    assert worker._classify_error(StorageError("disk write failure")) == FailureCode.STORAGE_WRITE_FAILED
    assert worker._classify_error(FileNotFoundError("image missing")) == FailureCode.INPUT_MEDIA_MISSING
    assert worker._classify_error(InvalidImageError("corrupt header")) == FailureCode.INVALID_PERSON_IMAGE
    assert worker._classify_error(InvalidImageError("corrupt garment header")) == FailureCode.INVALID_GARMENT_IMAGE

    # Unexpected fallback
    assert worker._classify_error(ValueError("unexpected")) == FailureCode.WORKER_FAILURE
