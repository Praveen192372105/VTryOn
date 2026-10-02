"""
Studio Page Object Model.
Represents the AI Virtual Fitting Room Studio workspace.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class StudioPage(BasePage):
    STUDIO_CONTAINER = (By.CSS_SELECTOR, "main, [data-testid='studio-container']")
    PERSON_UPLOAD_ZONE = (By.CSS_SELECTOR, "[data-testid='person-upload'], input[type='file']")
    GARMENT_UPLOAD_ZONE = (By.CSS_SELECTOR, "[data-testid='garment-upload'], input[type='file']")
    GENERATE_TRYON_BTN = (By.XPATH, "//button[contains(text(), 'Generate') or contains(text(), 'Try On') or contains(text(), 'Fit Outfit')]")
    PRESET_MODELS = (By.CSS_SELECTOR, "[data-testid*='preset'], .preset-item, img")
    CANVAS_VIEWPORT = (By.CSS_SELECTOR, "canvas, [data-testid='viewport-canvas'], .studio-viewport")
    ZOOM_IN_BTN = (By.CSS_SELECTOR, "button[title*='Zoom In'], [aria-label*='Zoom In']")
    ZOOM_OUT_BTN = (By.CSS_SELECTOR, "button[title*='Zoom Out'], [aria-label*='Zoom Out']")
    RESET_VIEW_BTN = (By.CSS_SELECTOR, "button[title*='Reset'], [aria-label*='Reset']")

    def __init__(self, driver):
        super().__init__(driver, path="app/studio")

    def is_studio_loaded(self) -> bool:
        return self.is_present(self.STUDIO_CONTAINER)

    def select_preset_model(self, index: int = 0):
        presets = self.find_elements(self.PRESET_MODELS)
        if presets and len(presets) > index:
            presets[index].click()

    def click_generate(self):
        self.click(self.GENERATE_TRYON_BTN)
