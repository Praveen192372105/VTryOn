"""
AI Providers Package
====================
Pluggable provider architecture for Virtual Try-On inference.
Primary Engine: CatVTON (Diffusion & Human Parsing)
"""

from app.ai.providers.base import TryOnProvider
from app.ai.providers.catvton import CatVTONTryOnProvider
from app.ai.providers.registry import ProviderRegistry, get_provider_registry
from app.ai.providers.types import (
    GenerationMode,
    ProviderAuthError,
    ProviderCapabilities,
    ProviderInvalidInputError,
    ProviderPermanentError,
    ProviderRateLimitError,
    ProviderTransientError,
    ProviderUnavailableError,
    TryOnProviderError,
    TryOnProviderResult,
)

__all__ = [
    "TryOnProvider",
    "CatVTONTryOnProvider",
    "ProviderRegistry",
    "get_provider_registry",
    "GenerationMode",
    "ProviderCapabilities",
    "TryOnProviderResult",
    "TryOnProviderError",
    "ProviderUnavailableError",
    "ProviderAuthError",
    "ProviderRateLimitError",
    "ProviderInvalidInputError",
    "ProviderTransientError",
    "ProviderPermanentError",
]
