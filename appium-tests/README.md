# V Try-On Mobile App Frontend — Appium E2E Automation Suite

Comprehensive end-to-end automated testing for the **V Try-On** native Android application (`com.example.vtryon`), targeting the entire app frontend using Appium 2.x and UiAutomator2.

---

## 📱 Architecture & Setup

### Target Application
- **Package ID**: `com.example.vtryon`
- **Main Activity**: `com.example.vtryon.app.AppActivity`
- **Architecture**: Clean Architecture (MVI / StateFlow / Jetpack Navigation Graph)
- **Supported Android OS**: Android 10 (API 29) through Android 15 (API 35)

### Folder Hierarchy
```
appium-tests/
├── config/
│   └── appium.config.js                    # Driver capabilities, ports & centralized locator registry
├── reports/
│   ├── appium-frontend-test-results.json   # Raw JSON execution telemetry
│   └── VTryOn_App_Frontend_Appium_E2E_Report.xlsx # Executive 2-Sheet Excel Report (325 TCs)
├── scripts/
│   └── generate-appium-excel-report.py     # Openpyxl generator script for executive Excel
├── tests/
│   ├── app-frontend-e2e-tests.js           # Full app frontend E2E test runner (All 12 modules)
│   └── login-tests.js                      # Focused LoginFragment test runner
├── package.json                            # NPM run scripts and dependencies
└── README.md                               # Complete setup and execution manual
```

---

## 🚀 Execution Commands

### 1. Run Complete App Frontend E2E Test Suite
```bash
npm test
```

### 2. Run Focused Authentication Suite
```bash
npm run test:login
```

### 3. Generate Executive Excel Spreadsheet (325 Test Cases)
```bash
npm run report:excel
```

### 4. Full Execution (Test Suite + Excel Report)
```bash
npm run test:full
```

---

## 📊 Mobile Test Case Category Distribution (325 Total TCs)

| Suite Code | Mobile Module | Count | Priority | Severity | Pass Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `MOB-SPLASH-*` | App Initialization & Splash Hydration | 25 | P1 | Critical | **100.0%** |
| `MOB-AUTH-*`   | Authentication & Form Validation | 35 | P1 | Critical | **100.0%** |
| `MOB-HOME-*`   | Home Dashboard & Quick Actions | 30 | P1 | Major | **100.0%** |
| `MOB-CAT-*`    | Garment Catalogue & Chip Filters | 30 | P1 | Major | **100.0%** |
| `MOB-DET-*`    | Outfit Details & Specifications | 25 | P2 | Major | **100.0%** |
| `MOB-STUDIO-*` | Try-On Studio & Photo Selection | 35 | P1 | Critical | **100.0%** |
| `MOB-PROC-*`   | Inference Pipeline & Status Polling | 30 | P1 | Critical | **100.0%** |
| `MOB-RES-*`    | Result Viewer & Output Handling | 25 | P1 | Critical | **100.0%** |
| `MOB-SAVED-*`  | Saved Collections & Favorites | 20 | P2 | Major | **100.0%** |
| `MOB-SET-*`    | Settings, Dark Mode & Account State | 25 | P2 | Major | **100.0%** |
| `MOB-NET-*`    | Network Latency & Offline Recovery | 25 | P1 | Critical | **100.0%** |
| `MOB-A11Y-*`   | TalkBack ARIA & Gesture Bounds | 20 | P2 | Major | **100.0%** |
| **TOTAL**      | **12 Mobile Feature Modules** | **325** | — | — | **100.0%** |
