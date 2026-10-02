"""Tests package initialization."""
from .base_test import BaseTest
from .test_authentication import AuthenticationTestSuite
from .test_authorization import AuthorizationTestSuite
from .test_navigation import NavigationTestSuite
from .test_ui_validation import UiValidationTestSuite
from .test_forms import FormsTestSuite
from .test_crud_operations import CrudOperationsTestSuite
from .test_input_validation import InputValidationTestSuite
from .test_error_handling import ErrorHandlingTestSuite
from .test_session_management import SessionManagementTestSuite
from .test_file_upload import FileUploadTestSuite
from .test_accessibility import AccessibilityTestSuite
from .test_responsive_design import ResponsiveDesignTestSuite
from .test_performance_smoke import PerformanceSmokeTestSuite
from .test_regression import RegressionTestSuite

__all__ = [
    "BaseTest",
    "AuthenticationTestSuite",
    "AuthorizationTestSuite",
    "NavigationTestSuite",
    "UiValidationTestSuite",
    "FormsTestSuite",
    "CrudOperationsTestSuite",
    "InputValidationTestSuite",
    "ErrorHandlingTestSuite",
    "SessionManagementTestSuite",
    "FileUploadTestSuite",
    "AccessibilityTestSuite",
    "ResponsiveDesignTestSuite",
    "PerformanceSmokeTestSuite",
    "RegressionTestSuite",
]
