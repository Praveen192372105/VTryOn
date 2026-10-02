"""
Selenium WebDriver Factory.
Manages Headless Chrome lifecycle, capability setup, options, and responsive viewports.
"""

import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.remote.webdriver import WebDriver
from webdriver_manager.chrome import ChromeDriverManager
from automation.config.env_config import (
    HEADLESS_MODE,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    PAGE_LOAD_TIMEOUT,
    SCRIPT_TIMEOUT,
)
from automation.utils.logger import log

class DriverFactory:
    """Factory to initialize and configure Chrome WebDriver."""

    @staticmethod
    def get_chrome_options(headless: bool = HEADLESS_MODE) -> ChromeOptions:
        options = ChromeOptions()
        
        if headless:
            options.add_argument("--headless=new")
        
        # Performance & stability arguments
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument(f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}")
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-infobars")
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 VTryOnAutomation/1.0"
        )

        # Enable browser console logging
        options.set_capability("goog:loggingPrefs", {"browser": "ALL", "performance": "ALL"})
        
        return options

    @classmethod
    def create_driver(cls, headless: bool = HEADLESS_MODE) -> WebDriver:
        """Create a configured Chrome WebDriver instance."""
        options = cls.get_chrome_options(headless=headless)
        
        driver = None
        # Try local direct initialization first (Selenium 4 SeleniumManager handles driver download)
        try:
            driver = webdriver.Chrome(options=options)
            log.info("Chrome WebDriver initialized using built-in SeleniumManager.")
        except Exception as e1:
            log.warning(f"Built-in SeleniumManager initialization failed: {e1}. Falling back to webdriver_manager...")
            try:
                service = ChromeService(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=options)
                log.info("Chrome WebDriver initialized using ChromeDriverManager.")
            except Exception as e2:
                log.error(f"Failed to initialize Chrome WebDriver: {e2}")
                raise e2

        driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
        driver.set_script_timeout(SCRIPT_TIMEOUT)
        return driver

    @staticmethod
    def set_viewport(driver: WebDriver, device: str = "desktop"):
        """Adjust viewport for responsive design testing."""
        viewports = {
            "desktop": (1920, 1080),
            "laptop": (1366, 768),
            "tablet": (768, 1024),
            "mobile": (375, 812),      # iPhone X / 12 / 13
            "mobile_small": (320, 568),# iPhone SE
            "mobile_large": (414, 896),# iPhone XR / 11
        }
        width, height = viewports.get(device.lower(), (1920, 1080))
        driver.set_window_size(width, height)
        log.debug(f"Viewport adjusted to {device} ({width}x{height})")

    @staticmethod
    def get_console_logs(driver: WebDriver):
        """Retrieve browser console errors and logs."""
        try:
            return driver.get_log("browser")
        except Exception:
            return []
