"""
Uploads Page Object Model.
"""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class UploadsPage(BasePage):
    DROPZONE = (By.CSS_SELECTOR, "[data-testid='dropzone'], .border-dashed, input[type='file']")
    FILE_INPUT = (By.CSS_SELECTOR, "input[type='file']")
    UPLOADED_ITEMS = (By.CSS_SELECTOR, "[data-testid*='upload-item'], .upload-card")
    DELETE_UPLOAD_BTN = (By.CSS_SELECTOR, "button[title*='Delete'], [aria-label*='Delete']")

    def __init__(self, driver):
        super().__init__(driver, path="app/uploads")

    def upload_file(self, file_path: str):
        elem = self.driver.find_element(*self.FILE_INPUT)
        elem.send_keys(file_path)
