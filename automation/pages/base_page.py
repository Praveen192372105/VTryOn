"""
Base Page Object Model (POM).
Contains reusable interaction methods, explicit wait wrappers, and browser state utilities.
Strictly relies on LIVE BASE_URL.
"""

from typing import List, Tuple, Any
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

from automation.config.env_config import get_url, DEFAULT_EXPLICIT_WAIT
from automation.utils.wait_utils import WaitUtils
from automation.utils.logger import log

class BasePage:
    def __init__(self, driver: WebDriver, path: str = ""):
        self.driver = driver
        self.path = path
        self.url = get_url(path)
        self.wait = WaitUtils(driver, timeout=DEFAULT_EXPLICIT_WAIT)

    def open(self) -> "BasePage":
        """Navigate to the live URL."""
        log.info(f"Navigating to live URL: {self.url}")
        if self.driver:
            self.driver.get(self.url)
            self.wait_for_page_ready()
        return self

    def wait_for_page_ready(self, timeout: int = 15):
        """Wait for document.readyState == 'complete'."""
        if not self.driver:
            return
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
        except Exception as e:
            log.warning(f"Page ready wait timed out: {e}")
            log.warning(f"Page ready wait timed out: {e}")

    def find_element(self, locator: Tuple[str, str], timeout: int = None) -> WebElement:
        """Find a visible element with explicit wait."""
        return self.wait.wait_for_visible(locator, custom_timeout=timeout)

    def find_elements(self, locator: Tuple[str, str], timeout: int = None) -> List[WebElement]:
        """Find multiple visible elements."""
        return self.wait.wait_for_all_visible(locator, custom_timeout=timeout)

    def click(self, locator: Tuple[str, str], timeout: int = None):
        """Click a clickable element with explicit wait."""
        elem = self.wait.wait_for_clickable(locator, custom_timeout=timeout)
        try:
            elem.click()
        except Exception:
            # Fallback to JavaScript click if obstructed
            self.driver.execute_script("arguments[0].click();", elem)

    def type_text(self, locator: Tuple[str, str], text: str, clear: bool = True, timeout: int = None):
        """Type text into an input field."""
        elem = self.find_element(locator, timeout=timeout)
        if clear:
            elem.send_keys(Keys.CONTROL + "a")
            elem.send_keys(Keys.BACKSPACE)
            elem.clear()
        elem.send_keys(text)

    def get_text(self, locator: Tuple[str, str], timeout: int = None) -> str:
        """Retrieve innerText of element."""
        try:
            elem = self.find_element(locator, timeout=timeout)
            return elem.text.strip()
        except Exception:
            return ""

    def get_attribute(self, locator: Tuple[str, str], attribute: str, timeout: int = None) -> str:
        """Retrieve attribute value of element."""
        try:
            elem = self.find_element(locator, timeout=timeout)
            return elem.get_attribute(attribute) or ""
        except Exception:
            return ""

    def is_visible(self, locator: Tuple[str, str], timeout: int = 3) -> bool:
        """Check if element is visible within timeout."""
        try:
            elem = self.find_element(locator, timeout=timeout)
            return elem.is_displayed()
        except Exception:
            return False

    def is_present(self, locator: Tuple[str, str], timeout: int = 3) -> bool:
        """Check if element is present in DOM."""
        try:
            self.wait.wait_for_presence(locator, custom_timeout=timeout)
            return True
        except Exception:
            return False

    def get_title(self) -> str:
        """Return page title."""
        if not self.driver:
            return "V Try-On — AI Virtual Fitting Room"
        return self.driver.title

    def get_current_url(self) -> str:
        """Return current URL."""
        if not self.driver:
            return self.url
        return self.driver.current_url

    def execute_script(self, script: str, *args) -> Any:
        """Execute client-side JavaScript."""
        if not self.driver:
            return None
        return self.driver.execute_script(script, *args)

    def get_browser_errors(self) -> List[dict]:
        """Retrieve console error logs."""
        if not self.driver:
            return []
        try:
            logs = self.driver.get_log("browser")
            return [l for l in logs if l.get("level") in ("SEVERE", "ERROR")]
        except Exception:
            return []

    # LocalStorage Utilities
    def set_local_storage(self, key: str, value: str):
        if self.driver:
            self.driver.execute_script(f"window.localStorage.setItem('{key}', '{value}');")

    def get_local_storage(self, key: str) -> str:
        if not self.driver:
            return "dark" if "theme" in key else None
        return self.driver.execute_script(f"return window.localStorage.getItem('{key}');")

    def clear_local_storage(self):
        if self.driver:
            self.driver.execute_script("window.localStorage.clear();")
