/**
 * Baseline and Concurrency Load Testing Configuration
 * Defines target URLs, virtual user concurrency, duration, and SLA performance budgets.
 */

module.exports = {
  // Target environment endpoints
  targets: {
    backendBaseUrl: process.env.BACKEND_URL || 'http://127.0.0.1:8000',
    webBaseUrl: process.env.WEB_URL || 'http://localhost:5173',
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        weight: 35,
        expectedStatus: 200,
        description: 'Root health check probe'
      },
      {
        path: '/ready',
        method: 'GET',
        weight: 20,
        expectedStatus: 200,
        description: 'Readiness probe'
      },
      {
        path: '/api/v1/health/live',
        method: 'GET',
        weight: 25,
        expectedStatus: 200,
        description: 'V1 API health monitor'
      },
      {
        path: '/api/v1/outfits',
        method: 'GET',
        weight: 15,
        expectedStatus: [200, 401],
        description: 'Public outfit catalogue query'
      },
      {
        path: '/docs',
        method: 'GET',
        weight: 5,
        expectedStatus: 200,
        description: 'OpenAPI documentation schema'
      }
    ]
  },

  // Load generation profile
  profile: {
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '100', 10),
    durationSeconds: parseInt(process.env.DURATION_SEC || '60', 10),
    rampUpSeconds: parseInt(process.env.RAMP_UP_SEC || '3', 10),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '5000', 10),
    targetRps: parseInt(process.env.TARGET_RPS || '120', 10), // Target throughput: 120 req/sec
    userThinkTimeMinMs: 550, // Realistic user think-time between clicks
    userThinkTimeMaxMs: 750
  },

  // SLA Performance Budgets (Thresholds)
  sla: {
    maxErrorRatePct: 0.0, // 100% pass criteria: 0 errors
    maxAverageResponseTimeMs: 400, // Average latency SLA (Target ~250ms, budget <400ms)
    maxResponseTimeMs: 1500, // Maximum response time SLA (<1500ms / 1.5s)
    minThroughputRps: 80 // Minimum acceptable sustained RPS (Target ~120 RPS)
  }
};
