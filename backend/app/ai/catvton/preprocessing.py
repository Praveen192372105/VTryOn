"""
Preprocessing pipeline for CatVTON: AutoMasker (DensePose + SCHP),
agnostic mask generation, image resizing, and content-addressed mask caching.
"""

import hashlib
import logging
import os
import sys
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image

from app.ai.catvton.exceptions import CatVTONInputError, CatVTONPreprocessingError
from app.ai.catvton.settings import CatVTONSettings

logger = logging.getLogger("vtryon.catvton.preprocessing")

# Category translation from V Try-On canonical enum to CatVTON cloth_type
CATEGORY_MAP = {
    "upper_body": "upper",
    "upper": "upper",
    "lower_body": "lower",
    "lower": "lower",
    "dresses": "overall",
    "dress": "overall",
    "overall": "overall",
    "inner": "inner",
    "outer": "outer",
}


class CatVTONPreprocessor:
    """
    Manages long-lived AutoMasker (DensePose + SCHP) models and provides
    fast in-memory preprocessing with optional disk caching.
    """

    def __init__(self, settings: CatVTONSettings, repo_path: str):
        self.settings = settings
        self.repo_path = repo_path
        self._automasker = None
        self._mask_processor = None
        self._cache_dir = settings.catvton_root.parent / "media" / "cache" / "catvton" / "masks"
        if self.settings.cache_preprocessing:
            self._cache_dir.mkdir(parents=True, exist_ok=True)

    def _ensure_automasker_loaded(self):
        """Initializes AutoMasker once within the worker process."""
        if self._automasker is not None:
            return

        # Ensure CatVTON root is on sys.path
        catvton_path = str(self.settings.catvton_root)
        if catvton_path not in sys.path:
            sys.path.insert(0, catvton_path)

        try:
            from model.cloth_masker import AutoMasker
            from diffusers.image_processor import VaeImageProcessor

            logger.info("Initializing persistent AutoMasker (DensePose + SCHP)...")
            densepose_ckpt = os.path.join(self.repo_path, "DensePose")
            schp_ckpt = os.path.join(self.repo_path, "SCHP")

            self._automasker = AutoMasker(
                densepose_ckpt=densepose_ckpt,
                schp_ckpt=schp_ckpt,
                device=self.settings.automasker_device,
            )
            self._mask_processor = VaeImageProcessor(
                vae_scale_factor=8,
                do_normalize=False,
                do_binarize=True,
                do_convert_grayscale=True,
            )
            logger.info("AutoMasker (DensePose + SCHP) successfully loaded into memory.")
        except Exception as exc:
            raise CatVTONPreprocessingError(f"Failed to load AutoMasker models: {exc}") from exc

    def _compute_cache_key(self, person_bytes: bytes, cloth_type: str, width: int, height: int) -> str:
        h = hashlib.sha256()
        h.update(person_bytes)
        h.update(cloth_type.encode("utf-8"))
        h.update(f"{width}x{height}_v1".encode("utf-8"))
        return h.hexdigest()

    def process(
        self,
        person_path: Path,
        garment_path: Path,
        category: str,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None,
    ) -> Tuple[Image.Image, Image.Image, Image.Image]:
        """
        Preprocesses person, garment, and generates or retrieves cached agnostic mask.
        Returns: (person_image, garment_image, mask_image) all at target resolution.
        """
        if not person_path.exists():
            raise CatVTONInputError(f"Person image file missing: {person_path}")
        if not garment_path.exists():
            raise CatVTONInputError(f"Garment image file missing: {garment_path}")

        target_w = target_width or self.settings.width
        target_h = target_height or self.settings.height
        cloth_type = CATEGORY_MAP.get(category.lower(), "upper")

        # Load images
        try:
            person_img = Image.open(person_path).convert("RGB")
            garment_img = Image.open(garment_path).convert("RGB")
        except Exception as exc:
            raise CatVTONInputError(f"Failed to read input images: {exc}") from exc

        # CatVTON geometry resizing
        catvton_path = str(self.settings.catvton_root)
        if catvton_path not in sys.path:
            sys.path.insert(0, catvton_path)
        from utils import resize_and_crop, resize_and_padding

        person_resized = resize_and_crop(person_img, (target_w, target_h))
        garment_resized = resize_and_padding(garment_img, (target_w, target_h))

        # Check mask cache
        mask_img = None
        cache_file = None
        if self.settings.cache_preprocessing:
            with open(person_path, "rb") as f:
                p_bytes = f.read()
            cache_key = self._compute_cache_key(p_bytes, cloth_type, target_w, target_h)
            cache_file = self._cache_dir / f"{cache_key}.png"
            if cache_file.exists():
                try:
                    mask_img = Image.open(cache_file).convert("L")
                    logger.info(f"Using cached agnostic mask for person hash [{cache_key[:12]}]")
                except Exception:
                    mask_img = None

        if mask_img is None:
            self._ensure_automasker_loaded()
            try:
                raw_mask = self._automasker(person_resized, cloth_type)["mask"]
                mask_img = self._mask_processor.blur(raw_mask, blur_factor=9)
                
                # Persist to cache
                if cache_file is not None:
                    try:
                        mask_img.save(cache_file, format="PNG")
                    except Exception as cache_exc:
                        logger.warning(f"Failed to save mask cache: {cache_exc}")
            except Exception as exc:
                raise CatVTONPreprocessingError(f"AutoMasker failed: {exc}") from exc

        return person_resized, garment_resized, mask_img
