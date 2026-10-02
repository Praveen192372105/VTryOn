"""
Outfits Wardrobe Page Object Model.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class OutfitsPage(BasePage):
    PAGE_HEADER = (By.TAG_NAME, "h1")
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[type='search'], input[placeholder*='Search'], input[placeholder*='Filter']")
    CATEGORY_FILTER_BUTTONS = (By.CSS_SELECTOR, "[role='tab'], .filter-chip, button.rounded-full")
    OUTFIT_CARDS = (By.CSS_SELECTOR, "[data-testid*='outfit-card'], .outfit-card, article")
    ADD_OUTFIT_BTN = (By.XPATH, "//button[contains(text(), 'Add Outfit') or contains(text(), 'Upload') or contains(text(), 'New')]")
    FAVORITE_ICON_BTN = (By.CSS_SELECTOR, "button[title*='Favorite'], [aria-label*='Favorite']")

    def __init__(self, driver):
        super().__init__(driver, path="app/outfits")

    def search_outfit(self, term: str):
        if self.is_present(self.SEARCH_INPUT):
            self.type_text(self.SEARCH_INPUT, term)

    def get_outfit_count(self) -> int:
        return len(self.find_elements(self.OUTFIT_CARDS))
