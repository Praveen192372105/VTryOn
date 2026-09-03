import os
from app.ai.catvton.settings import CatVTONSettings, ai_settings

# Disable Windows symlinks for huggingface_hub to avoid [WinError 1314]
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

__all__ = ["CatVTONSettings", "ai_settings"]

