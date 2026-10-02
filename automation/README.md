# VTryOn Enterprise Selenium Automation Framework & CI/CD Pipeline
### Phase 7: Complete CI/CD Deployment + Live E2E Testing Against GitHub Pages

---

## 1. Architecture Overview

The **VTryOn Phase 7 QA Automation Architecture** is an enterprise-grade Continuous Deployment (CD) and End-to-End (E2E) testing framework. It completely decouples testing from local developer environments, ensuring that **Selenium WebDriver always executes against the LIVE deployed web application hosted on GitHub Pages**.

```
Code Push to main
       │
       ▼
Stage 1-3: Checkout, Dependencies, Vite Build (Base URL /VTryOn/)
       │
       ▼
Stage 4: Static Analysis & Type Checking
       │
       ▼
Stage 5: Deploy to GitHub Pages (actions/deploy-pages@v4)
       │
       ▼
Stage 6-7: Wait & Verify Live Deployment (HTTP 200, CSS/JS Assets, DOM Root)
       │
       ▼
Stage 8: Execute 474 Selenium Test Cases (14 Modules, Headless Chrome)
       │
       ▼
Stage 9-10: Generate Master Excel Workbooks (6 Sheets) & HTML Dashboards
       │
       ▼
Stage 11-13: Upload Artifacts (30-day retention), Publish Step Summary, Archive
```

---

## 2. Directory Structure

```
d:\VTryOn-1/
├── .github/
│   └── workflows/
│       └── deploy-and-test.yml         # 13-stage CI/CD pipeline
│
├── automation/
│   ├── config/
│   │   ├── __init__.py
│   │   └── env_config.py               # Enforces LIVE BASE_URL, forbids localhost
│   ├── data/
│   │   ├── __init__.py
│   │   └── test_data.py                # Fixtures, injection vectors, breakpoints
│   ├── pages/                          # Page Object Model (POM)
│   │   ├── __init__.py
│   │   ├── base_page.py
│   │   ├── landing_page.py
│   │   ├── login_page.py
│   │   ├── register_page.py
│   │   ├── studio_page.py
│   │   ├── outfits_page.py
│   │   ├── uploads_page.py
│   │   └── settings_page.py
│   ├── reports/                        # Report Generators
│   │   ├── __init__.py
│   │   ├── excel_reporter.py           # 6-sheet master Excel workbook generator
│   │   ├── html_reporter.py            # Responsive dark-mode dashboard
│   │   └── json_reporter.py            # JSON & GitHub summary generator
│   ├── tests/                          # 474 Executable Test Cases
│   │   ├── __init__.py
│   │   ├── base_test.py
│   │   ├── test_authentication.py      # 40 Test Cases
│   │   ├── test_authorization.py       # 44 Test Cases
│   │   ├── test_navigation.py          # 30 Test Cases
│   │   ├── test_ui_validation.py       # 50 Test Cases
│   │   ├── test_forms.py               # 50 Test Cases
│   │   ├── test_crud_operations.py     # 50 Test Cases
│   │   ├── test_input_validation.py    # 40 Test Cases
│   │   ├── test_error_handling.py      # 20 Test Cases
│   │   ├── test_session_management.py  # 20 Test Cases
│   │   ├── test_file_upload.py         # 20 Test Cases
│   │   ├── test_accessibility.py       # 20 Test Cases
│   │   ├── test_responsive_design.py   # 20 Test Cases
│   │   ├── test_performance_smoke.py   # 20 Test Cases
│   │   └── test_regression.py          # 50 Test Cases
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── driver_factory.py           # Headless Chrome manager & viewports
│   │   ├── wait_utils.py               # Explicit wait wrappers
│   │   ├── screenshot_utils.py         # Visual defect capturer
│   │   ├── logger.py                   # Centralized dual logging
│   │   ├── retry.py                    # Flakiness retry decorator
│   │   └── verify_deployment.py        # HTTP 200 & asset integrity verifier
│   └── run_all_tests.py                # Master test runner & quality gate
│
└── Test Results/
    ├── Excel/
    │   ├── Automation_Test_Report.xlsx # Master workbook with 6 sheets
    │   ├── Failed_Test_Cases.xlsx
    │   ├── Passed_Test_Cases.xlsx
    │   └── Summary_Report.xlsx
    ├── HTML/
    │   ├── execution-report.html       # Full interactive execution log
    │   └── dashboard.html              # Executive visual dashboard
    ├── JSON/
    │   └── execution-results.json      # Structured test metrics
    ├── Logs/
    │   └── execution.log               # Complete framework logs
    ├── Screenshots/                    # Visual evidence for failure states
    └── Summary/
        └── summary.md                  # GitHub Action Step Summary
```

---

## 3. Test Cases Breakdown (474 Total Executable Test Cases)

| Module | Category | Test Cases Count | Scope |
| :--- | :--- | :---: | :--- |
| `AUTH` | **Authentication** | 40 | Credential validation, SQL injection resilience, XSS neutralizing, keyboard navigation, password visibility |
| `AUTHZ` | **Authorization** | 44 | Protected route guards (`/app/*`), JWT tampering handling, expired session purge, guest route rules |
| `NAV` | **Navigation** | 30 | Route matrix traversal, brand logo routing, marketing link checks, 404 catch-all, deep linking |
| `UI` | **UI Validation** | 50 | Dark mode tokens, Inter typography, SVG rendering, glassmorphism, single H1 SEO hierarchy, color contrast |
| `FORM` | **Forms** | 50 | React Hook Form states, live validation errors, button disabled states, input reset, password confirmation |
| `CRUD` | **CRUD Operations** | 50 | Outfits gallery read, category filtering, search queries, add outfit, theme toggle, delete confirmation |
| `INP` | **Input Validation** | 40 | Weak password scoring, Unicode emojis, Cyrillic, CJK, RTL text, mathematical symbols, boundary values |
| `ERR` | **Error Handling** | 20 | React Error Boundaries, invalid try-on UUID fallbacks, toast notifications, broken image fallbacks |
| `SESS` | **Session Management** | 20 | LocalStorage theme persistence, multi-tab synchronization, logout memory cleanse, token expiry |
| `UPL` | **File Upload** | 20 | Drag & drop dropzone, image MIME accept filters (`png`, `jpeg`, `webp`), 10MB file size cap, format rejects |
| `A11Y` | **Accessibility (A11y)** | 20 | `html[lang='en']`, ARIA labels, semantic landmarks (`main`, `header`, `footer`), keyboard focus rings |
| `RESP` | **Responsive Design** | 20 | Mobile (320px, 375px, 414px), Tablet (768px, 1024px), Laptop (1366px), Desktop (1920px), zero overflow |
| `PERF` | **Performance Smoke Tests**| 20 | Navigation Timing API, DOMContentLoaded (<2.5s), page load (<5s), resource count budgets (<80 requests) |
| `REG` | **Regression** | 50 | Complete user journeys (Landing -> Login -> Studio -> Outfits -> Settings), defect fixes, CSP rules |
| **TOTAL** | **Enterprise E2E Suite** | **474** | **100% Executable Automation Coverage** |

---

## 4. Master Excel Report Specifications

The primary report `Test Results/Excel/Automation_Test_Report.xlsx` contains the 6 required sheets:

1. **Sheet 1: Executed Test Cases**
   - Columns: `Test ID`, `Module`, `Test Name`, `Status`, `Execution Time (s)`, `Priority`
2. **Sheet 2: Passed Tests**
   - Columns: `Test ID`, `Module`, `Test Name`, `Execution Time (s)`, `Priority`, `Expected Result`, `Actual Result`
3. **Sheet 3: Failed Tests**
   - Columns: `Test ID`, `Module`, `Test Name`, `Execution Time (s)`, `Priority`, `Failure Reason`, `Stack Trace`, `Screenshot Path`
4. **Sheet 4: Skipped Tests**
   - Columns: `Test ID`, `Module`, `Test Name`, `Priority`, `Skip Reason`
5. **Sheet 5: Execution Metrics**
   - Columns: `Metric Category`, `Parameter`, `Value`, `Benchmark / SLA`
   - Covers: Target BASE_URL, Total Tests, Passed, Failed, Skipped, Blocked, Pass Rate %, Average Duration, Execution Mode, Quality Gate Decision
6. **Sheet 6: Defect Summary**
   - Columns: `Defect ID`, `Associated Test ID`, `Module`, `Defect Title / Summary`, `Severity`, `Root Cause / Stack Trace`

---

## 5. Repository & GitHub Pages Configuration Guide

To enable automated deployments on GitHub Pages:

### 1. Repository Settings
1. Navigate to: `https://github.com/EswarChinthakayala-FullStack/VTryOn/settings/pages`
2. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions` (NOT "Deploy from a branch").
3. Under **Environments**:
   - Verify that the `github-pages` environment is created automatically upon first run.

### 2. Workflow Permissions
In repository settings (`Settings -> Actions -> General -> Workflow permissions`):
- Select: **Read and write permissions**
- Check: **Allow GitHub Actions to create and approve pull requests**

### 3. Environment Secrets & Variables
- **BASE_URL** (Variable, Optional): Defaults to `https://eswarchinthakayala-fullstack.github.io/VTryOn/`
- No third-party secrets required for the frontend GitHub Pages deployment.

---

## 6. Local Execution Guide

### Prerequisites
- Python 3.11+
- Google Chrome browser installed
- Node.js 20+

### Step 1: Install Python Dependencies
```bash
pip install selenium webdriver-manager openpyxl requests
```

### Step 2: Run Against the Live Deployment
```bash
# Set BASE_URL to the live deployment (or uses default)
$env:BASE_URL="https://eswarchinthakayala-fullstack.github.io/VTryOn/"

# Run all 474 Selenium test cases
python automation/run_all_tests.py
```

### Step 3: Run in Baseline / Report Generation Mode
```bash
python automation/run_all_tests.py --baseline
```

---

## 7. CI/CD Execution Guide

The workflow `.github/workflows/deploy-and-test.yml` automatically triggers on:
1. `push` to `main`
2. `pull_request` to `main`
3. Manual trigger via `workflow_dispatch`

### Manual Trigger via GitHub UI:
1. Open the **Actions** tab in GitHub.
2. Select **Live Deployment & E2E Testing Pipeline**.
3. Click **Run workflow**, optionally specifying a custom `base_url`.
4. Click **Run workflow**.

---

## 8. Troubleshooting Guide

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| `Deployment verification failed (HTTP 404)` | GitHub Pages has not finished propagating or repository Pages source is not set to "GitHub Actions" | In repo `Settings -> Pages`, ensure Source is set to **GitHub Actions**. Wait 1-2 minutes for propagation. |
| `Cannot find Chrome binary` | Chrome is not installed in standard path | Ensure Chrome is installed or run with `HEADLESS=true`. In CI, the workflow automatically configures `google-chrome`. |
| `Asset 404 on /assets/...` | Vite built with root `/` instead of `/VTryOn/` | Ensure `GITHUB_PAGES=true` or `VITE_BASE_PATH=/VTryOn/` is passed during build. |
| `SPA Deep link 404 on page refresh` | GitHub Pages static routing cannot resolve client-side routes | The build step automatically copies `dist/index.html` to `dist/404.html` and creates `dist/.nojekyll`. |
| `Quality Gate Failed (Pass Rate < 95%)` | Critical assertions failed against live endpoint | Inspect `Test Results/Screenshots/` and `Test Results/Logs/execution.log` in GitHub Actions Artifacts. |
