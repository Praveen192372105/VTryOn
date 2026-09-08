"""
CatVTON Try-On Provider Implementation
=======================================
Wraps the persistent CatVTON GPU runtime to fulfill the canonical TryOnProvider protocol.
Guarantees person and garment fidelity through specialized diffusion inpainting.
"""

import logging
from pathlib import Path
from typing import Optional

from app.ai.catvton import (
    CatVTONInput,
    CatVTONInputError,
    CatVTONLoadError,
    CatVTONOOMError,
    CatVTONRuntime,
)
from app.ai.providers.base import TryOnProvider
from app.ai.providers.types import (
    GenerationMode,
    ProviderCapabilities,
    ProviderInvalidInputError,
    ProviderPermanentError,
    ProviderTransientError,
    ProviderUnavailableError,
    TryOnProviderResult,
)

logger = logging.getLogger("vtryon.providers.catvton")


class CatVTONTryOnProvider(TryOnProvider):
    """
    Primary, specialized virtual try-on engine powered by CatVTON diffusion models.
    Operates through the process-local CatVTONRuntime singleton in the GPU Celery worker.
    """

    def __init__(self, runtime: Optional[CatVTONRuntime] = None):
        self._runtime = runtime or CatVTONRuntime.get_instance()

    @property
    def name(self) -> str:
        return "catvton"

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            accepts_person_image=True,
            accepts_garment_image=True,
            supports_two_reference_generation=True,
            supports_image_editing=True,
            supports_virtual_try_on=True,
        )

    def generate(
        self,
        *,
        person_image_path: Path,
        garment_image_path: Path,
        category: str,
        request_id: Optional[str] = None,
    ) -> TryOnProviderResult:
        """
        Executes virtual try-on inference using the persistent CatVTON pipeline.
        Translates internal CatVTON exceptions into normalized provider exceptions.
        """
        input_data = CatVTONInput(
            person_image_path=person_image_path,
            garment_image_path=garment_image_path,
            category=category,
            request_id=request_id,
        )

        try:
            output = self._runtime.generate(input_data)
            return TryOnProviderResult(
                provider=self.name,
                output_image=output.output_image,
                generation_mode=GenerationMode.ACCURATE.value,
                model=output.model_version,
                execution_time_seconds=output.execution_time_seconds,
            )
        except CatVTONInputError as exc:
            raise ProviderInvalidInputError(str(exc), provider=self.name) from exc
        except CatVTONLoadError as exc:
            raise ProviderUnavailableError(str(exc), provider=self.name) from exc
        except CatVTONOOMError as exc:
            raise ProviderTransientError(f"GPU out of memory: {exc}", provider=self.name) from exc
        except Exception as exc:
            raise ProviderPermanentError(f"CatVTON inference failed: {exc}", provider=self.name) from exc
