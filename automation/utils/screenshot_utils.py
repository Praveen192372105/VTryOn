"""
Screenshot Utility for Capturing Visual Evidence.
Saves screenshots to Test Results/Screenshots/ and returns the file path.
"""

from datetime import datetime
from pathlib import Path
from selenium.webdriver.remote.webdriver import WebDriver
from automation.config.env_config import SCREENSHOTS_DIR, LOCAL_SCREENSHOTS_DIR
from automation.utils.logger import log

def capture_screenshot(driver: WebDriver, test_id: str, status: str = "FAILURE") -> str:
    """
    Capture screenshot and save to both reports and local screenshots directory.
    Returns the relative path for report linking.
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sanitized_id = test_id.replace("/", "_").replace(" ", "_")
        filename = f"{sanitized_id}_{timestamp}_{status.upper()}.png"
        
        target_path = SCREENSHOTS_DIR / filename
        local_path = LOCAL_SCREENSHOTS_DIR / filename

        # Selenium screenshot save
        driver.save_screenshot(str(target_path))
        
        # Mirror to local directory if distinct
        try:
            with open(target_path, "rb") as src, open(local_path, "wb") as dst:
                dst.write(src.read())
        except Exception:
            pass

        log.info(f"📸 Screenshot saved: {target_path.name}")
        return str(target_path)
    except Exception as e:
        log.error(f"Failed to capture screenshot for {test_id}: {e}")
        return ""
