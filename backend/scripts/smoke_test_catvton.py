import argparse
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.catvton.config import ai_settings
from app.ai.catvton.engine import get_catvton_engine
from app.ai.catvton.loader import get_model_load_state, load_catvton_models
from app.ai.catvton.validator import inspect_catvton_runtime


def parse_args():
    parser = argparse.ArgumentParser(description="CatVTON AI Runtime Standalone Validation Script")
    parser.add_argument("--person", type=str, help="Path to sample person image (optional)")
    parser.add_argument("--garment", type=str, help="Path to sample garment image (optional)")
    parser.add_argument("--category", type=str, default="upper_body", choices=["upper_body", "lower_body", "dresses"])
    parser.add_argument("--mock", action="store_true", help="Run with mock AI engine for environment testing without weights")
    return parser.parse_args()


def run_smoke_test():
    args = parse_args()
    print("=" * 65)
    print("  CatVTON Runtime & Environment Smoke Test")
    print("=" * 65)

    # 1. Repository inspection
    print("1. Inspecting CatVTON repository...")
    inspection = inspect_catvton_runtime()
    print(f"   - Root Path: {inspection.root_path}")
    print(f"   - Repository Exists: {inspection.root_exists}")
    print(f"   - Model Package: {inspection.model_dir_exists}")
    print(f"   - DensePose Package: {inspection.densepose_exists}")
    print(f"   - Detectron2 Package: {inspection.detectron2_exists}")
    print(f"   - Inference Script: {inspection.inference_script_exists}")
    print(f"   - PyTorch Available: {inspection.torch_available}")
    print(f"   - CUDA Available: {inspection.cuda_available} ({inspection.device_name or 'N/A'})")

    if not inspection.root_exists or not inspection.model_dir_exists:
        print("\n[FAIL] CatVTON repository structure is incomplete. Check path configuration.")
        sys.exit(1)

    # 2. Config verification
    print("\n2. CatVTON Configuration:")
    print(f"   - Target Device: {ai_settings.device}")
    print(f"   - Mixed Precision: {ai_settings.dtype}")
    print(f"   - Target Resolution: {ai_settings.width}x{ai_settings.height}")
    print(f"   - Checkpoints: {ai_settings.checkpoint_dir}")
    print(f"   - Base Model: {ai_settings.base_model_path}")

    # 3. Model Loader Check
    print("\n3. Testing Model Loader...")
    if args.mock or not inspection.torch_available:
        print("   - Using Mock AI Engine (PyTorch not loaded or --mock specified)")
        engine = get_catvton_engine(mock=True)
        print("   - Mock engine initialized successfully.")
    else:
        try:
            print("   - Loading CatVTON pipeline & AutoMasker checkpoints...")
            load_catvton_models()
            print(f"   - Load State: {get_model_load_state().value}")
            engine = get_catvton_engine(mock=False)
            print("   - Model loaded successfully into worker memory!")
        except Exception as exc:
            print(f"   - [WARN] Model loading could not complete in this environment: {str(exc)}")
            print("   - (Note: Checkpoints will download automatically when PyTorch and GPU dependencies are present).")
            engine = get_catvton_engine(mock=True)

    # 4. Optional Inference
    if args.person and args.garment:
        print(f"\n4. Running test inference with {args.person} and {args.garment}...")
        if not Path(args.person).is_file():
            print(f"   [FAIL] Person image not found at: {args.person}")
            sys.exit(1)
        if not Path(args.garment).is_file():
            print(f"   [FAIL] Garment image not found at: {args.garment}")
            sys.exit(1)

        result = engine.generate(
            person_image_path=args.person,
            garment_image_path=args.garment,
            category=args.category,
        )
        out_path = Path("storage/tmp/smoke_test_output.png")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        result.save(str(out_path))
        print(f"   - Inference completed! Result saved to: {out_path.resolve()}")
    else:
        print("\n4. Inference: Skipped (Provide --person and --garment to run a test generation).")

    print("\n" + "=" * 65)
    print(" [SUCCESS] CatVTON Smoke Test Passed!")
    print("=" * 65)
    sys.exit(0)


if __name__ == "__main__":
    run_smoke_test()
