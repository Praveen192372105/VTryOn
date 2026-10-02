# V Try-On Platform — Baseline & Concurrency Load Testing Engine

High-performance baseline load testing harness for evaluating system throughput, concurrency, and latency resilience under expected normal production traffic.

---

## 🚀 Load Profile & SLA Specifications

| Parameter | Specification | Measured Value | SLA Target | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Virtual Users (VUs)** | 100 Concurrent Users | **100 VUs** | 100 VUs | [PASS] Compliant |
| **Continuous Duration** | 1 Full Minute | **60.7 seconds** | 60.0s | [PASS] Compliant |
| **Total Volume** | Thousands of Requests | **9,074 reqs** | > 3,000 reqs | [PASS] Exceeded |
| **Requests / Second (RPS)** | Sustained Throughput | **149.4 req/sec** | $\ge$ 120 req/sec | [PASS] Exceeded |
| **Peak Instantaneous RPS** | Peak Concurrency Spike | **200 req/sec** | — | [PASS] Stable |
| **Fastest Latency (Min)** | Best-case turnaround | **0.9 ms** | $\le$ 50 ms | [PASS] Optimal |
| **Average Latency (Mean)** | Mean response time | **11.8 ms** | $\le$ 250 ms | [PASS] Optimal |
| **Slowest Latency (Max)** | 99th percentile ceiling | **308.2 ms** | $\le$ 1500 ms (1.5s) | [PASS] Optimal |
| **Error Rate (Failures)** | HTTP 5xx / Network drops | **0.00% (0 errors)** | 0.00% | [PASS] 100% PASS |

---

## 📁 Directory Structure

```
load-tests/
├── config/
│   └── load-test.config.js               # Concurrency, endpoints, think-time & SLAs
├── reports/
│   ├── load-test-results.json            # High-resolution JSON execution telemetry
│   └── VTryOn_Baseline_Load_Test_Report.xlsx # Executive 2-Sheet Excel Report (325 TCs)
├── scripts/
│   └── generate-load-excel-report.py     # Openpyxl generator script for executive Excel
├── tests/
│   └── baseline-load-test.js             # High-throughput asynchronous worker engine
├── package.json                          # NPM run scripts and dependencies
└── README.md                             # Setup, execution and SLA manual
```

---

## 🏃 Running the Load Tests

### 1. Prerequisites
Ensure the FastAPI backend is running:
```bash
# In d:\VTryOn-1\backend
python start.py
```

### 2. Run Full 1-Minute / 100-VU Baseline Test
```bash
cd d:\VTryOn-1\load-tests
npm test
```

### 3. Run Fast Validation Run (10s)
```bash
npm run test:quick
```

### 4. Regenerate Executive Excel Spreadsheet (325 Telemetry Records)
```bash
npm run report:excel
```

### 5. Full Run (Execute Test + Build Excel Report)
```bash
npm run test:full
```

---

## 📊 Endpoints Evaluated Under Concurrent Load

| Endpoint | Method | Weight | Observed Avg Latency | Success Rate |
| :--- | :---: | :---: | :---: | :---: |
| `/health` | `GET` | 35% | **9.6 ms** | 3,203 / 3,203 (100%) |
| `/ready` | `GET` | 20% | **15.1 ms** | 1,850 / 1,850 (100%) |
| `/api/v1/health/live` | `GET` | 25% | **9.7 ms** | 2,240 / 2,240 (100%) |
| `/api/v1/outfits` | `GET` | 15% | **18.5 ms** | 1,332 / 1,332 (100%) |
| `/docs` | `GET` | 5% | **5.7 ms** | 449 / 449 (100%) |
