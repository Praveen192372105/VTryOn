"""
Provider Abstraction Types — Phase 17
=====================================
Domain types, capabilities, result structures, and normalized exceptions for AI try-on providers.
"""

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional
from PIL import Image


class GenerationMode(str, Enum):
    """Semantic truthfulness classification of try-on results."""
    ACCURATE = "accurate"
    GENERATIVE_FALLBACK = "generative_fallback"
    CREATIVE_TRYON = "creative_tryon"


@dataclass(frozen=True)
class ProviderCapabilities:
    """Explicitly verified capabilities of an AI provider."""
    accepts_person_image: bool
    accepts_garment_image: bool
    supports_two_reference_generation: bool
    supports_image_editing: bool
    supports_virtual_try_on: bool


@dataclass(frozen=True)
class TryOnProviderResult:
    """Canonical result object returned by any TryOnProvider."""
    provider: str
    output_image: Image.Image
    generation_mode: str
    model: Optional[str] = None
    execution_time_seconds: float = 0.0


# -----------------------------------------------------------------------------
# Normalized Provider Error Hierarchy
# -----------------------------------------------------------------------------
class TryOnProviderError(Exception):
    """Base exception for all AI try-on provider operations."""
    def __init__(self, message: str, provider: str = "unknown", retryable: bool = False):
        super().__init__(message)
        self.provider = provider
        self.retryable = retryable


class ProviderUnavailableError(TryOnProviderError):
    """The provider is not configured, not enabled, or lacks required capability."""
    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider, retryable=False)


class ProviderAuthError(TryOnProviderError):
    """Authentication or authorization failure (e.g., HTTP 401/403). Non-retryable."""
    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider, retryable=False)


class ProviderRateLimitError(TryOnProviderError):
    """Rate limit or quota exceeded (e.g., HTTP 429). Retryable with backoff."""
    def __init__(self, message: str, provider: str = "unknown", retry_after_seconds: Optional[float] = None):
        super().__init__(message, provider=provider, retryable=True)
        self.retry_after_seconds = retry_after_seconds


class ProviderInvalidInputError(TryOnProviderError):
    """Input media or parameters rejected by provider. Non-retryable."""
    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider, retryable=False)


class ProviderTransientError(TryOnProviderError):
    """Transient network or server error (e.g., HTTP 502/503/504, connection reset)."""
    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider, retryable=True)


class ProviderPermanentError(TryOnProviderError):
    """Permanent provider failure or unrecoverable error."""
    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(message, provider=provider, retryable=False)
