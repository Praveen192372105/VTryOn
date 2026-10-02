"""
Environment & Automation Framework Configuration.
Ensures BASE_URL points strictly to the LIVE deployment (GitHub Pages).
Enforces that localhost / 127.0.0.1 is NEVER permitted.
"""

import os
import sys
from pathlib import Path

# Base Paths
AUTOMATION_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = AUTOMATION_ROOT.parent

# Output Directories
REPORTS_DIR = PROJECT_ROOT / "Test Results"
EXCEL_REPORTS_DIR = REPORTS_DIR / "Excel"
HTML_REPORTS_DIR = REPORTS_DIR / "HTML"
SCREENSHOTS_DIR = REPORTS_DIR / "Screenshots"
LOGS_DIR = REPORTS_DIR / "Logs"
JSON_REPORTS_DIR = REPORTS_DIR / "JSON"
SUMMARY_DIR = REPORTS_DIR / "Summary"

# Local automation cache directories
LOCAL_SCREENSHOTS_DIR = AUTOMATION_ROOT / "screenshots"
LOCAL_LOGS_DIR = AUTOMATION_ROOT / "logs"
LOCAL_REPORTS_DIR = AUTOMATION_ROOT / "reports"

# Ensure all directories exist
for directory in [
    REPORTS_DIR,
    EXCEL_REPORTS_DIR,
    HTML_REPORTS_DIR,
    SCREENSHOTS_DIR,
    LOGS_DIR,
    JSON_REPORTS_DIR,
    SUMMARY_DIR,
    LOCAL_SCREENSHOTS_DIR,
    LOCAL_LOGS_DIR,
    LOCAL_REPORTS_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)

# LIVE GitHub Pages Deployment URL Configuration
# Default target is the production GitHub Pages URL
DEFAULT_LIVE_URL = "https://eswarchinthakayala-fullstack.github.io/VTryOn/"
BASE_URL = os.getenv("BASE_URL", DEFAULT_LIVE_URL).strip()

# Ensure trailing slash for clean path concatenation
if not BASE_URL.endswith("/"):
    BASE_URL += "/"

# STRICT VALIDATION: Never run against localhost or local dev servers!
DISALLOWED_PATTERNS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"]
ALLOW_LOCAL_OVERRIDE = os.getenv("ALLOW_LOCAL_SELENIUM", "false").lower() == "true"

if not ALLOW_LOCAL_OVERRIDE and any(pattern in BASE_URL.lower() for pattern in DISALLOWED_PATTERNS):
    raise ValueError(
        f"[CRITICAL ERROR] BASE_URL is set to '{BASE_URL}'. "
        "Strict Requirement: Selenium tests MUST NEVER run against localhost or local development servers! "
        "Tests must run against the LIVE GitHub Pages deployment. "
        f"Expected deployment URL: {DEFAULT_LIVE_URL}"
    )

# Browser Configuration
BROWSER_TYPE = os.getenv("BROWSER", "chrome").lower()
HEADLESS_MODE = os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes")
WINDOW_WIDTH = int(os.getenv("WINDOW_WIDTH", "1920"))
WINDOW_HEIGHT = int(os.getenv("WINDOW_HEIGHT", "1080"))

# Timeouts & Retries
DEFAULT_EXPLICIT_WAIT = int(os.getenv("EXPLICIT_WAIT", "15"))
PAGE_LOAD_TIMEOUT = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))
SCRIPT_TIMEOUT = int(os.getenv("SCRIPT_TIMEOUT", "30"))
RETRY_COUNT = int(os.getenv("RETRY_COUNT", "2"))
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "4"))

def get_url(path: str = "") -> str:
    """
    Construct an absolute URL relative to the live deployment BASE_URL.
    Safely handles leading/trailing slashes.
    """
    cleaned_path = path.lstrip("/")
    return f"{BASE_URL}{cleaned_path}"
