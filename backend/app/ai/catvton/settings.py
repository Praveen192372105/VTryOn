from app.core.config import CatVTONSettings, settings

# Canonical singleton AI settings derived from centralized Settings
ai_settings: CatVTONSettings = settings.catvton

__all__ = ["CatVTONSettings", "ai_settings"]
