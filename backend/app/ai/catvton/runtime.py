"""
Persistent, process-local singleton CatVTON runtime for GPU Celery worker.
Maintains model residency in GPU VRAM across consecutive jobs, eliminating per-job reload overhead.
"""

import logging
import threading
import time
from pathlib import Path
from typing import Optional
from PIL import Image
import torch

from huggingface_hub import snapshot_download

from app.ai.catvton.exceptions import (
    CatVTONError,
    CatVTONInferenceError,
    CatVTONLoadError,
    CatVTONOOMError,
)
from app.ai.catvton.pipeline import CatVTONInferencePipeline
from app.ai.catvton.postprocessing import encode_result, repaint_background, validate_result_image
from app.ai.catvton.preprocessing import CatVTONPreprocessor
from app.ai.catvton.settings import CatVTONSettings
from app.ai.catvton.types import (
    CatVTONInput,
    CatVTONMetrics,
    CatVTONOutput,
    RuntimeState,
)

logger = logging.getLogger("vtryon.catvton.runtime")


class CatVTONRuntime:
    """
    Process-local singleton managing CatVTON model lifecycle, AutoMasker,
    warmup, and high-performance inference execution.
    """

    _instance: Optional["CatVTONRuntime"] = None
    _lock = threading.Lock()

    def __init__(self, settings: Optional[CatVTONSettings] = None):
        self.settings = settings or CatVTONSettings.from_app_settings()
        self.state = RuntimeState.NOT_LOADED
        self.load_count = 0
        self._init_lock = threading.Lock()
        self._repo_path: Optional[str] = None
        self._preprocessor: Optional[CatVTONPreprocessor] = None
        self._pipeline: Optional[CatVTONInferencePipeline] = None

    @classmethod
    def get_instance(cls, settings: Optional[CatVTONSettings] = None) -> "CatVTONRuntime":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls(settings)
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """For testing only: resets singleton state."""
        with cls._lock:
            cls._instance = None

    def ensure_loaded(self) -> None:
        """
        Thread-safe idempotent initialization of models and weights.
        Loads checkpoints into GPU memory ONCE.
        """
        if self.state == RuntimeState.READY:
            return

        with self._init_lock:
            if self.state == RuntimeState.READY:
                return

            self.state = RuntimeState.LOADING
            logger.info("Initializing CatVTON runtime in worker process...")
            load_start = time.perf_counter()

            try:
                # 1. Resolve / download snapshot once
                self._repo_path = snapshot_download(
                    repo_id=self.settings.resume_path,
                    resume_download=True,
                )

                # 2. Initialize preprocessor (DensePose + SCHP)
                self._preprocessor = CatVTONPreprocessor(self.settings, self._repo_path)
                self._preprocessor._ensure_automasker_loaded()

                # 3. Initialize diffusion pipeline (UNet, VAE, Scheduler)
                self._pipeline = CatVTONInferencePipeline(self.settings, self._repo_path)
                self._pipeline.load()

                # 4. Optional Warmup
                if self.settings.warmup and torch.cuda.is_available():
                    self._run_warmup()

                self.load_count += 1
                self.state = RuntimeState.READY
                load_duration = time.perf_counter() - load_start
                logger.info(
                    f"CatVTON runtime READY in {load_duration:.2f}s (load_count={self.load_count}, "
                    f"device={self.settings.device}, precision={self.settings.mixed_precision})"
                )

            except Exception as exc:
                self.state = RuntimeState.FAILED
                logger.error(f"Failed to initialize CatVTON runtime: {exc}", exc_info=True)
                raise CatVTONLoadError(f"CatVTON runtime initialization failed: {exc}") from exc

    def _run_warmup(self) -> None:
        """Runs a synthetic warm-up pass to prime CUDA kernels and attention engines."""
        logger.info("Running lightweight CUDA kernel warmup for CatVTON...")
        w_start = time.perf_counter()
        try:
            # Synthetic 256x256 image
            dummy_person = Image.new("RGB", (self.settings.width, self.settings.height), (128, 128, 128))
            dummy_cloth = Image.new("RGB", (self.settings.width, self.settings.height), (200, 200, 200))
            dummy_mask = Image.new("L", (self.settings.width, self.settings.height), 255)
            
            # Single-step inference pass to compile kernels
            self._pipeline.generate(
                person_image=dummy_person,
                garment_image=dummy_cloth,
                mask_image=dummy_mask,
                num_inference_steps=1,
                width=self.settings.width,
                height=self.settings.height,
            )
            logger.info(f"Warmup completed in {time.perf_counter() - w_start:.2f}s.")
        except Exception as w_exc:
            logger.warning(f"Kernel warmup skipped/failed non-fatally: {w_exc}")

    def generate(self, input_data: CatVTONInput) -> CatVTONOutput:
        """
        Executes complete virtual try-on workflow:
        1. Preprocessing (AutoMasker / Agnostic Mask)
        2. Diffusion Inference
        3. Postprocessing & Validation
        """
        self.ensure_loaded()

        start_time = time.perf_counter()
        req_id = input_data.request_id or "local"

        logger.info(
            f"Executing CatVTON inference [req_id={req_id}, category={input_data.category}]",
            extra={"event": "catvton.inference.started", "req_id": req_id},
        )

        try:
            return self._execute_tryon(input_data, start_time, req_id)
        except CatVTONOOMError:
            # Bounded OOM Degradation: If resolution is high, try one fallback pass at fast resolution (576x768)
            if self.settings.width > 576:
                logger.warning(
                    f"CUDA OOM encountered on job {req_id}. Attempting single bounded fallback at 576x768...",
                    extra={"event": "catvton.oom.fallback_attempt", "req_id": req_id},
                )
                torch.cuda.empty_cache()
                return self._execute_tryon(
                    input_data,
                    start_time,
                    req_id,
                    override_width=576,
                    override_height=768,
                    override_steps=20,
                )
            raise

    def _execute_tryon(
        self,
        input_data: CatVTONInput,
        start_time: float,
        req_id: str,
        override_width: Optional[int] = None,
        override_height: Optional[int] = None,
        override_steps: Optional[int] = None,
    ) -> CatVTONOutput:
        # STEP 1: Preprocessing
        p_start = time.perf_counter()
        person_img, garment_img, mask_img = self._preprocessor.process(
            person_path=input_data.person_image_path,
            garment_path=input_data.garment_image_path,
            category=input_data.category,
            target_width=override_width,
            target_height=override_height,
        )
        preprocess_duration = time.perf_counter() - p_start

        # STEP 2: Diffusion Inference
        inf_start = time.perf_counter()
        raw_result = self._pipeline.generate(
            person_image=person_img,
            garment_image=garment_img,
            mask_image=mask_img,
            num_inference_steps=override_steps or input_data.steps,
            width=override_width or self.settings.width,
            height=override_height or self.settings.height,
        )
        inference_duration = time.perf_counter() - inf_start

        # STEP 3: Postprocessing & Background Repainting
        post_start = time.perf_counter()
        if self.settings.repaint:
            final_img = repaint_background(person_img, mask_img, raw_result)
        else:
            final_img = raw_result

        validate_result_image(final_img)
        postprocess_duration = time.perf_counter() - post_start

        total_duration = time.perf_counter() - start_time
        metrics = CatVTONMetrics(
            model_load_seconds=0.0,  # Zero because runtime is warm/resident!
            preprocessing_seconds=round(preprocess_duration, 3),
            inference_seconds=round(inference_duration, 3),
            postprocessing_seconds=round(postprocess_duration, 3),
            total_seconds=round(total_duration, 3),
        )

        # Performance Target Invariant Monitoring
        if total_duration > self.settings.target_latency_seconds:
            logger.warning(
                f"CatVTON job '{req_id}' exceeded latency target: {total_duration:.2f}s > {self.settings.target_latency_seconds}s",
                extra={
                    "event": "catvton_latency_target_missed",
                    "req_id": req_id,
                    "elapsed_seconds": round(total_duration, 2),
                    "target_seconds": self.settings.target_latency_seconds,
                    "metrics": metrics.__dict__,
                },
            )
        else:
            logger.info(
                f"CatVTON job '{req_id}' completed in {total_duration:.2f}s [inference={inference_duration:.2f}s, preprocess={preprocess_duration:.2f}s]",
                extra={"event": "catvton_job_completed", "req_id": req_id, "metrics": metrics.__dict__},
            )

        return CatVTONOutput(
            output_image=final_img,
            width=final_img.width,
            height=final_img.height,
            execution_time_seconds=total_duration,
            metrics=metrics,
        )
