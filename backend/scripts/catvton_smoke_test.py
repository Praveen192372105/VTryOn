import argparse
import sys
import time
from pathlib import Path
from PIL import Image

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.catvton.config import ai_settings
from app.ai.catvton.pipeline import CatVTONPipeline
from app.ai.catvton.runtime import CatVTONRuntime
from app.ai.catvton.types import TryOnInput


def parse_args():
    parser = argparse.ArgumentParser(description="CatVTON AI Standalone Inference Smoke Test")
    parser.add_argument("--person", type=str, help="Path to person image")
    parser.add_argument("--garment", type=str, help="Path to garment image")
    parser.add_argument("--category", type=str, default="upper_body", choices=["upper_body", "lower_body", "dresses"])
    parser.add_argument("--steps", type=int, default=None, help="Number of diffusion inference steps")
    parser.add_argument("--output", type=str, default="storage/tmp/catvton_smoke_result.jpg", help="Output path for result image")
    parser.add_argument("--mock", action="store_true", help="Force mock inference pipeline (for testing)")
    return parser.parse_args()


def create_synthetic_sample(path: Path, color: tuple, label: str) -> None:
    img = Image.new("RGB", (768, 1024), color=color)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(path))


def main():
    args = parse_args()
    print("=" * 65)
    print("  CatVTON Standalone AI Inference Smoke Test")
    print("=" * 65)

    # 1. Inspect environment & determine runtime mode
    has_torch = False
    has_cuda = False
    try:
        import torch
        has_torch = True
        has_cuda = torch.cuda.is_available()
    except ImportError:
        pass

    use_mock = args.mock
    mode_str = "MOCK (Synthetic)" if use_mock else ("REAL (CUDA GPU)" if has_cuda else "REAL (CPU Mode)")
    print(f"[*] Environment: PyTorch={has_torch}, CUDA={has_cuda}")
    print(f"[*] Execution Mode: {mode_str}")
    print(f"[*] Configuration: {ai_settings.width}x{ai_settings.height}, precision={ai_settings.dtype}")

    # 2. Materialize inputs
    person_path = Path(args.person) if args.person else Path("storage/tmp/smoke_person.jpg")
    garment_path = Path(args.garment) if args.garment else Path("storage/tmp/smoke_garment.jpg")

    if not person_path.exists():
        print(f"[*] Generating synthetic person test image at: {person_path}")
        create_synthetic_sample(person_path, (210, 180, 160), "PERSON")

    if not garment_path.exists():
        print(f"[*] Generating synthetic garment test image at: {garment_path}")
        create_synthetic_sample(garment_path, (80, 120, 180), "GARMENT")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 3. Model Loading
    runtime = CatVTONRuntime.get_instance()
    t_load_start = time.perf_counter()
    if use_mock:
        runtime.load_once(force_mock=True)
    else:
        print("[*] Loading real CatVTON checkpoints...")
        runtime.load_once(force_mock=False)
    t_load_ms = round((time.perf_counter() - t_load_start) * 1000, 2)
    print(f"[+] Model Runtime State: {runtime.state.value} (load time: {t_load_ms}ms)")

    # 4. Inference Execution
    pipeline = CatVTONPipeline(runtime=runtime, mock_mode=use_mock)
    tryon_input = TryOnInput(
        person_path=person_path,
        garment_path=garment_path,
        garment_category=args.category,
        steps=args.steps,
    )

    print(f"[*] Starting inference for category '{args.category}'...")
    t_infer_start = time.perf_counter()
    output = pipeline.generate(tryon_input)
    t_infer_ms = round((time.perf_counter() - t_infer_start) * 1000, 2)

    # 5. Save and report
    output.image.save(str(output_path), format="JPEG", quality=95)
    file_size_bytes = output_path.stat().st_size

    print(f"[+] Virtual try-on generation succeeded!")
    print(f"    - Output Path:       {output_path.resolve()}")
    print(f"    - Resolution:        {output.width}x{output.height}")
    print(f"    - File Size:         {file_size_bytes} bytes")
    print(f"    - Inference Duration: {t_infer_ms}ms")
    print("=" * 65)
    return 0


if __name__ == "__main__":
    sys.exit(main())
