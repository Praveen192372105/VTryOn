#!/usr/bin/env python3
"""
Standalone Smoke Test for CatVTON Virtual Try-On Engine.
Executes try-on inference on a real person image and garment image.
Measures and reports per-stage latency: model load, preprocessing, inference, postprocessing, total.
"""

import argparse
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
    parser = argparse.ArgumentParser(description="Standalone smoke test for CatVTON engine.")
    parser.add_argument("--person", type=str, required=True, help="Path to person image file")
    parser.add_argument("--garment", type=str, required=True, help="Path to garment image file")
    parser.add_argument("--category", type=str, default="upper_body", help="Garment category: upper_body, lower_body, dresses")
    parser.add_argument("--output", type=str, default="storage/temp/smoke_result.jpg", help="Path to save output image")
    parser.add_argument("--preset", type=str, default="fast", choices=["fast", "balanced", "quality"], help="Performance preset")
    parser.add_argument("--steps", type=int, default=None, help="Override number of diffusion steps")
    return parser.parse_args()


def main():
    args = parse_args()
    print("=" * 65)
    print("CatVTON Virtual Try-On — Standalone Smoke Test")
    print("=" * 65)

    person_path = Path(args.person).resolve()
    garment_path = Path(args.garment).resolve()
    output_path = Path(args.output).resolve()

    if not person_path.exists():
        print(f"ERROR: Person image not found: {person_path}")
        return 1
    if not garment_path.exists():
        print(f"ERROR: Garment image not found: {garment_path}")
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Person Image:     {person_path.name} ({person_path.stat().st_size / 1024:.1f} KB)")
    print(f"Garment Image:    {garment_path.name} ({garment_path.stat().st_size / 1024:.1f} KB)")
    print(f"Category:         {args.category}")
    print(f"Preset:           {args.preset}")
    print(f"Output Path:      {output_path}")
    print("-" * 65)

    # 1. Model Initialization
    print("Initializing CatVTON runtime...")
    t_load_start = time.perf_counter()
    catvton_settings = CatVTONSettings.from_app_settings(preset=args.preset)
    runtime = CatVTONRuntime.get_instance(settings=catvton_settings)
    runtime.ensure_loaded()
    model_load_time = time.perf_counter() - t_load_start
    print(f"Model Load Time:  {model_load_time:.2f}s")

    # 2. Run Try-On
    print("\nExecuting try-on inference pipeline...")
    input_data = CatVTONInput(
        person_image_path=person_path,
        garment_image_path=garment_path,
        category=args.category,
        request_id="smoke_test",
        steps=args.steps,
    )

    t_run_start = time.perf_counter()
    output = runtime.generate(input_data)
    total_run_time = time.perf_counter() - t_run_start

    # 3. Save and Validate Output Image
    t_save_start = time.perf_counter()
    output.output_image.save(output_path, format="JPEG", quality=95)
    storage_time = time.perf_counter() - t_save_start

    # Validate with Pillow
    with Image.open(output_path) as img:
        img.verify()
    with Image.open(output_path) as img:
        w, h = img.size
        mode = img.mode

    print("\n" + "=" * 65)
    print("PERFORMANCE BENCHMARK BREAKDOWN")
    print("=" * 65)
    print(f"  Model Load:             {model_load_time:.2f}s  (one-time cold cost)")
    print(f"  Mask Preprocessing:     {output.metrics.preprocessing_seconds:.2f}s")
    print(f"  Diffusion Inference:    {output.metrics.inference_seconds:.2f}s")
    print(f"  Postprocessing:         {output.metrics.postprocessing_seconds:.2f}s")
    print(f"  Storage Write:          {storage_time:.2f}s")
    print(f"  Warm Execution Total:   {total_run_time:.2f}s")
    print("-" * 65)
    print(f"  Output Resolution:      {w}x{h} (mode: {mode})")
    print(f"  Output File Size:       {output_path.stat().st_size / 1024:.1f} KB")
    print(f"  Target (<60s):          {'PASS' if total_run_time < 60.0 else 'EXCEEDED'}")
    print("=" * 65)
    print(f"SUCCESS: Smoke test result saved to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
