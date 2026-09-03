import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.catvton.config import ai_settings


def check_mark(status: bool) -> str:
    return "[ OK ]" if status else "[WARN]"


def main():
    print("=" * 65)
    print("  CatVTON AI Subsystem Diagnostics (Doctor)")
    print("=" * 65)

    # 1. CatVTON Root Directory
    root_path = Path(ai_settings.root_path).resolve()
    has_root = root_path.is_dir()
    has_model_pkg = (root_path / "model").is_dir()
    has_densepose_pkg = (root_path / "densepose").is_dir()
    has_detectron2_pkg = (root_path / "detectron2").is_dir()
    has_inference_script = (root_path / "inference.py").is_file()

    print(f"CatVTON Repository Root ...... {check_mark(has_root)}  {root_path}")
    print(f"CatVTON Model Package ........ {check_mark(has_model_pkg)}  model/")
    print(f"CatVTON DensePose ............ {check_mark(has_densepose_pkg)}  densepose/")
    print(f"CatVTON Detectron2 ........... {check_mark(has_detectron2_pkg)}  detectron2/")
    print(f"CatVTON Inference Script ..... {check_mark(has_inference_script)}  inference.py")

    # 2. PyTorch & CUDA Diagnostics
    has_torch = False
    has_cuda = False
    torch_version = "Not installed"
    cuda_device = "N/A"
    try:
        import torch
        has_torch = True
        torch_version = torch.__version__
        has_cuda = torch.cuda.is_available()
        if has_cuda:
            cuda_device = torch.cuda.get_device_name(0)
    except ImportError:
        pass

    print(f"PyTorch Framework ............ {check_mark(has_torch)}  {torch_version}")
    print(f"CUDA Hardware Acceleration ... {check_mark(has_cuda)}  Device: {cuda_device}")

    # 3. Target Model Configuration
    print(f"Target Resolution ............ [ OK ]  {ai_settings.width}x{ai_settings.height}")
    print(f"Target Precision ............. [ OK ]  {ai_settings.dtype}")
    print(f"Checkpoints Source ........... [ OK ]  {ai_settings.checkpoint_dir}")
    print(f"Base Inpainting Model ........ [ OK ]  {ai_settings.base_model_path}")

    print("=" * 65)
    if has_root and has_model_pkg:
        print(">> CatVTON adapter layout is properly wired.")
    else:
        print(">> [FAIL] Missing CatVTON repository files.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
