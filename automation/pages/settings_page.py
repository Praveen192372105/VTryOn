"""
Settings Page Object Model.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class SettingsPage(BasePage):
    PAGE_TITLE = (By.TAG_NAME, "h1")
    THEME_DARK_BTN = (By.XPATH, "//button[contains(text(), 'Dark') or @data-theme='dark']")
    THEME_LIGHT_BTN = (By.XPATH, "//button[contains(text(), 'Light') or @data-theme='light']")
    THEME_SYSTEM_BTN = (By.XPATH, "//button[contains(text(), 'System') or @data-theme='system']")
    NAME_INPUT = (By.CSS_SELECTOR, "input[name='name'], #name")
    SAVE_SETTINGS_BTN = (By.XPATH, "//button[contains(text(), 'Save') or contains(text(), 'Update')]")

    def __init__(self, driver):
        super().__init__(driver, path="app/settings")

    def switch_theme(self, theme: str):
        if theme.lower() == "light":
            self.click(self.THEME_LIGHT_BTN)
        elif theme.lower() == "system":
            self.click(self.THEME_SYSTEM_BTN)
        else:
            self.click(self.THEME_DARK_BTN)
