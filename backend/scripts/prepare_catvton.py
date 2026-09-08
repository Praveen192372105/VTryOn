#!/usr/bin/env python3
"""
One-time model preparation and checkpoint caching script for CatVTON.
Pre-downloads all necessary weights into the Hugging Face cache so Celery workers
and benchmark scripts never incur cold model download latency during job execution.
"""

import os
import sys
from pathlib import Path

# Add backend and backend/CatVTON to sys.path
backend_dir = Path(__file__).resolve().parent.parent
catvton_dir = backend_dir / "CatVTON"
sys.path.insert(0, str(catvton_dir))
sys.path.insert(0, str(backend_dir))

def main():
    print("=" * 60)
    print("V Try-On Platform — CatVTON Model Preparation")
    print("=" * 60)

    if not catvton_dir.exists():
        print(f"ERROR: CatVTON directory not found at {catvton_dir}")
        print("Please clone https://github.com/Zheng-Chong/CatVTON.git first.")
        return 1

    print(f"CatVTON root verified: {catvton_dir}")

    from huggingface_hub import snapshot_download
    from diffusers import AutoencoderKL, DDIMScheduler, UNet2DConditionModel

    # 1. Download CatVTON weights (attention checkpoints, DensePose, SCHP)
    print("\n[1/3] Downloading/Verifying CatVTON repository weights (zhengchong/CatVTON)...")
    catvton_repo_path = snapshot_download(
        repo_id="zhengchong/CatVTON",
        resume_download=True,
    )
    print(f"  -> CatVTON snapshot verified at: {catvton_repo_path}")

    densepose_dir = os.path.join(catvton_repo_path, "DensePose")
    schp_dir = os.path.join(catvton_repo_path, "SCHP")
    assert os.path.exists(densepose_dir), f"DensePose directory missing: {densepose_dir}"
    assert os.path.exists(schp_dir), f"SCHP directory missing: {schp_dir}"
    print("  -> DensePose and SCHP weights verified.")

    # 2. Download Base Stable Diffusion Inpainting UNet and Scheduler
    print("\n[2/3] Downloading/Verifying base inpainting UNet & Scheduler (booksforcharlie/stable-diffusion-inpainting)...")
    base_model_path = "booksforcharlie/stable-diffusion-inpainting"
    DDIMScheduler.from_pretrained(base_model_path, subfolder="scheduler")
    UNet2DConditionModel.from_pretrained(base_model_path, subfolder="unet")
    print("  -> UNet and DDIMScheduler verified.")

    # 3. Download VAE
    print("\n[3/3] Downloading/Verifying VAE (stabilityai/sd-vae-ft-mse)...")
    AutoencoderKL.from_pretrained("stabilityai/sd-vae-ft-mse")
    print("  -> VAE verified.")

    print("\n" + "=" * 60)
    print("SUCCESS: All CatVTON checkpoints and base models are cached locally.")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
