"""
Landing Page Object Model.
Represents the public marketing homepage on the live deployment.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class LandingPage(BasePage):
    # Locators
    BRAND_LOGO = (By.CSS_SELECTOR, "a[href*='/'], .brand-logo, svg")
    HERO_TITLE = (By.TAG_NAME, "h1")
    HERO_SUBTITLE = (By.CSS_SELECTOR, "p.text-zinc-400, p.text-muted-foreground, p")
    TRY_IT_NOW_CTA = (By.XPATH, "//a[contains(text(), 'Try It Now') or contains(text(), 'Start Free') or contains(text(), 'Get Started') or contains(@href, 'login') or contains(@href, 'studio')]")
    SIGN_IN_NAV_BTN = (By.XPATH, "//a[contains(@href, 'login') or contains(text(), 'Sign In') or contains(text(), 'Login')]")
    HOW_IT_WORKS_NAV = (By.XPATH, "//a[contains(@href, 'how-it-works') or contains(text(), 'How It Works')]")
    PRIVACY_LINK = (By.XPATH, "//a[contains(@href, 'privacy') or contains(text(), 'Privacy')]")
    TERMS_LINK = (By.XPATH, "//a[contains(@href, 'terms') or contains(text(), 'Terms')]")
    NAV_LINKS = (By.CSS_SELECTOR, "nav a, header a")
    FEATURES_SECTION = (By.CSS_SELECTOR, "[id*='feature'], section")
    FOOTER = (By.TAG_NAME, "footer")

    def __init__(self, driver):
        super().__init__(driver, path="")

    def get_hero_heading(self) -> str:
        return self.get_text(self.HERO_TITLE)

    def click_sign_in(self):
        self.click(self.SIGN_IN_NAV_BTN)

    def click_try_it_now(self):
        self.click(self.TRY_IT_NOW_CTA)

    def click_how_it_works(self):
        self.click(self.HOW_IT_WORKS_NAV)

    def click_privacy_policy(self):
        self.click(self.PRIVACY_LINK)

    def click_terms_of_service(self):
        self.click(self.TERMS_LINK)

    def is_footer_visible(self) -> bool:
        return self.is_visible(self.FOOTER)
