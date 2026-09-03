from app.ai.catvton.exceptions import (
    CatVTONInferenceError,
    CatVTONModelLoadError,
    CatVTONOOMError,
    CatVTONRuntimeError,
)
from app.core.exceptions import InvalidImageError, StorageError
from app.domain.enums import FailureCode
from app.services.tryon_worker import TryOnWorkerService


def test_failure_classification_mapping():
    worker = TryOnWorkerService()

    # OOM
    assert worker._classify_error(CatVTONOOMError("out of memory")) == FailureCode.GPU_OUT_OF_MEMORY
    assert worker._classify_error(RuntimeError("CUDA out of memory.")) == FailureCode.GPU_OUT_OF_MEMORY

    # Model Load
    assert worker._classify_error(CatVTONModelLoadError("checkpoints missing")) == FailureCode.MODEL_LOAD_FAILED

    # Inference Error
    assert worker._classify_error(CatVTONInferenceError("diffusion step failed")) == FailureCode.INFERENCE_FAILED
    assert worker._classify_error(CatVTONRuntimeError("pipeline failed")) == FailureCode.INFERENCE_FAILED

    # Storage & Media
    assert worker._classify_error(StorageError("disk write failure")) == FailureCode.STORAGE_WRITE_FAILED
    assert worker._classify_error(FileNotFoundError("image missing")) == FailureCode.INPUT_MEDIA_MISSING
    assert worker._classify_error(InvalidImageError("corrupt header")) == FailureCode.INVALID_PERSON_IMAGE

    # Fallback
    assert worker._classify_error(ValueError("unexpected")) == FailureCode.WORKER_FAILURE
