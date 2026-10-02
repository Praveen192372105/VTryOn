"""Pages package initialization."""
from .base_page import BasePage
from .landing_page import LandingPage
from .login_page import LoginPage
from .register_page import RegisterPage
from .studio_page import StudioPage
from .outfits_page import OutfitsPage
from .uploads_page import UploadsPage
from .settings_page import SettingsPage

__all__ = [
    "BasePage",
    "LandingPage",
    "LoginPage",
    "RegisterPage",
    "StudioPage",
    "OutfitsPage",
    "UploadsPage",
    "SettingsPage",
]
