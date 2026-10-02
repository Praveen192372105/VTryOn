"""
Explicit Wait Utilities for Selenium WebDriver.
Provides robust wait mechanisms for element presence, visibility, clickability, and page state.
"""

from typing import List, Tuple
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
from automation.config.env_config import DEFAULT_EXPLICIT_WAIT
from automation.utils.logger import log

class WaitUtils:
    def __init__(self, driver: WebDriver, timeout: int = DEFAULT_EXPLICIT_WAIT):
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(
            driver,
            timeout,
            poll_frequency=0.3,
            ignored_exceptions=[StaleElementReferenceException]
        )

    def wait_for_visible(self, locator: Tuple[str, str], custom_timeout: int = None) -> WebElement:
        """Wait until an element is visible on the DOM and visible to the user."""
        wait = self.wait if custom_timeout is None else WebDriverWait(self.driver, custom_timeout)
        try:
            return wait.until(EC.visibility_of_element_located(locator))
        except TimeoutException:
            log.error(f"Timeout waiting for element visible: {locator}")
            raise

    def wait_for_clickable(self, locator: Tuple[str, str], custom_timeout: int = None) -> WebElement:
        """Wait until an element is visible and enabled such that you can click it."""
        wait = self.wait if custom_timeout is None else WebDriverWait(self.driver, custom_timeout)
        try:
            return wait.until(EC.element_to_be_clickable(locator))
        except TimeoutException:
            log.error(f"Timeout waiting for element clickable: {locator}")
            raise

    def wait_for_presence(self, locator: Tuple[str, str], custom_timeout: int = None) -> WebElement:
        """Wait until an element is present on the DOM."""
        wait = self.wait if custom_timeout is None else WebDriverWait(self.driver, custom_timeout)
        try:
            return wait.until(EC.presence_of_element_located(locator))
        except TimeoutException:
            log.error(f"Timeout waiting for element presence: {locator}")
            raise

    def wait_for_all_visible(self, locator: Tuple[str, str], custom_timeout: int = None) -> List[WebElement]:
        """Wait until all elements matching locator are visible."""
        wait = self.wait if custom_timeout is None else WebDriverWait(self.driver, custom_timeout)
        try:
            return wait.until(EC.visibility_of_all_elements_located(locator))
        except TimeoutException:
            log.warning(f"Timeout waiting for all elements visible: {locator}")
            return []

    def wait_for_url_contains(self, partial_url: str, custom_timeout: int = None) -> bool:
        """Wait until the current URL contains a specific substring."""
        wait = self.wait if custom_timeout is None else WebDriverWait(self.driver, custom_timeout)
        try:
            return wait.until(EC.url_contains(partial_url))
        except TimeoutException:
            log.warning(f"URL did not contain '{partial_url}' within {self.timeout}s. Current URL: {self.driver.current_url}")
            return False

    def wait_for_document_ready(self, timeout: int = 15) -> bool:
        """Wait until document.readyState == 'complete'."""
        try:
            return WebDriverWait(self.driver, timeout).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
        except Exception:
            return False
