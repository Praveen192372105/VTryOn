"""
Provider Registry
=================
Central registry managing active Virtual Try-On inference providers.
Configured for CatVTON exclusive execution.
"""

import logging
from typing import Any, Dict, Optional

from app.ai.providers.base import TryOnProvider
from app.ai.providers.catvton import CatVTONTryOnProvider
from app.ai.providers.types import ProviderCapabilities, ProviderUnavailableError
from app.core.config import settings

logger = logging.getLogger("vtryon.ai.providers.registry")


class ProviderRegistry:
    """Registry maintaining active Virtual Try-On inference providers."""

    def __init__(
        self,
        primary_name: Optional[str] = None,
    ):
        self._providers: Dict[str, TryOnProvider] = {}
        self._primary_name: str = primary_name or getattr(settings, "TRYON_PRIMARY_PROVIDER", "catvton")

    def register(self, provider: TryOnProvider) -> None:
        self._providers[provider.name] = provider
        logger.info(f"Registered try-on provider '{provider.name}'.")

    def get(self, name: str) -> TryOnProvider:
        if name not in self._providers:
            raise ProviderUnavailableError(f"Provider '{name}' is not registered.", provider=name)
        return self._providers[name]

    def get_primary(self) -> TryOnProvider:
        return self.get(self._primary_name)

    def list_capabilities(self) -> Dict[str, ProviderCapabilities]:
        return {name: p.capabilities for name, p in self._providers.items()}


_global_registry: Optional[ProviderRegistry] = None


def get_provider_registry() -> ProviderRegistry:
    """Returns the configured global ProviderRegistry singleton."""
    global _global_registry
    if _global_registry is None:
        registry = ProviderRegistry(primary_name="catvton")
        registry.register(CatVTONTryOnProvider())
        _global_registry = registry
    return _global_registry
