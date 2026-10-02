"""
Login Page Object Model.
Represents the Authentication portal on the live deployment.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class LoginPage(BasePage):
    # Locators
    LOGIN_CARD = (By.CSS_SELECTOR, "form, [data-testid='login-card'], .login-container")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
    REMEMBER_ME_CHECKBOX = (By.CSS_SELECTOR, "input[type='checkbox']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit'], form button")
    REGISTER_LINK = (By.XPATH, "//a[contains(@href, 'register') or contains(text(), 'Sign up') or contains(text(), 'Create an account')]")
    FORGOT_PASSWORD_LINK = (By.XPATH, "//a[contains(text(), 'Forgot') or contains(@href, 'forgot')]")
    ERROR_ALERT = (By.CSS_SELECTOR, "[role='alert'], .text-red-500, .text-destructive, .error-message")
    BACK_HOME_LINK = (By.XPATH, "//a[contains(@href, '/') or contains(text(), 'Back') or contains(text(), 'Home')]")

    def __init__(self, driver):
        super().__init__(driver, path="login")

    def enter_email(self, email: str):
        self.type_text(self.EMAIL_INPUT, email)

    def enter_password(self, password: str):
        self.type_text(self.PASSWORD_INPUT, password)

    def submit_login(self):
        self.click(self.SUBMIT_BUTTON)

    def login(self, email: str, password: str):
        self.enter_email(email)
        self.enter_password(password)
        self.submit_login()

    def get_error_message(self) -> str:
        return self.get_text(self.ERROR_ALERT)

    def is_login_button_enabled(self) -> bool:
        return self.get_attribute(self.SUBMIT_BUTTON, "disabled") == ""

    def click_register_link(self):
        self.click(self.REGISTER_LINK)
