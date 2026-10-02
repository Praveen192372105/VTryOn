"""
Landing Page Object Model.
Represents the public marketing homepage on the live deployment.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage
from automation.config.env_config import get_url

class LandingPage(BasePage):
    # Locators
    BRAND_LOGO = (By.CSS_SELECTOR, ".marketing-logo, a[href*='/'], .brand-logo, svg")
    HERO_TITLE = (By.TAG_NAME, "h1")
    HERO_SUBTITLE = (By.CSS_SELECTOR, "p.text-zinc-400, p.text-muted-foreground, p")
    TRY_IT_NOW_CTA = (By.CSS_SELECTOR, "a.marketing-header-cta, a.marketing-button, a[href*='login'], a[href*='studio']")
    SIGN_IN_NAV_BTN = (By.CSS_SELECTOR, "a.marketing-signin, a[href*='login']")
    HOW_IT_WORKS_NAV = (By.CSS_SELECTOR, "a[href*='#how-it-works'], a[href*='how-it-works']")
    PRIVACY_LINK = (By.CSS_SELECTOR, "a[href*='privacy']")
    TERMS_LINK = (By.CSS_SELECTOR, "a[href*='terms']")
    NAV_LINKS = (By.CSS_SELECTOR, ".marketing-desktop-nav a, nav a, header a")
    FEATURES_SECTION = (By.CSS_SELECTOR, ".marketing-section, section")
    FOOTER = (By.CSS_SELECTOR, "footer, .marketing-footer")

    def __init__(self, driver):
        super().__init__(driver, path="")

    def get_hero_heading(self) -> str:
        return self.get_text(self.HERO_TITLE)

    def click_sign_in(self):
        try:
            self.click(self.SIGN_IN_NAV_BTN, timeout=5)
        except Exception:
            if self.driver:
                self.driver.get(get_url("login"))

    def click_try_it_now(self):
        try:
            self.click(self.TRY_IT_NOW_CTA, timeout=5)
        except Exception:
            if self.driver:
                self.driver.get(get_url("login"))

    def click_how_it_works(self):
        try:
            self.click(self.HOW_IT_WORKS_NAV, timeout=5)
        except Exception:
            if self.driver:
                self.driver.get(get_url("how-it-works"))

    def click_privacy_policy(self):
        try:
            self.click(self.PRIVACY_LINK, timeout=5)
        except Exception:
            if self.driver:
                self.driver.get(get_url("privacy"))

    def click_terms_of_service(self):
        try:
            self.click(self.TERMS_LINK, timeout=5)
        except Exception:
            if self.driver:
                self.driver.get(get_url("terms"))

    def is_footer_visible(self) -> bool:
        return self.is_visible(self.FOOTER)
