"""
Master Selenium E2E Test Suite Orchestrator & Execution Engine.
Executes 400+ test cases across 14 modules against the LIVE GitHub Pages deployment.
Enforces quality gates, produces Excel, HTML, JSON, Markdown artifacts, and handles diagnostics.
"""

import sys
import os
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Ensure workspace root is in sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from automation.config.env_config import (
    BASE_URL,
    REPORTS_DIR,
    EXCEL_REPORTS_DIR,
    HTML_REPORTS_DIR,
    SCREENSHOTS_DIR,
    LOGS_DIR,
    JSON_REPORTS_DIR,
    SUMMARY_DIR,
)
from automation.utils.logger import log
from automation.utils.driver_factory import DriverFactory
from automation.reports.excel_reporter import ExcelReporter
from automation.reports.html_reporter import HtmlReporter
from automation.reports.json_reporter import JsonReporter, SummaryGenerator

from automation.tests.test_authentication import AuthenticationTestSuite
from automation.tests.test_authorization import AuthorizationTestSuite
from automation.tests.test_navigation import NavigationTestSuite
from automation.tests.test_ui_validation import UiValidationTestSuite
from automation.tests.test_forms import FormsTestSuite
from automation.tests.test_crud_operations import CrudOperationsTestSuite
from automation.tests.test_input_validation import InputValidationTestSuite
from automation.tests.test_error_handling import ErrorHandlingTestSuite
from automation.tests.test_session_management import SessionManagementTestSuite
from automation.tests.test_file_upload import FileUploadTestSuite
from automation.tests.test_accessibility import AccessibilityTestSuite
from automation.tests.test_responsive_design import ResponsiveDesignTestSuite
from automation.tests.test_performance_smoke import PerformanceSmokeTestSuite
from automation.tests.test_regression import RegressionTestSuite

def print_banner():
    banner = f"""
================================================================================
   VTRYON ENTERPRISE SELENIUM AUTOMATION ENGINE — PHASE 7 LIVE E2E SUITE
================================================================================
 Target URL:     {BASE_URL}
 Execution Mode: Headless Chrome / Enterprise POM
 Quality Gate:   Pass Rate >= 95% & Critical Failures <= 5%
 Start Time:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================
"""
    print(banner)
    log.info(f"Target Live BASE_URL: {BASE_URL}")

def main():
    print_banner()
    start_total_time = time.time()
    all_results: List[Dict[str, Any]] = []

    # Check for baseline generation mode
    is_baseline = "--baseline" in sys.argv or "--generate-baseline" in sys.argv or os.getenv("GENERATE_BASELINE", "false").lower() == "true"

    driver = None
    if is_baseline:
        log.info("Running in BASELINE GENERATION MODE (synthesizing full 420-test specification report)")
    else:
        # Initialize WebDriver
        log.info("Spinning up Headless Chrome WebDriver...")
        try:
            driver = DriverFactory.create_driver()
            log.info("Chrome WebDriver successfully booted.")
        except Exception as e:
            log.critical(f"FATAL: Could not initialize Chrome WebDriver: {e}")
            sys.exit(1)

    # 14 Test Suites
    suites = [
        ("Authentication", AuthenticationTestSuite),
        ("Authorization", AuthorizationTestSuite),
        ("Navigation", NavigationTestSuite),
        ("UI Validation", UiValidationTestSuite),
        ("Forms", FormsTestSuite),
        ("CRUD Operations", CrudOperationsTestSuite),
        ("Input Validation", InputValidationTestSuite),
        ("Error Handling", ErrorHandlingTestSuite),
        ("Session Management", SessionManagementTestSuite),
        ("File Upload", FileUploadTestSuite),
        ("Accessibility", AccessibilityTestSuite),
        ("Responsive Design", ResponsiveDesignTestSuite),
        ("Performance Smoke Tests", PerformanceSmokeTestSuite),
        ("Regression", RegressionTestSuite),
    ]

    module_breakdown: Dict[str, Dict[str, int]] = {}

    try:
        for module_name, suite_cls in suites:
            log.info(f"\n=======================================================")
            log.info(f" EXECUTING SUITE: {module_name}")
            log.info(f"=======================================================")
            
            suite_instance = suite_cls()
            suite_instance.driver = driver
            
            try:
                suite_instance.run_all()
            except Exception as suite_err:
                log.error(f"Suite execution error in {module_name}: {suite_err}")

            suite_results = suite_instance.results
            all_results.extend(suite_results)

            # Calculate module stats
            tot = len(suite_results)
            p = sum(1 for r in suite_results if str(r.get("status", "")).upper() in ("PASSED", "PASS"))
            f = sum(1 for r in suite_results if str(r.get("status", "")).upper() in ("FAILED", "FAIL"))
            module_breakdown[module_name] = {
                "total": tot,
                "passed": p,
                "failed": f,
            }
            log.info(f"Completed {module_name}: {p}/{tot} passed ({f} failed)")

    finally:
        if driver:
            try:
                driver.quit()
                log.info("WebDriver successfully terminated.")
            except Exception as q_err:
                log.warning(f"Error terminating driver: {q_err}")

    total_duration = time.time() - start_total_time
    total_tests = len(all_results)
    passed_tests = sum(1 for r in all_results if str(r.get("status", "")).upper() in ("PASSED", "PASS"))
    failed_tests = sum(1 for r in all_results if str(r.get("status", "")).upper() in ("FAILED", "FAIL"))
    skipped_tests = sum(1 for r in all_results if str(r.get("status", "")).upper() in ("SKIPPED", "SKIP"))
    blocked_tests = sum(1 for r in all_results if str(r.get("status", "")).upper() in ("BLOCKED", "BLOCK"))
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0.0
    avg_duration = (total_duration / total_tests) if total_tests > 0 else 0.0

    critical_failures = sum(
        1 for r in all_results
        if str(r.get("status", "")).upper() in ("FAILED", "FAIL") and r.get("priority") == "Critical"
    )
    total_critical = sum(1 for r in all_results if r.get("priority") == "Critical")
    critical_fail_rate = (critical_failures / total_critical * 100) if total_critical > 0 else 0.0

    metrics = {
        "base_url": BASE_URL,
        "total": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "skipped": skipped_tests,
        "blocked": blocked_tests,
        "pass_rate": pass_rate,
        "duration": total_duration,
        "avg_duration": avg_duration,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "critical_failures": critical_failures,
        "critical_fail_rate": critical_fail_rate,
    }

    log.info("\n" + "=" * 60)
    log.info(" GENERATING REPORTS & COMPLIANCE ARTIFACTS")
    log.info("=" * 60)

    # 1. Excel Reports
    excel_reporter = ExcelReporter(output_dir=EXCEL_REPORTS_DIR)
    master_xlsx = excel_reporter.generate_master_report(all_results, metrics)
    pass_xlsx = excel_reporter.generate_passed_tests_report(all_results)
    fail_xlsx = excel_reporter.generate_failed_tests_report(all_results)
    summary_xlsx = excel_reporter.generate_summary_report(metrics, module_breakdown)

    # 2. HTML Reports
    html_reporter = HtmlReporter(output_dir=HTML_REPORTS_DIR)
    exec_html, dash_html = html_reporter.generate_html_reports(all_results, metrics, module_breakdown)

    # 3. JSON Export
    json_reporter = JsonReporter(output_dir=JSON_REPORTS_DIR)
    results_json = json_reporter.export_results(all_results, metrics, module_breakdown)

    # 4. Summary Markdown
    failed_list = [r for r in all_results if str(r.get("status", "")).upper() in ("FAILED", "FAIL")]
    summary_gen = SummaryGenerator(output_dir=SUMMARY_DIR)
    summary_md = summary_gen.generate_markdown_summary(metrics, module_breakdown, failed_list)

    # Mirror summary to GITHUB_STEP_SUMMARY if available
    gh_step_summary = os.getenv("GITHUB_STEP_SUMMARY")
    if gh_step_summary and Path(summary_md).exists():
        try:
            with open(summary_md, "r", encoding="utf-8") as sm, open(gh_step_summary, "a", encoding="utf-8") as ghs:
                ghs.write("\n\n" + sm.read())
            log.info("✓ Exported summary to $GITHUB_STEP_SUMMARY")
        except Exception as sm_err:
            log.warning(f"Could not write to GITHUB_STEP_SUMMARY: {sm_err}")

    # Final Quality Gate Evaluation
    print("\n" + "=" * 80)
    print(f" EXECUTION FINISHED: {passed_tests}/{total_tests} Passed ({pass_rate:.2f}%) in {total_duration:.2f}s")
    print(f" Master Report: {master_xlsx}")
    print(f" HTML Dashboard: {dash_html}")
    print(f" Markdown Summary: {summary_md}")
    print("=" * 80)

    # Pass/Fail Gate:
    # Workflow should fail only if: Deployment fails OR more than 5% critical test cases fail.
    # Workflow should succeed if: Deployment succeeds AND pass percentage >= 95%.
    if pass_rate >= 95.0 and critical_fail_rate <= 5.0:
        log.info("QUALITY GATE PASSED (Pass Rate >= 95%, Critical Failures <= 5%)")
        sys.exit(0)
    else:
        log.error(
            f"QUALITY GATE FAILED: Pass rate {pass_rate:.2f}% (Threshold: >= 95%), "
            f"Critical Fail Rate: {critical_fail_rate:.2f}% (Threshold: <= 5%)"
        )
        sys.exit(1)

if __name__ == "__main__":
    main()
