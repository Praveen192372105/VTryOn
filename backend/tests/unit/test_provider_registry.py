"""
Unit Tests: Provider Registry — CatVTON Only
============================================
Verifies:
- CatVTON is registered as primary provider
- CatVTON provider capability reporting
- Retrieval by name and default primary provider
"""

import pytest
from app.ai.providers.catvton import CatVTONTryOnProvider
from app.ai.providers.registry import ProviderRegistry, get_provider_registry
from app.ai.providers.types import ProviderUnavailableError
from app.core.config import settings


def test_catvton_provider_capabilities():
    """CatVTON provider reports full try-on capabilities."""
    provider = CatVTONTryOnProvider()
    assert provider.name == "catvton"
    caps = provider.capabilities
    assert caps.accepts_person_image is True
    assert caps.accepts_garment_image is True
    assert caps.supports_virtual_try_on is True
    assert caps.supports_two_reference_generation is True


def test_provider_registry_catvton_primary():
    """Registry returns catvton as primary provider."""
    registry = ProviderRegistry(primary_name="catvton")
    catvton = CatVTONTryOnProvider()
    registry.register(catvton)

    assert registry.get_primary().name == "catvton"


def test_provider_registry_unknown_provider():
    """Requesting an unregistered provider raises ProviderUnavailableError."""
    registry = ProviderRegistry()
    with pytest.raises(ProviderUnavailableError, match="Provider 'nonexistent' is not registered"):
        registry.get("nonexistent")


def test_provider_registry_list_capabilities():
    """list_capabilities returns a dictionary of registered providers."""
    registry = ProviderRegistry()
    registry.register(CatVTONTryOnProvider())

    caps = registry.list_capabilities()
    assert "catvton" in caps
    assert caps["catvton"].supports_virtual_try_on is True
