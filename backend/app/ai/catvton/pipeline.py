import logging
import time
from typing import Any, Optional
from PIL import Image

from app.ai.catvton.config import ai_settings
from app.ai.catvton.exceptions import (
    CatVTONInferenceError,
    CatVTONInvalidInputError,
    CatVTONModelUnavailableError,
    CatVTONOutOfMemoryError,
)
from app.ai.catvton.postprocessing import validate_and_normalize_output
from app.ai.catvton.preprocessing import (
    generate_fallback_mask,
    map_outfit_category,
    prepare_images,
)
from app.ai.catvton.runtime import CatVTONRuntime
from app.ai.catvton.types import TryOnInput, TryOnOutput

logger = logging.getLogger("vtryon.ai.pipeline")


class CatVTONPipeline:
    """
    Backend-facing AI inference pipeline coordinating input preparation,
    diffusion model execution, CUDA OOM recovery, and raw output validation.
    """

    def __init__(self, runtime: Optional[CatVTONRuntime] = None, mock_mode: bool = False):
        self.runtime = runtime or CatVTONRuntime.get_instance()
        self.mock_mode = mock_mode

    def generate(self, tryon_input: TryOnInput) -> TryOnOutput:
        """
        Execute virtual try-on inference for the given TryOnInput contract.
        Thread-safe: bounded by runtime semaphore to enforce concurrency limits.
        """
        start_time = time.perf_counter()
        cloth_type = map_outfit_category(tryon_input.garment_category)

        logger.info(
            f"Starting CatVTON inference [category={cloth_type}, steps={tryon_input.steps or ai_settings.inference_steps}]",
            extra={
                "event": "catvton.inference.started",
                "category": cloth_type,
                "person": str(tryon_input.person_path),
                "garment": str(tryon_input.garment_path),
            },
        )

        if self.mock_mode:
            # Deterministic mock execution for testing / CPU environments
            time.sleep(0.05)
            person_img, _ = prepare_images(
                tryon_input.person_path,
                tryon_input.garment_path,
                ai_settings.width,
                ai_settings.height,
            )
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return TryOnOutput(
                image=person_img,
                width=person_img.width,
                height=person_img.height,
                duration_ms=duration_ms,
            )

        # Enforce concurrency guard (e.g. max 1 concurrent inference per worker process)
        acquired = self.runtime.semaphore.acquire(timeout=60.0)
        if not acquired:
            raise CatVTONInferenceError("Timed out waiting for GPU inference semaphore slot.")

        try:
            import torch

            # 1. Retrieve persistent runtime components
            pipeline, automasker, mask_processor = self.runtime.components

            # 2. Preprocess person & garment
            person_img, garment_img = prepare_images(
                tryon_input.person_path,
                tryon_input.garment_path,
                ai_settings.width,
                ai_settings.height,
            )

            # 3. Generate agnostic mask
            try:
                if hasattr(automasker, "__call__"):
                    raw_mask = automasker(person_img, cloth_type)["mask"]
                else:
                    raw_mask = generate_fallback_mask(person_img, cloth_type)
            except Exception as mask_exc:
                logger.warning(f"AutoMasker failed ({str(mask_exc)}); using fallback mask.")
                raw_mask = generate_fallback_mask(person_img, cloth_type)

            # 4. Blur mask
            if hasattr(mask_processor, "blur"):
                mask = mask_processor.blur(raw_mask, blur_factor=9)
            else:
                mask = raw_mask

            # 5. Generator seed
            generator = None
            if tryon_input.seed is not None and tryon_input.seed != -1:
                generator = torch.Generator(device=pipeline.device).manual_seed(tryon_input.seed)

            # 6. Run diffusion model under inference mode (no gradients)
            steps = tryon_input.steps or ai_settings.inference_steps
            guidance = tryon_input.guidance_scale or ai_settings.guidance_scale

            with torch.inference_mode():
                result_images = pipeline(
                    image=person_img,
                    condition_image=garment_img,
                    mask=mask,
                    num_inference_steps=steps,
                    guidance_scale=guidance,
                    generator=generator,
                )

            raw_result = result_images[0]
            norm_result = validate_and_normalize_output(raw_result)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            logger.info(
                f"CatVTON inference completed in {duration_ms}ms",
                extra={"event": "catvton.inference.completed", "duration_ms": duration_ms},
            )

            return TryOnOutput(
                image=norm_result,
                width=norm_result.width,
                height=norm_result.height,
                duration_ms=duration_ms,
            )

        except CatVTONModelUnavailableError:
            raise
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            exc_str = str(exc).lower()

            # Detect CUDA Out of Memory
            if "out of memory" in exc_str or "cuda oom" in exc_str or (hasattr(exc, "__class__") and "OutOfMemoryError" in exc.__class__.__name__):
                logger.error(
                    "CatVTON CUDA Out of Memory detected during inference!",
                    extra={"event": "catvton.inference.oom", "duration_ms": duration_ms},
                )
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except Exception:
                    pass
                raise CatVTONOutOfMemoryError("CUDA out of memory during CatVTON diffusion execution.") from exc

            logger.error(
                f"CatVTON inference failed: {str(exc)}",
                exc_info=True,
                extra={"event": "catvton.inference.failed", "duration_ms": duration_ms},
            )
            raise CatVTONInferenceError(f"CatVTON inference execution failed: {str(exc)}") from exc

        finally:
            self.runtime.semaphore.release()


# Factory helpers
def get_catvton_pipeline(mock: bool = False) -> CatVTONPipeline:
    return CatVTONPipeline(mock_mode=mock)


__all__ = ["CatVTONPipeline", "get_catvton_pipeline"]
