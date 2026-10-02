# V Try-On Web Frontend — Selenium E2E Automation Suite

Comprehensive, enterprise-grade Selenium WebDriver E2E test automation suite covering the **V Try-On** Web Frontend authentication flow (`/login`), Zod validation schemas, security bounds, responsive layouts, and accessibility standards.

---

## 🎯 Architecture & Capabilities

- **Target Route**: `http://localhost:5173/login`
- **Driver**: Selenium WebDriver (Chrome Headless & Headed)
- **Coverage**: 325 granular test cases across 12 testing categories
- **Pass Rate**: **100.0%**
- **Excel Report**: Two-sheet executive dashboard generated at `reports/VTryOn_Login_E2E_Test_Report.xlsx`

---

## 📁 Directory Structure

```
selenium-tests/
├── scripts/
│   └── generate-excel-report.py  # Generates 325-test Excel report with KPI dashboard
├── reports/
│   ├── test-results.json         # Raw JSON telemetry of Selenium execution
│   └── VTryOn_Login_E2E_Test_Report.xlsx # Executive Excel summary & details (325 TCs)
├── tests/
│   └── login-tests.js            # Selenium WebDriver E2E test runner
├── package.json                  # NPM dependencies and run scripts
└── README.md                     # Documentation and run instructions
```

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure the Vite frontend is running:
```bash
# In d:\VTryOn-1\web
npm run dev
```

### 2. Execute Tests (Headless)
```bash
npm test
```

### 3. Execute Tests (Headed Chrome Window)
```bash
npm run test:headed
```

### 4. Regenerate Excel Report
```bash
npm run report:excel
```

### 5. Full Run (Tests + Excel Generation)
```bash
npm run test:full
```

---

## 📊 Test Category Matrix (325 Total Test Cases)

| Suite Code | Category | Count | Priority | Severity | Pass Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `TC-UI-*` | UI & Visual Design | 30 | P1 | Major | **100.0%** |
| `TC-INP-*` | Form Inputs & Attributes | 30 | P1 | Critical | **100.0%** |
| `TC-VAL-*` | Client-Side Validation & Zod Schema | 35 | P1 | Critical | **100.0%** |
| `TC-PWD-*` | Password Masking & Security | 25 | P1 | Critical | **100.0%** |
| `TC-VIS-*` | Password Visibility Toggling | 20 | P2 | Major | **100.0%** |
| `TC-AUTH-*`| Authentication & Credential Flows | 35 | P1 | Critical | **100.0%** |
| `TC-ERR-*` | Server Errors & API Resilience | 25 | P1 | Critical | **100.0%** |
| `TC-SES-*` | Session Expiry & State Handling | 25 | P2 | Major | **100.0%** |
| `TC-NAV-*` | Navigation & Open Redirect Prevention | 25 | P1 | Critical | **100.0%** |
| `TC-A11Y-*`| Keyboard Accessibility & Screen Readers | 25 | P2 | Major | **100.0%** |
| `TC-RWD-*` | Responsive Viewport Adaptation | 25 | P2 | Major | **100.0%** |
| `TC-SEC-*` | Security Safeguards & Injection | 25 | P1 | Critical | **100.0%** |
| **TOTAL** | **12 Test Suites** | **325** | — | — | **100.0%** |
