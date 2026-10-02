"""
PyTorch / Diffusers inference wrapper for CatVTON diffusion pipeline.
Optimized for low VRAM, mixed precision, and sub-60-second execution.
"""

import logging
import sys
import time
from typing import Optional
from PIL import Image
import torch

from app.ai.catvton.exceptions import CatVTONInferenceError, CatVTONOOMError
from app.ai.catvton.settings import CatVTONSettings

logger = logging.getLogger("vtryon.catvton.pipeline")


class CatVTONInferencePipeline:
    """
    Manages the UNet, VAE, DDIM scheduler, and attention adapter.
    Keeps weights resident on GPU to avoid per-job reloads.
    """

    def __init__(self, settings: CatVTONSettings, repo_path: str):
        self.settings = settings
        self.repo_path = repo_path
        self._pipeline = None
        if settings.device == "cpu" or settings.mixed_precision in ("fp32", "no"):
            self._weight_dtype = torch.float32
        elif settings.mixed_precision == "fp16":
            self._weight_dtype = torch.float16
        else:
            self._weight_dtype = torch.bfloat16

    def load(self):
        """Initializes and loads the diffusion pipeline once."""
        if self._pipeline is not None:
            return

        catvton_path = str(self.settings.catvton_root)
        if catvton_path not in sys.path:
            sys.path.insert(0, catvton_path)

        from model.pipeline import CatVTONPipeline

        logger.info(
            f"Loading CatVTON pipeline [device={self.settings.device}, dtype={self._weight_dtype}, tf32={self.settings.allow_tf32}]..."
        )
        base_path = self.settings.base_model_path
        try:
            from huggingface_hub import snapshot_download
            base_path = snapshot_download(
                self.settings.base_model_path,
                allow_patterns=["scheduler/*", "unet/*"],
            )
        except Exception:
            pass

        try:
            self._pipeline = CatVTONPipeline(
                base_ckpt=base_path,
                attn_ckpt=self.repo_path,
                attn_ckpt_version=self.settings.attn_ckpt_version,
                weight_dtype=self._weight_dtype,
                use_tf32=self.settings.allow_tf32,
                device=self.settings.device,
                skip_safety_check=True,
            )
            logger.info("CatVTON diffusion pipeline loaded successfully into GPU memory.")
        except torch.cuda.OutOfMemoryError as oom:
            torch.cuda.empty_cache()
            raise CatVTONOOMError(f"CUDA OOM while loading CatVTON pipeline: {oom}") from oom
        except Exception as exc:
            raise CatVTONInferenceError(f"Failed to initialize CatVTONPipeline: {exc}") from exc

    def generate(
        self,
        person_image: Image.Image,
        garment_image: Image.Image,
        mask_image: Image.Image,
        num_inference_steps: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        seed: Optional[int] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
    ) -> Image.Image:
        """
        Executes diffusion try-on generation under torch.inference_mode().
        """
        if self._pipeline is None:
            self.load()

        steps = num_inference_steps or self.settings.inference_steps
        guidance = guidance_scale or self.settings.guidance_scale
        target_w = width or self.settings.width
        target_h = height or self.settings.height

        generator = None
        if seed is not None and seed != -1:
            generator = torch.Generator(device=self.settings.device).manual_seed(seed)

        try:
            with torch.inference_mode():
                result = self._pipeline(
                    image=person_image,
                    condition_image=garment_image,
                    mask=mask_image,
                    num_inference_steps=steps,
                    guidance_scale=guidance,
                    generator=generator,
                    width=target_w,
                    height=target_h,
                )[0]
                return result
        except torch.cuda.OutOfMemoryError as oom_exc:
            logger.error("CUDA Out of Memory during CatVTON inference! Clearing cache.")
            torch.cuda.empty_cache()
            raise CatVTONOOMError(f"CUDA OOM during diffusion inference: {oom_exc}") from oom_exc
        except Exception as exc:
            raise CatVTONInferenceError(f"CatVTON diffusion inference failed: {exc}") from exc
