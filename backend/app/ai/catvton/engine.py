import io
import logging
import time
from typing import Optional
from PIL import Image

from app.ai.catvton.config import ai_settings
from app.ai.catvton.exceptions import (
    CatVTONInferenceError,
    CatVTONModelLoadError,
    CatVTONOOMError,
)
from app.ai.catvton.loader import load_catvton_models
from app.ai.catvton.preprocessing import prepare_images

logger = logging.getLogger("vtryon.ai.engine")


class CatVTONEngine:
    """
    High-level integration wrapper for the CatVTON Virtual Try-On Pipeline.
    Isolates tensor operations, CUDA OOM recovery, and mask synthesis.
    """

    def __init__(self, mock_mode: bool = False):
        self.mock_mode = mock_mode

    def generate(
        self,
        person_image_path: str,
        garment_image_path: str,
        category: str = "upper_body",
        steps: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        seed: Optional[int] = 555,
    ) -> Image.Image:
        """
        Execute virtual try-on inference.
        Returns a PIL Image containing the synthesized person in the garment.
        """
        start_time = time.perf_counter()
        logger.info(
            "catvton.inference.started",
            extra={
                "event": "catvton.inference.started",
                "category": category,
                "steps": steps or ai_settings.inference_steps,
            },
        )

        if self.mock_mode:
            # Used in unit tests or environments without GPU/weights
            time.sleep(0.1)
            person_img, _ = prepare_images(
                person_image_path,
                garment_image_path,
                ai_settings.width,
                ai_settings.height,
            )
            return person_img

        try:
            import torch
            pipeline, automasker, mask_processor = load_catvton_models()

            # Preprocess inputs
            person_img, garment_img = prepare_images(
                person_image_path,
                garment_image_path,
                ai_settings.width,
                ai_settings.height,
            )

            # Generate agnostic mask automatically using SCHP & DensePose
            mask = automasker(person_img, category)["mask"]
            mask = mask_processor.blur(mask, blur_factor=9)

            # Generator seed
            generator = None
            if seed is not None and seed != -1:
                generator = torch.Generator(device=pipeline.device).manual_seed(seed)

            # Run diffusion pipeline
            num_steps = steps or ai_settings.inference_steps
            guidance = guidance_scale or ai_settings.guidance_scale

            result_images = pipeline(
                image=person_img,
                condition_image=garment_img,
                mask=mask,
                num_inference_steps=num_steps,
                guidance_scale=guidance,
                generator=generator,
            )

            result_img = result_images[0]
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info(
                "catvton.inference.completed",
                extra={
                    "event": "catvton.inference.completed",
                    "duration_ms": duration_ms,
                },
            )
            return result_img

        except CatVTONModelLoadError:
            raise
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            exc_str = str(exc).lower()

            # Detect CUDA Out of Memory
            if "out of memory" in exc_str or "cuda error: out of memory" in exc_str:
                logger.error(
                    "catvton.inference.oom",
                    extra={"event": "catvton.inference.failed", "error": "CUDA OOM", "duration_ms": duration_ms},
                )
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except Exception:
                    pass
                raise CatVTONOOMError()

            logger.error(
                f"catvton.inference.failed: {str(exc)}",
                exc_info=True,
                extra={"event": "catvton.inference.failed", "duration_ms": duration_ms},
            )
            raise CatVTONInferenceError(f"CatVTON inference execution failed: {str(exc)}")


def get_catvton_engine(mock: bool = False) -> CatVTONEngine:
    return CatVTONEngine(mock_mode=mock)
