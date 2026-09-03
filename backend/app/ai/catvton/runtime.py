import logging
import os
import sys
import threading
from typing import Any, Optional, Tuple

from app.ai.catvton.config import ai_settings
from app.ai.catvton.exceptions import (
    CatVTONModelLoadError,
    CatVTONModelUnavailableError,
)
from app.ai.catvton.types import RuntimeState

logger = logging.getLogger("vtryon.ai.runtime")


class CatVTONRuntime:
    """
    Dedicated GPU worker runtime managing CatVTON model lifecycle.
    Ensures process-level singleton persistence, single-instance checkpoint reuse,
    concurrency control, and thread-safe readiness tracking.
    """

    _instance: Optional["CatVTONRuntime"] = None
    _lock = threading.Lock()

    def __init__(self):
        self._state: RuntimeState = RuntimeState.NOT_LOADED
        self._pipeline_instance: Optional[Any] = None
        self._automasker_instance: Optional[Any] = None
        self._mask_processor_instance: Optional[Any] = None
        self._semaphore = threading.Semaphore(1)
        self._last_error: Optional[str] = None
        self._load_count: int = 0

    @classmethod
    def get_instance(cls) -> "CatVTONRuntime":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    @property
    def state(self) -> RuntimeState:
        return self._state

    @property
    def is_ready(self) -> bool:
        return self._state == RuntimeState.READY and self._pipeline_instance is not None

    @property
    def load_count(self) -> int:
        return self._load_count

    @property
    def semaphore(self) -> threading.Semaphore:
        return self._semaphore

    @property
    def components(self) -> Tuple[Any, Any, Any]:
        """Return loaded (pipeline, automasker, mask_processor)."""
        if not self.is_ready:
            raise CatVTONModelUnavailableError(
                f"CatVTON runtime is not ready (current state: {self._state.value}). Call load_once() first."
            )
        return self._pipeline_instance, self._automasker_instance, self._mask_processor_instance

    def load_once(self, force_mock: bool = False) -> None:
        """
        Idempotently load CatVTON checkpoints and pipeline into GPU memory.
        Subsequent invocations are safe no-ops.
        """
        with self._lock:
            if self._state == RuntimeState.READY and self._pipeline_instance is not None:
                logger.debug("CatVTON runtime is already READY. load_once() is a no-op.")
                return

            self._state = RuntimeState.LOADING
            logger.info("Initializing CatVTON runtime in GPU worker process...", extra={"event": "catvton.runtime.loading"})

            try:
                if force_mock:
                    # Explicit mock mode for tests
                    self._pipeline_instance = "MOCK_PIPELINE"
                    self._automasker_instance = "MOCK_AUTOMASKER"
                    self._mask_processor_instance = "MOCK_PROCESSOR"
                    self._load_count += 1
                    self._state = RuntimeState.READY
                    return

                # Verify local repository path
                catvton_path = str(ai_settings.root_path)
                if not os.path.exists(catvton_path):
                    raise CatVTONModelLoadError(f"CatVTON repository root '{catvton_path}' does not exist.")
                if catvton_path not in sys.path:
                    sys.path.insert(0, catvton_path)

                # Import PyTorch and CatVTON ML modules
                try:
                    import torch
                    from diffusers.image_processor import VaeImageProcessor
                    from huggingface_hub import snapshot_download
                except ImportError as exc:
                    raise CatVTONModelLoadError(f"Required PyTorch or HuggingFace ML dependency missing: {str(exc)}") from exc

                try:
                    from model.cloth_masker import AutoMasker
                    from model.pipeline import CatVTONPipeline
                    from utils import init_weight_dtype
                except ImportError as exc:
                    raise CatVTONModelLoadError(f"Failed to import internal CatVTON modules: {str(exc)}") from exc

                # Device and precision resolution
                device = ai_settings.device if torch.cuda.is_available() and ai_settings.device == "cuda" else "cpu"
                dtype_str = ai_settings.dtype if device == "cuda" else "no"

                logger.info(
                    f"CatVTON hardware: device={device}, dtype={dtype_str}, allow_tf32={ai_settings.allow_tf32}",
                    extra={"event": "catvton.runtime.hardware", "device": device, "dtype": dtype_str},
                )

                # Resolve checkpoints
                logger.info(f"Resolving model checkpoints from: {ai_settings.checkpoint_dir}")
                ignore_patterns = (
                    ["flux-lora/*", "dresscode-16k-512/*", "vitonhd-16k-512/*"]
                    if ai_settings.checkpoint_dir == "zhengchong/CatVTON"
                    else None
                )
                repo_path = snapshot_download(
                    repo_id=ai_settings.checkpoint_dir,
                    ignore_patterns=ignore_patterns,
                )

                # Construct pipeline
                pipeline = CatVTONPipeline(
                    base_ckpt=ai_settings.base_model_path,
                    attn_ckpt=repo_path,
                    attn_ckpt_version="mix",
                    weight_dtype=init_weight_dtype(dtype_str),
                    use_tf32=ai_settings.allow_tf32 and device == "cuda",
                    device=device,
                    skip_safety_check=True,
                )

                # Construct AutoMasker with graceful fallback if densepose/schp encounters CPU limitations
                automasker = None
                try:
                    automasker = AutoMasker(
                        densepose_ckpt=os.path.join(repo_path, "DensePose"),
                        schp_ckpt=os.path.join(repo_path, "SCHP"),
                        device=device,
                    )
                except Exception as am_exc:
                    logger.warning(
                        f"AutoMasker initialization failed ({str(am_exc)}); pipeline will use fallback agnostic mask generator.",
                        extra={"event": "catvton.automasker.fallback", "error": str(am_exc)},
                    )

                mask_processor = VaeImageProcessor(
                    vae_scale_factor=8,
                    do_normalize=False,
                    do_binarize=True,
                    do_convert_grayscale=True,
                )

                self._pipeline_instance = pipeline
                self._automasker_instance = automasker
                self._mask_processor_instance = mask_processor
                self._load_count += 1
                self._state = RuntimeState.READY
                self._last_error = None

                logger.info("CatVTON runtime initialized successfully. State: READY", extra={"event": "catvton.runtime.ready", "device": device})

            except Exception as exc:
                self._state = RuntimeState.FAILED
                self._last_error = str(exc)
                logger.error(
                    f"CatVTON runtime initialization failed: {str(exc)}",
                    exc_info=True,
                    extra={"event": "catvton.runtime.failed"},
                )
                if isinstance(exc, CatVTONModelLoadError):
                    raise
                raise CatVTONModelLoadError(f"CatVTON runtime load failed: {str(exc)}") from exc

    def reset_for_testing(self) -> None:
        """Reset singleton state for isolated testing."""
        with self._lock:
            self._state = RuntimeState.NOT_LOADED
            self._pipeline_instance = None
            self._automasker_instance = None
            self._mask_processor_instance = None
            self._last_error = None
            self._load_count = 0


def get_catvton_runtime() -> CatVTONRuntime:
    return CatVTONRuntime.get_instance()


__all__ = ["CatVTONRuntime", "get_catvton_runtime", "RuntimeState"]
