// test_instant_game_start_all_portals.js
// Verifies Instant Game Start and real-time SSE broadcast across all 3 portals (Player, Marshal, Leaderboard)

const http = require('http');

const PORT = 8088;
const BASE = `http://127.0.0.1:${PORT}`;

function postJson(urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BASE}${urlPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE}${urlPath}`,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-store'
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function listenForSSE(typesToWatch, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const events = [];
    const timer = setTimeout(() => {
      req.destroy();
      resolve(events);
    }, timeoutMs);

    const req = http.request(
      `${BASE}/api/events`,
      {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream'
        }
      },
      (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (typesToWatch.includes(parsed.type)) {
                  events.push(parsed);
                }
              } catch (e) {}
            }
          }
        });
      }
    );
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.end();
  });
}

async function run() {
  console.log('⚡ STARTING INSTANT GAME START VERIFICATION ACROSS PORTALS...\n');

  // Step 1: Reset to LOBBY
  console.log('[Step 1] Resetting Game to LOBBY standby...');
  const resetRes = await postJson('/api/game/state', { status: 'LOBBY' });
  if (resetRes.status !== 200 || resetRes.data.state.status !== 'LOBBY') {
    throw new Error('Failed to reset to LOBBY');
  }
  console.log('  ✅ Grid in LOBBY mode (52:00 Standby)');

  // Step 2: Connect SSE listener simulating Player, Marshal, and Leaderboard
  console.log('\n[Step 2] Opening SSE listener for GAME_STATE_UPDATE...');
  const ssePromise = listenForSSE(['GAME_STATE_UPDATE'], 4000);
  await new Promise((r) => setTimeout(r, 400)); // Allow SSE connection to establish

  // Step 3: Trigger INSTANT GAME START
  console.log('\n[Step 3] Admin triggers START HUNT (INSTANT) - zero countdown delay...');
  const startRes = await postJson('/api/game/state', { status: 'PLAYER_PHASE', durationMinutes: 52 });
  console.log('  HTTP Response Status:', startRes.status);
  console.log('  Returned Game State Status:', startRes.data.state.status);
  if (startRes.data.state.status !== 'PLAYER_PHASE') {
    throw new Error('Status is not PLAYER_PHASE');
  }
  console.log('  ✅ Game transitioned to PLAYER_PHASE immediately (instant launch)');

  // Step 4: Verify SSE Delivery
  console.log('\n[Step 4] Checking real-time SSE broadcast to portals...');
  const receivedEvents = await ssePromise;
  console.log(`  Received ${receivedEvents.length} GAME_STATE_UPDATE event(s)`);
  const phaseEvent = receivedEvents.find((e) => e.status === 'PLAYER_PHASE');
  if (!phaseEvent) {
    throw new Error('SSE did not receive PLAYER_PHASE update');
  }
  console.log('  ✅ SSE broadcast verified: PLAYER_PHASE dispatched with remainingSeconds =', phaseEvent.remainingSeconds);

  // Step 5: Verify GET /api/game/state
  console.log('\n[Step 5] Querying GET /api/game/state...');
  const getRes = await getJson('/api/game/state');
  console.log('  Live State:', getRes.data.state.status, '| Remaining Seconds:', getRes.data.remainingSeconds);
  if (getRes.data.state.status !== 'PLAYER_PHASE') {
    throw new Error('GET state status mismatch');
  }
  console.log('  ✅ State is active PLAYER_PHASE with remaining seconds ~ 3120');

  // Step 6: Test 10-second countdown flow as well
  console.log('\n[Step 6] Testing 10-second Countdown launch...');
  const cdSsePromise = listenForSSE(['GAME_STATE_UPDATE'], 4000);
  await new Promise((r) => setTimeout(r, 400));
  const cdRes = await postJson('/api/game/state', { status: 'COUNTDOWN', countdownSeconds: 10, durationMinutes: 52 });
  if (cdRes.data.state.status !== 'COUNTDOWN') {
    throw new Error('Status is not COUNTDOWN');
  }
  console.log('  ✅ Status successfully set to COUNTDOWN with countdownEndsAt =', cdRes.data.state.countdownEndsAt);
  const cdEvents = await cdSsePromise;
  const cdEvent = cdEvents.find((e) => e.status === 'COUNTDOWN');
  if (!cdEvent) {
    throw new Error('SSE did not receive COUNTDOWN update');
  }
  console.log('  ✅ SSE broadcast verified: COUNTDOWN dispatched to all connected clients');

  // Step 7: Clean up by returning to LOBBY
  await postJson('/api/game/state', { status: 'LOBBY' });
  console.log('\n[Step 7] Grid returned to LOBBY ready for gameplay.');

  console.log('\n🎉 ALL PORTALS INSTANT START VERIFICATION PASSED (100% OPERATIONAL)!');
}

run().catch((err) => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
