"""
Domain exception hierarchy for CatVTON runtime and inference.
"""

class CatVTONError(Exception):
    """Base exception for all CatVTON errors."""
    def __init__(self, message: str, provider: str = "catvton"):
        super().__init__(message)
        self.provider = provider


class CatVTONLoadError(CatVTONError):
    """Raised when CatVTON checkpoints or neural pipeline fail to load."""
    pass


class CatVTONOOMError(CatVTONError):
    """Raised when CUDA encounters an Out Of Memory condition during inference."""
    pass


class CatVTONInputError(CatVTONError):
    """Raised when input media (person or garment) is invalid, corrupt, or missing."""
    pass


class CatVTONPreprocessingError(CatVTONError):
    """Raised when human parsing (SCHP) or pose estimation (DensePose) fails."""
    pass


class CatVTONInferenceError(CatVTONError):
    """Raised when latent diffusion inference fails or produces invalid outputs."""
    pass
