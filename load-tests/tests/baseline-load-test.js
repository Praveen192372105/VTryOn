/**
 * =============================================================================
 * V TRY-ON PLATFORM — BASELINE & CONCURRENCY LOAD TESTING ENGINE
 * =============================================================================
 * Load Profile:
 *   - Virtual Users   : 100 Concurrent Users (Continuous Async Workers)
 *   - Test Duration   : 60 Seconds (1 Minute continuous traffic)
 *   - Traffic Volume  : Thousands of concurrent requests
 *
 * Measurements & Telemetry:
 *   - Requests Per Second (RPS) : Instantaneous & Average Throughput
 *   - Response Times            : Min, Average, Max, P50, P90, P95, P99 Latencies
 *   - SLA Verification          : Error rate, Latency bounds & 100% Pass evaluation
 * =============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('../config/load-test.config');

const REPORTS_DIR = path.resolve(__dirname, '../reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Optimized persistent HTTP Keep-Alive Agent for 100+ concurrent sockets
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 250,
  maxFreeSockets: 100,
  timeout: config.profile.timeoutMs
});

// Single HTTP Request Dispatcher
function makeRequest(targetUrl, endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, targetUrl);
    const t0 = process.hrtime.bigint();

    const req = http.request(
      url,
      {
        method: endpoint.method,
        agent: httpAgent,
        timeout: config.profile.timeoutMs,
        headers: {
          'User-Agent': 'VTryOn-LoadTest-Worker/1.0',
          'Accept': 'application/json'
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const t1 = process.hrtime.bigint();
          const latencyMs = Number(t1 - t0) / 1e6;
          const isExpected = Array.isArray(endpoint.expectedStatus)
            ? endpoint.expectedStatus.includes(res.statusCode)
            : res.statusCode === endpoint.expectedStatus;

          resolve({
            success: isExpected,
            statusCode: res.statusCode,
            latencyMs,
            path: endpoint.path,
            error: isExpected ? null : `HTTP status ${res.statusCode}`
          });
        });
      }
    );

    req.on('error', (err) => {
      const t1 = process.hrtime.bigint();
      const latencyMs = Number(t1 - t0) / 1e6;
      resolve({
        success: false,
        statusCode: 0,
        latencyMs,
        path: endpoint.path,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const t1 = process.hrtime.bigint();
      const latencyMs = Number(t1 - t0) / 1e6;
      resolve({
        success: false,
        statusCode: 408,
        latencyMs,
        path: endpoint.path,
        error: 'Socket timeout (>5000ms)'
      });
    });

    req.end();
  });
}

// Select weighted target endpoint
function pickEndpoint(endpoints) {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  for (const ep of endpoints) {
    if (random < ep.weight) return ep;
    random -= ep.weight;
  }
  return endpoints[0];
}

// Percentile Calculation Helper
function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const getP = (p) => {
    const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
    return sorted[idx];
  };
  return {
    p50: getP(50),
    p75: getP(75),
    p90: getP(90),
    p95: getP(95),
    p99: getP(99)
  };
}

async function runBaselineLoadTest() {
  const concurrentUsers = config.profile.concurrentUsers;
  const durationSec = config.profile.durationSeconds;
  const baseUrl = config.targets.backendBaseUrl;
  const endpoints = config.targets.endpoints;

  console.log('\n' + '='.repeat(85));
  console.log('   V TRY-ON PLATFORM — BASELINE & CONCURRENCY LOAD TESTING ENGINE');
  console.log('='.repeat(85));
  console.log(`  Target Backend URL  : ${baseUrl}`);
  console.log(`  Concurrent Users    : ${concurrentUsers} Virtual Users (Continuous)`);
  console.log(`  Target Duration     : ${durationSec} Seconds (1 Minute Continuous Traffic)`);
  console.log(`  Expected Volume     : Thousands of concurrent HTTP requests`);
  console.log(`  SLA Response Budget : Avg < ${config.sla.maxAverageResponseTimeMs}ms | Max < ${config.sla.maxResponseTimeMs}ms`);
  console.log(`  Started Timestamp   : ${new Date().toLocaleString()}`);
  console.log('-'.repeat(85) + '\n');

  // Verify server reachability before running full load
  console.log('[PROBE] Validating target backend availability...');
  const probe = await makeRequest(baseUrl, { path: '/health', method: 'GET', expectedStatus: 200 });
  if (!probe.success) {
    console.error(`[FATAL] Backend server probe failed on ${baseUrl}/health: ${probe.error}`);
    console.error('[FATAL] Aborting load test execution.');
    process.exit(1);
  }
  console.log(`[PROBE] Target online (Latency: ${probe.latencyMs.toFixed(1)}ms). Initializing load generation...\n`);

  // Telemetry Aggregates
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies = [];
  const endpointStats = {};
  for (const ep of endpoints) {
    endpointStats[ep.path] = { count: 0, success: 0, failed: 0, latencies: [] };
  }

  // Second-by-Second Telemetry Snapshots
  const timeSeries = [];
  let isRunning = true;
  const startTime = Date.now();
  const endTime = startTime + durationSec * 1000;

  let lastReportedSec = 0;
  let lastRequestCount = 0;

  // Real-time Console Monitor Interval
  const monitorTimer = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    if (elapsedSec > lastReportedSec && elapsedSec <= durationSec) {
      const deltaRequests = totalRequests - lastRequestCount;
      const currentRps = deltaRequests / (elapsedSec - lastReportedSec);
      lastReportedSec = elapsedSec;
      lastRequestCount = totalRequests;

      const recentLatencies = latencies.slice(-deltaRequests);
      const recentAvg = recentLatencies.length
        ? recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length
        : 0;

      timeSeries.push({
        second: elapsedSec,
        instantaneousRps: Math.round(currentRps),
        totalRequestsSoFar: totalRequests,
        recentAvgLatencyMs: parseFloat(recentAvg.toFixed(1))
      });

      console.log(
        `  [T+${String(elapsedSec).padStart(2, '0')}s] ` +
        `Concurrency: ${concurrentUsers} VUs | ` +
        `Current RPS: ${String(Math.round(currentRps)).padStart(4, ' ')} req/sec | ` +
        `Avg Latency: ${recentAvg.toFixed(1).padStart(5, ' ')}ms | ` +
        `Completed: ${totalRequests} reqs`
      );
    }
  }, 1000);

  // Virtual User Worker Loop
  async function worker(vuId) {
    while (isRunning && Date.now() < endTime) {
      const ep = pickEndpoint(endpoints);
      const res = await makeRequest(baseUrl, ep);

      totalRequests++;
      latencies.push(res.latencyMs);

      const st = endpointStats[ep.path];
      st.count++;
      st.latencies.push(res.latencyMs);

      if (res.success) {
        successfulRequests++;
        st.success++;
      } else {
        failedRequests++;
        st.failed++;
      }

      // User think-time pacing to achieve sustained ~120 RPS across 100 concurrent VUs
      const thinkMin = config.profile.userThinkTimeMinMs || 550;
      const thinkMax = config.profile.userThinkTimeMaxMs || 750;
      const thinkTime = Math.floor(Math.random() * (thinkMax - thinkMin)) + thinkMin;
      await new Promise((r) => setTimeout(r, thinkTime));
    }
  }

  // Spawn all 100 Virtual Users Concurrently
  const vuPromises = [];
  for (let i = 1; i <= concurrentUsers; i++) {
    vuPromises.push(worker(i));
  }

  // Wait for duration to elapse
  await new Promise((r) => setTimeout(r, durationSec * 1000));
  isRunning = false;
  clearInterval(monitorTimer);

  // Wait for in-flight requests to complete (with 2s grace)
  await Promise.race([
    Promise.all(vuPromises),
    new Promise((r) => setTimeout(r, 2000))
  ]);

  const totalDurationMs = Date.now() - startTime;
  const totalDurationSec = totalDurationMs / 1000;
  const overallRps = totalRequests / totalDurationSec;

  // Latency Metrics
  const minLatency = latencies.length ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length ? Math.max(...latencies) : 0;
  const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const percentiles = calculatePercentiles(latencies);
  const errorRatePct = totalRequests ? (failedRequests / totalRequests) * 100 : 0;

  // SLA Verification
  const passesErrorRate = errorRatePct <= config.sla.maxErrorRatePct;
  const passesAvgLatency = avgLatency <= config.sla.maxAverageResponseTimeMs;
  const passesMaxLatency = maxLatency <= config.sla.maxResponseTimeMs;
  const passesThroughput = overallRps >= config.sla.minThroughputRps;
  const isSlaPassed = passesErrorRate && passesAvgLatency && passesMaxLatency;

  console.log('\n' + '='.repeat(85));
  console.log('   BASELINE LOAD TEST EXECUTION RESULTS');
  console.log('='.repeat(85));
  console.log(`  Test Execution Period  : ${totalDurationSec.toFixed(1)} seconds`);
  console.log(`  Virtual Concurrent Users: ${concurrentUsers} VUs`);
  console.log(`  Total Requests Sent    : ${totalRequests.toLocaleString()}`);
  console.log(`  Successful (200 OK)    : ${successfulRequests.toLocaleString()}`);
  console.log(`  Failed / Errors        : ${failedRequests}`);
  console.log(`  Error Rate             : ${errorRatePct.toFixed(2)}% (SLA Target: 0.00%)`);
  console.log('-'.repeat(85));
  console.log(`  REQUESTS PER SECOND (RPS):`);
  console.log(`    Average Throughput   : ${overallRps.toFixed(1)} req/sec (e.g. ~${Math.round(overallRps)} RPS)`);
  console.log(`    Peak Instantaneous   : ${timeSeries.length ? Math.max(...timeSeries.map(t => t.instantaneousRps)) : 0} req/sec`);
  console.log('-'.repeat(85));
  console.log(`  RESPONSE TIMES:`);
  console.log(`    Fastest / Min Latency: ${minLatency.toFixed(1)}ms`);
  console.log(`    Average Latency      : ${avgLatency.toFixed(1)}ms`);
  console.log(`    Slowest / Max Latency: ${maxLatency.toFixed(1)}ms`);
  console.log(`    P50 (Median)         : ${percentiles.p50.toFixed(1)}ms`);
  console.log(`    P75                  : ${percentiles.p75.toFixed(1)}ms`);
  console.log(`    P90                  : ${percentiles.p90.toFixed(1)}ms`);
  console.log(`    P95                  : ${percentiles.p95.toFixed(1)}ms`);
  console.log(`    P99                  : ${percentiles.p99.toFixed(1)}ms`);
  console.log('-'.repeat(85));
  console.log(`  PER-ENDPOINT BREAKDOWN:`);
  for (const [pathKey, st] of Object.entries(endpointStats)) {
    const epAvg = st.latencies.length
      ? (st.latencies.reduce((a, b) => a + b, 0) / st.latencies.length).toFixed(1)
      : '0.0';
    console.log(`    ${pathKey.padEnd(20)} : ${String(st.count).padStart(5, ' ')} reqs | Avg: ${epAvg.padStart(5, ' ')}ms | Success: ${st.success}/${st.count}`);
  }
  console.log('-'.repeat(85));
  console.log(`  OVERALL SLA ASSESSMENT : ${isSlaPassed ? '[PASS] 100% COMPLIANT' : '[FAIL] SLA EXCEEDED'}`);
  console.log('='.repeat(85) + '\n');

  // Export JSON Report
  const reportPayload = {
    summary: {
      concurrentUsers,
      durationSec: parseFloat(totalDurationSec.toFixed(1)),
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRatePct: parseFloat(errorRatePct.toFixed(2)),
      overallRps: parseFloat(overallRps.toFixed(1)),
      latency: {
        minMs: parseFloat(minLatency.toFixed(1)),
        avgMs: parseFloat(avgLatency.toFixed(1)),
        maxMs: parseFloat(maxLatency.toFixed(1)),
        ...Object.fromEntries(Object.entries(percentiles).map(([k, v]) => [k, parseFloat(v.toFixed(1))]))
      },
      sla: {
        isSlaPassed,
        passesErrorRate,
        passesAvgLatency,
        passesMaxLatency,
        passesThroughput
      }
    },
    endpointStats: Object.fromEntries(
      Object.entries(endpointStats).map(([k, v]) => [
        k,
        {
          count: v.count,
          success: v.success,
          failed: v.failed,
          avgMs: v.latencies.length ? parseFloat((v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length).toFixed(1)) : 0
        }
      ])
    ),
    timeSeries
  };

  const jsonReportPath = path.resolve(REPORTS_DIR, 'load-test-results.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportPayload, null, 2), 'utf-8');
  console.log(`  JSON Execution Telemetry Saved: ${jsonReportPath}`);

  return reportPayload;
}

if (require.main === module) {
  runBaselineLoadTest()
    .then((res) => {
      if (!res.summary.sla.isSlaPassed) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal load test error:', err);
      process.exit(1);
    });
}

module.exports = { runBaselineLoadTest };
