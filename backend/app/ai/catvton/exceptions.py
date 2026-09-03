from app.core.exceptions import AppError


class CatVTONError(AppError):
    """Base exception for all CatVTON AI subsystem failures."""
    message = "CatVTON subsystem encountered an error."


class CatVTONModelLoadError(CatVTONError):
    """Raised when CatVTON checkpoints or model weights fail to load."""
    message = "Failed to load CatVTON model checkpoints."


class CatVTONModelUnavailableError(CatVTONError):
    """Raised when CatVTON inference is requested before the runtime is ready."""
    message = "CatVTON model runtime is not ready or unavailable."


class CatVTONInvalidInputError(CatVTONError):
    """Raised when input person or garment images fail validation or preprocessing."""
    message = "Invalid input images provided for virtual try-on."


class CatVTONPreprocessingError(CatVTONError):
    """Raised when segmentation or automatic mask synthesis fails."""
    message = "Failed to preprocess images or generate agnostic mask for virtual try-on."


class CatVTONOutOfMemoryError(CatVTONError):
    """Raised when CUDA runs out of memory during diffusion model execution."""
    message = "CUDA out of memory during CatVTON inference."


class CatVTONInferenceError(CatVTONError):
    """Raised when diffusion pipeline execution encounters an unexpected runtime error."""
    message = "CatVTON inference execution failed."


class CatVTONOutputError(CatVTONError):
    """Raised when generated output is empty, corrupt, or fails dimension validation."""
    message = "CatVTON pipeline generated an invalid or corrupt output image."


# Backward-compatible aliases
CatVTONOOMError = CatVTONOutOfMemoryError
CatVTONConfigurationError = CatVTONModelLoadError
CatVTONRuntimeError = CatVTONInferenceError

__all__ = [
    "CatVTONError",
    "CatVTONModelLoadError",
    "CatVTONModelUnavailableError",
    "CatVTONInvalidInputError",
    "CatVTONPreprocessingError",
    "CatVTONOutOfMemoryError",
    "CatVTONInferenceError",
    "CatVTONOutputError",
    "CatVTONOOMError",
    "CatVTONConfigurationError",
    "CatVTONRuntimeError",
]
