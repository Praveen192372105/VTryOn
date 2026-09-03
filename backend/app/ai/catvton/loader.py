import logging
import os
import sys
from typing import Any, Optional, Tuple

from app.ai.catvton.config import ai_settings
from app.ai.catvton.exceptions import CatVTONConfigurationError, CatVTONModelLoadError, CatVTONRuntimeError
from app.ai.catvton.types import ModelState

logger = logging.getLogger("vtryon.ai.loader")

_pipeline_instance: Optional[Any] = None
_automasker_instance: Optional[Any] = None
_mask_processor_instance: Optional[Any] = None
_load_state: ModelState = ModelState.NOT_LOADED


def _ensure_catvton_in_syspath() -> None:
    catvton_path = str(ai_settings.root_path)
    if not os.path.exists(catvton_path):
        raise CatVTONConfigurationError(f"CatVTON root directory '{catvton_path}' does not exist.")
    if catvton_path not in sys.path:
        sys.path.insert(0, catvton_path)


def get_model_load_state() -> ModelState:
    return _load_state


def load_catvton_models() -> Tuple[Any, Any, Any]:
    """
    Process-level singleton loader for CatVTON Pipeline and AutoMasker.
    Loads checkpoints once per worker process.
    """
    global _pipeline_instance, _automasker_instance, _mask_processor_instance, _load_state

    if _pipeline_instance is not None and _load_state == ModelState.READY:
        return _pipeline_instance, _automasker_instance, _mask_processor_instance

    _load_state = ModelState.LOADING
    logger.info("catvton.model.loading", extra={"event": "catvton.model.loading"})

    try:
        _ensure_catvton_in_syspath()

        try:
            import torch
            from diffusers.image_processor import VaeImageProcessor
            from huggingface_hub import snapshot_download
        except ImportError as exc:
            raise CatVTONRuntimeError(f"Required ML dependency is missing: {str(exc)}")

        try:
            from model.cloth_masker import AutoMasker
            from model.pipeline import CatVTONPipeline
            from utils import init_weight_dtype
        except ImportError as exc:
            raise CatVTONConfigurationError(f"Failed to import CatVTON internal modules: {str(exc)}")

        device = ai_settings.device if torch.cuda.is_available() and ai_settings.device == "cuda" else "cpu"
        dtype_str = ai_settings.dtype if device == "cuda" else "no"

        logger.info(f"Resolving CatVTON checkpoints: {ai_settings.checkpoint_dir}")
        repo_path = snapshot_download(repo_id=ai_settings.checkpoint_dir)

        pipeline = CatVTONPipeline(
            base_ckpt=ai_settings.base_model_path,
            attn_ckpt=repo_path,
            attn_ckpt_version="mix",
            weight_dtype=init_weight_dtype(dtype_str),
            use_tf32=ai_settings.allow_tf32 and device == "cuda",
            device=device,
        )

        automasker = AutoMasker(
            densepose_ckpt=os.path.join(repo_path, "DensePose"),
            schp_ckpt=os.path.join(repo_path, "SCHP"),
            device=device,
        )

        mask_processor = VaeImageProcessor(
            vae_scale_factor=8,
            do_normalize=False,
            do_binarize=True,
            do_convert_grayscale=True,
        )

        _pipeline_instance = pipeline
        _automasker_instance = automasker
        _mask_processor_instance = mask_processor
        _load_state = ModelState.READY

        logger.info("catvton.model.ready", extra={"event": "catvton.model.ready", "device": device})
        return _pipeline_instance, _automasker_instance, _mask_processor_instance

    except (CatVTONConfigurationError, CatVTONRuntimeError):
        _load_state = ModelState.FAILED
        raise
    except Exception as exc:
        _load_state = ModelState.FAILED
        logger.error(
            f"catvton.model.load_failed: {str(exc)}",
            exc_info=True,
            extra={"event": "catvton.model.load_failed"},
        )
        raise CatVTONModelLoadError(f"Failed to load CatVTON model checkpoints: {str(exc)}")


def reset_model_state_for_testing() -> None:
    """Helper for unit tests to reset loader singleton."""
    global _pipeline_instance, _automasker_instance, _mask_processor_instance, _load_state
    _pipeline_instance = None
    _automasker_instance = None
    _mask_processor_instance = None
    _load_state = ModelState.NOT_LOADED
