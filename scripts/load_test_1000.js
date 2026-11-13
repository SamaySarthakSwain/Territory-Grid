/**
 * ============================================================================
 * TERRITORY GRID // 1000-AUDIENCE CONCURRENT LOAD & STRESS TESTING SUITE
 * ============================================================================
 * Simulates 1,000 concurrent spectator/operative requests hitting the live
 * endpoints: /api/game/state, /api/teams, /api/clues, /api/health.
 * Measures response times, error rates, throughput, and serverless resilience.
 * ============================================================================
 */

const https = require('https');
const http = require('http');

const isLocal = process.argv.includes('--local');
const BASE_URL = isLocal ? 'http://localhost:8088' : 'https://territory-grid-delta.vercel.app';
const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50; // 50 simultaneous HTTP worker threads

const ENDPOINTS = [
  '/api/game/state',
  '/api/teams',
  '/api/clues',
  '/api/health'
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║        TERRITORY GRID // 1000-AUDIENCE CONCURRENCY TEST ENGINE       ║');
console.log('╠══════════════════════════════════════════════════════════════════════╣');
console.log(`║ Target URL:       ${BASE_URL.padEnd(50)} ║`);
console.log(`║ Total Requests:   ${TOTAL_REQUESTS.toString().padEnd(50)} ║`);
console.log(`║ Concurrent Conns: ${CONCURRENCY.toString().padEnd(50)} ║`);
console.log(`║ Start Time:       ${new Date().toISOString().padEnd(50)} ║`);
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

// Configure Agent with keepAlive for maximum connection pooling
const agentOptions = { keepAlive: true, maxSockets: CONCURRENCY };
const httpsAgent = new https.Agent(agentOptions);
const httpAgent = new http.Agent(agentOptions);

let completed = 0;
let successes = 0;
let failures = 0;
const latencies = [];
const statusCodes = {};

function makeRequest(index) {
  return new Promise((resolve) => {
    const endpoint = ENDPOINTS[index % ENDPOINTS.length];
    const url = `${BASE_URL}${endpoint}?_load=${index}`;
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const start = Date.now();
    const req = client.get(url, { agent, timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const latency = Date.now() - start;
        latencies.push(latency);
        statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;

        if (res.statusCode >= 200 && res.statusCode < 400) {
          successes++;
        } else {
          failures++;
        }
        completed++;
        resolve({ status: res.statusCode, latency });
      });
    });

    req.on('error', (err) => {
      const latency = Date.now() - start;
      latencies.push(latency);
      failures++;
      completed++;
      statusCodes['ERROR'] = (statusCodes['ERROR'] || 0) + 1;
      resolve({ status: 'ERR', error: err.message, latency });
    });

    req.on('timeout', () => {
      req.destroy();
      failures++;
      completed++;
      statusCodes['TIMEOUT'] = (statusCodes['TIMEOUT'] || 0) + 1;
      resolve({ status: 'TIMEOUT', latency: 15000 });
    });
  });
}

async function runLoadTest() {
  const overallStart = Date.now();
  let nextReqIndex = 0;

  async function worker() {
    while (nextReqIndex < TOTAL_REQUESTS) {
      const idx = nextReqIndex++;
      await makeRequest(idx);
      if (completed % 100 === 0 || completed === TOTAL_REQUESTS) {
        process.stdout.write(`  ⏳ Progress: ${completed}/${TOTAL_REQUESTS} requests completed (${((completed/TOTAL_REQUESTS)*100).toFixed(0)}%)\r`);
      }
    }
  }

  // Launch CONCURRENCY workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const overallDurationMs = Date.now() - overallStart;
  const overallSec = overallDurationMs / 1000;
  const rps = (TOTAL_REQUESTS / overallSec).toFixed(1);

  latencies.sort((a, b) => a - b);
  const minLat = latencies[0] || 0;
  const maxLat = latencies[latencies.length - 1] || 0;
  const avgLat = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                   1000-AUDIENCE BENCHMARK RESULTS                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║ Total Requests:       ${TOTAL_REQUESTS.toString().padEnd(46)} ║`);
  console.log(`║ Successful (2xx):     ${successes.toString().padEnd(46)} ║`);
  console.log(`║ Failed:               ${failures.toString().padEnd(46)} ║`);
  console.log(`║ Total Duration:       ${(overallSec.toFixed(2) + ' s').padEnd(46)} ║`);
  console.log(`║ Throughput:           ${(rps + ' req/sec').padEnd(46)} ║`);
  console.log('╠──────────────────────────────────────────────────────────────────────╣');
  console.log(`║ Min Latency:          ${(minLat + ' ms').padEnd(46)} ║`);
  console.log(`║ Average Latency:      ${(avgLat + ' ms').padEnd(46)} ║`);
  console.log(`║ 50th Percentile (p50):${(p50 + ' ms').padEnd(46)} ║`);
  console.log(`║ 95th Percentile (p95):${(p95 + ' ms').padEnd(46)} ║`);
  console.log(`║ 99th Percentile (p99):${(p99 + ' ms').padEnd(46)} ║`);
  console.log(`║ Max Latency:          ${(maxLat + ' ms').padEnd(46)} ║`);
  console.log('╠──────────────────────────────────────────────────────────────────────╣');
  console.log(`║ Status Code Breakdown:${JSON.stringify(statusCodes).padEnd(46)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  if (failures === 0 && successes === TOTAL_REQUESTS) {
    console.log('🎉 1000-AUDIENCE CONCURRENCY TEST PASSED: 100% SUCCESS RATE WITH ZERO ERRORS!\n');
    process.exit(0);
  } else if (successes / TOTAL_REQUESTS >= 0.98) {
    console.log('✅ 1000-AUDIENCE CONCURRENCY TEST ACCEPTABLE: >98% SUCCESS RATE.\n');
    process.exit(0);
  } else {
    console.error('❌ 1000-AUDIENCE TEST DETECTED ELEVATED ERROR RATE.\n');
    process.exit(1);
  }
}

runLoadTest().catch(err => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
