
import sys
from pathlib import Path
from PIL import Image
import numpy as np
import torch

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir / "CatVTON"))
sys.path.insert(0, str(backend_dir))

from app.ai.catvton.settings import CatVTONSettings
from app.ai.catvton.pipeline import CatVTONInferencePipeline
from app.ai.catvton.preprocessing import CatVTONPreprocessor
from huggingface_hub import snapshot_download

repo_path = snapshot_download("zhengchong/CatVTON")
settings = CatVTONSettings.from_app_settings(preset="fast")

print("Loading pipeline...")
pipe = CatVTONInferencePipeline(settings, repo_path)
pipe.load()

prep = CatVTONPreprocessor(settings, repo_path)
person_path = backend_dir / "storage/people/usr_01m1k83ph03m4xp2dqp4mgk7pm/upl_01m1rn6scn114xx225rrnw4gds.jpg"
garment_path = backend_dir / "storage/outfits/samples/garment_navy_oxford_shirt.jpg"

p, g, m = prep.process(person_path, garment_path, "upper_body")

pipeline = pipe._pipeline

# Let's inspect step by step
print(f"VAE dtype: {pipeline.vae.dtype}, device: {pipeline.vae.device}")
print(f"UNet dtype: {pipeline.unet.dtype}, device: {pipeline.unet.device}")

# Let's run a test with 5 steps and print stats of latents and noise_pred
orig_step = pipeline.noise_scheduler.step

def debug_step(model_output, timestep, sample, **kwargs):
    print(f"Timestep {timestep}:")
    print(f"  sample: min={sample.min().item():.3f}, max={sample.max().item():.3f}, mean={sample.mean().item():.3f}")
    print(f"  model_output (noise_pred): min={model_output.min().item():.3f}, max={model_output.max().item():.3f}, mean={model_output.mean().item():.3f}")
    res = orig_step(model_output, timestep, sample, **kwargs)
    print(f"  prev_sample: min={res.prev_sample.min().item():.3f}, max={res.prev_sample.max().item():.3f}, mean={res.prev_sample.mean().item():.3f}")
    return res

pipeline.noise_scheduler.step = debug_step

print("\nRunning 5-step test...")
raw_result = pipeline(
    image=p,
    condition_image=g,
    mask=m,
    num_inference_steps=5,
    width=settings.width,
    height=settings.height,
)[0]

raw_np = np.array(raw_result)
print(f"\nFinal raw result: min={raw_np.min()}, max={raw_np.max()}, mean={raw_np.mean():.2f}")
print(f"Unique values in raw result: {len(np.unique(raw_np))}")
raw_result.save(backend_dir / "storage/temp/debug_5_raw.jpg")
