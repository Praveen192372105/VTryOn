"""
Base Try-On Provider Interface — Phase 17
==========================================
Protocol and abstract definition for Virtual Try-On inference providers.
"""

from pathlib import Path
from typing import Optional, Protocol
from app.ai.providers.types import ProviderCapabilities, TryOnProviderResult


class TryOnProvider(Protocol):
    """
    Standard interface that all virtual try-on providers must fulfill.
    Guarantees pluggable primary (CatVTON) and optional fallback (Mistral/BFL).
    """

    @property
    def name(self) -> str:
        """Unique identifier of the provider (e.g. 'catvton', 'mistral')."""
        ...

    @property
    def capabilities(self) -> ProviderCapabilities:
        """Verified capability matrix for this provider."""
        ...

    def generate(
        self,
        *,
        person_image_path: Path,
        garment_image_path: Path,
        category: str,
        request_id: Optional[str] = None,
    ) -> TryOnProviderResult:
        """
        Executes try-on inference to produce a rendered result image.
        Raises TryOnProviderError (or subclass) on failure.
        """
        ...
