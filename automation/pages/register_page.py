"""
Registration Page Object Model.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class RegisterPage(BasePage):
    # Locators
    REGISTER_CARD = (By.CSS_SELECTOR, "form, [data-testid='register-card']")
    NAME_INPUT = (By.CSS_SELECTOR, "input[name='name'], input[name='fullName'], #name")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
    CONFIRM_PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='confirmPassword'], #confirmPassword")
    TERMS_CHECKBOX = (By.CSS_SELECTOR, "input[type='checkbox']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit'], form button")
    LOGIN_LINK = (By.XPATH, "//a[contains(@href, 'login') or contains(text(), 'Sign in') or contains(text(), 'Log in')]")
    ERROR_ALERT = (By.CSS_SELECTOR, "[role='alert'], .text-red-500, .text-destructive")

    def __init__(self, driver):
        super().__init__(driver, path="register")

    def register(self, name: str, email: str, password: str, confirm_password: str = None):
        if self.is_present(self.NAME_INPUT):
            self.type_text(self.NAME_INPUT, name)
        self.type_text(self.EMAIL_INPUT, email)
        self.type_text(self.PASSWORD_INPUT, password)
        if confirm_password and self.is_present(self.CONFIRM_PASSWORD_INPUT):
            self.type_text(self.CONFIRM_PASSWORD_INPUT, confirm_password)
        self.click(self.SUBMIT_BUTTON)

    def click_login_link(self):
        self.click(self.LOGIN_LINK)
