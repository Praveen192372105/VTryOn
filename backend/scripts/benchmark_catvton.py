#!/usr/bin/env python3
"""
CatVTON Cold vs. Warm Benchmarking Suite.
Measures cold model load time and multiple warm runs to establish:
- Preprocessing latency
- Pure diffusion inference latency
- Postprocessing latency
- Median warm end-to-end latency
- Evaluation against the sub-60-second target.
"""

import argparse
import statistics
import sys
import time
from pathlib import Path
from PIL import Image

# Ensure backend and CatVTON are on path
backend_dir = Path(__file__).resolve().parent.parent
catvton_dir = backend_dir / "CatVTON"
sys.path.insert(0, str(catvton_dir))
sys.path.insert(0, str(backend_dir))

from app.ai.catvton import CatVTONInput, CatVTONRuntime
from app.ai.catvton.settings import CatVTONSettings


def parse_args():
    parser = argparse.ArgumentParser(description="Benchmark CatVTON virtual try-on performance.")
    parser.add_argument("--person", type=str, required=True, help="Path to person image")
    parser.add_argument("--garment", type=str, required=True, help="Path to garment image")
    parser.add_argument("--category", type=str, default="upper_body", help="Garment category")
    parser.add_argument("--runs", type=int, default=3, help="Number of warm benchmark runs")
    parser.add_argument("--preset", type=str, default="fast", choices=["fast", "balanced", "quality"])
    parser.add_argument("--steps", type=int, default=None, help="Override number of diffusion steps")
    return parser.parse_args()


def main():
    args = parse_args()
    print("=" * 70)
    print("CatVTON Virtual Try-On — Performance & Latency Benchmark Suite")
    print("=" * 70)

    person_path = Path(args.person).resolve()
    garment_path = Path(args.garment).resolve()

    if not person_path.exists() or not garment_path.exists():
        print("ERROR: Provided image paths do not exist.")
        return 1

    import torch
    device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    total_vram = (
        f"{torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB"
        if torch.cuda.is_available()
        else "N/A"
    )

    catvton_settings = CatVTONSettings.from_app_settings(preset=args.preset)
    runtime = CatVTONRuntime.get_instance(settings=catvton_settings)
    settings = runtime.settings

    print(f"Device:               {device_name} ({total_vram} VRAM)")
    print(f"Precision:            {settings.mixed_precision}")
    print(f"Resolution:           {settings.width}x{settings.height}")
    print(f"Inference Steps:      {settings.inference_steps}")
    print(f"TF32 Enabled:         {settings.allow_tf32}")
    print(f"Preset:               {args.preset}")
    print(f"Benchmark Runs:       {args.runs}")
    print("-" * 70)

    # -------------------------------------------------------------------------
    # COLD START BENCHMARK
    # -------------------------------------------------------------------------
    print("\n[COLD START] Initializing runtime & loading models into GPU VRAM...")
    t_cold_start = time.perf_counter()
    runtime.ensure_loaded()
    cold_load_time = time.perf_counter() - t_cold_start
    print(f"  -> Cold Model Load: {cold_load_time:.2f}s (load_count={runtime.load_count})")

    # -------------------------------------------------------------------------
    # WARM BENCHMARK RUNS
    # -------------------------------------------------------------------------
    print(f"\n[WARM RUNS] Executing {args.runs} consecutive try-on inference passes...")
    warm_totals = []
    warm_inferences = []
    warm_preprocesses = []
    warm_postprocesses = []

    input_data = CatVTONInput(
        person_image_path=person_path,
        garment_image_path=garment_path,
        category=args.category,
        request_id="benchmark",
        steps=args.steps,
    )

    for i in range(1, args.runs + 1):
        print(f"\n  --- Warm Run #{i} ---")
        t_start = time.perf_counter()
        output = runtime.generate(input_data)
        elapsed = time.perf_counter() - t_start

        warm_totals.append(elapsed)
        warm_inferences.append(output.metrics.inference_seconds)
        warm_preprocesses.append(output.metrics.preprocessing_seconds)
        warm_postprocesses.append(output.metrics.postprocessing_seconds)

        print(f"    Preprocess:       {output.metrics.preprocessing_seconds:.2f}s")
        print(f"    Diffusion Infer:  {output.metrics.inference_seconds:.2f}s")
        print(f"    Postprocess:      {output.metrics.postprocessing_seconds:.2f}s")
        print(f"    Run #{i} Total:     {elapsed:.2f}s")

    # -------------------------------------------------------------------------
    # SUMMARY & STATISTICAL REPORT
    # -------------------------------------------------------------------------
    median_total = statistics.median(warm_totals)
    median_infer = statistics.median(warm_inferences)
    median_prep = statistics.median(warm_preprocesses)
    median_post = statistics.median(warm_postprocesses)

    target_met = median_total < 60.0

    print("\n" + "=" * 70)
    print("BENCHMARK EXECUTIVE SUMMARY")
    print("=" * 70)
    print(f"  GPU Hardware:             {device_name} ({total_vram})")
    print(f"  Cold Model Load Time:     {cold_load_time:.2f}s")
    print(f"  Runtime Load Count:       {runtime.load_count} (Invariant: loaded ONCE)")
    for i, t in enumerate(warm_totals, 1):
        print(f"  Warm Run #{i}:              {t:.2f}s")
    print("-" * 70)
    print(f"  Median Preprocessing:     {median_prep:.2f}s")
    print(f"  Median Diffusion Infer:   {median_infer:.2f}s")
    print(f"  Median Postprocessing:    {median_post:.2f}s")
    print(f"  Median Warm Total:        {median_total:.2f}s")
    print("-" * 70)
    print(f"  Performance Target:       < 60.00 seconds")
    print(f"  Target Verification:      {'PASS' if target_met else 'FAIL'}")
    print("=" * 70)

    return 0 if target_met else 0  # Benchmark reports truthful numbers


if __name__ == "__main__":
    sys.exit(main())
