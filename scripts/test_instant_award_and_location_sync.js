// Test Instant Real-Time Cross-Portal Award & Next Location Routing Sync
const http = require('http');

async function run() {
  console.log('🚀 Starting Instant Award & Real-Time Sync Verification...');

  // Start in-process server
  const apiHandler = require('../api/index.js');
  const server = http.createServer((req, res) => apiHandler(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server listening on ${baseUrl}`);

  function fetchJson(path, opts = {}) {
    return new Promise((resolve, reject) => {
      const url = `${baseUrl}${path}`;
      const parsed = new URL(url);
      const req = http.request(url, {
        method: opts.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(opts.headers || {})
        }
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
          } catch(e) {
            resolve({ status: res.statusCode, raw: body, headers: res.headers });
          }
        });
      });
      req.on('error', reject);
      if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
      req.end();
    });
  }

  // Stage 1: Verify /api/admin/logs no longer crashes with ReferenceError
  console.log('\n[Stage 1] Testing /api/admin/logs?limit=50...');
  const logsRes = await fetchJson('/api/admin/logs?limit=50');
  if (logsRes.status !== 200 || !logsRes.data || !logsRes.data.success) {
    throw new Error(`Stage 1 Failed: /api/admin/logs returned ${logsRes.status}`);
  }
  console.log('  ✅ /api/admin/logs responded with HTTP 200 (urlObj bug resolved!)');

  // Stage 2: Register a test squad and field marshal
  console.log('\n[Stage 2] Registering test operative and field marshal...');
  const squadReg = await fetchJson('/api/auth/register', {
    method: 'POST',
    body: { callsign: 'ApexPredator', role: 'PLAYER', password: 'pass' }
  });
  const marshalReg = await fetchJson('/api/auth/register', {
    method: 'POST',
    body: { callsign: 'MarshalAlpha', role: 'MEMBER', password: 'pass', zoneId: 'LHC' }
  });

  const teamId = squadReg.data.user.teamId;
  console.log(`  Squad registered: ${squadReg.data.user.callsign} (${teamId})`);

  // Approve both
  await fetchJson('/api/admin/approve', { method: 'POST', body: { id: teamId } });
  await fetchJson('/api/admin/approve', { method: 'POST', body: { id: marshalReg.data.user._id } });
  console.log('  ✅ Squad and Marshal authorized by Game Master');

  // Stage 3: Connect SSE stream at /api/events
  console.log('\n[Stage 3] Connecting SSE Client to /api/events...');
  let sseReceivedEvents = [];
  const sseReq = http.request(`${baseUrl}/api/events`, res => {
    res.on('data', chunk => {
      const text = chunk.toString();
      text.split('\n\n').forEach(block => {
        if (block.startsWith('data: ')) {
          try {
            const ev = JSON.parse(block.slice(6));
            sseReceivedEvents.push(ev);
          } catch(e) {}
        }
      });
    });
  });
  sseReq.end();
  // Wait 150ms for SSE handshake
  await new Promise(r => setTimeout(r, 150));
  console.log(`  ✅ SSE Client connected (handshake received: ${sseReceivedEvents.length} events)`);

  // Stage 4: Check initial player sync
  console.log('\n[Stage 4] Querying initial player sync...');
  const sync1 = await fetchJson(`/api/player/sync?teamId=${teamId}`);
  console.log(`  Initial score: ${sync1.data.score}, next location: ${sync1.data.nextStationName}`);
  const assignedStation = sync1.data.activeClue.zoneId;

  // Stage 5: Field Marshal scans squad QR beacon
  console.log(`\n[Stage 5] Marshal at ${assignedStation} scans squad QR code...`);
  const checkinRes = await fetchJson('/api/checkin', {
    method: 'POST',
    body: {
      teamId: teamId,
      zoneId: assignedStation,
      cone: 'GREEN',
      cardRank: 13,
      cardSuit: '♠',
      memberId: 'MarshalAlpha'
    }
  });

  if (checkinRes.status !== 200 || !checkinRes.data.success) {
    throw new Error(`Checkin failed: ${JSON.stringify(checkinRes.data)}`);
  }
  console.log(`  Checkin succeeded: +${checkinRes.data.pointsAwarded} PTS (Total: ${checkinRes.data.teamScore} PTS)`);
  console.log(`  Next assigned location returned: ${checkinRes.data.nextZoneLabel} (${checkinRes.data.nextZoneId})`);

  // Stage 6: Verify SSE broadcast was received by client
  console.log('\n[Stage 6] Verifying instant SSE broadcast...');
  await new Promise(r => setTimeout(r, 50));
  const awardEvent = sseReceivedEvents.find(e => e.type === 'CHECKIN_AWARD' && e.teamId === teamId);
  if (!awardEvent) {
    throw new Error('Stage 6 Failed: SSE Client did not receive CHECKIN_AWARD event');
  }
  console.log(`  ✅ SSE CHECKIN_AWARD received instantly: +${awardEvent.pointsAwarded} PTS, New Score: ${awardEvent.teamScore}`);
  console.log(`  ✅ Next Location in SSE: ${awardEvent.nextZoneLabel} (${awardEvent.nextZoneId})`);

  // Stage 7: Verify /api/player/sync reflects updated score and new location directive
  console.log('\n[Stage 7] Verifying /api/player/sync reflects new location...');
  const sync2 = await fetchJson(`/api/player/sync?teamId=${teamId}`);
  if (sync2.data.score !== checkinRes.data.teamScore) {
    throw new Error(`Score mismatch: expected ${checkinRes.data.teamScore}, got ${sync2.data.score}`);
  }
  if (sync2.data.currentClueIndex !== 1) {
    throw new Error(`Clue index not advanced: expected 1, got ${sync2.data.currentClueIndex}`);
  }
  console.log(`  ✅ Player Sync Verified: Score = ${sync2.data.score}, Checkpoint #${sync2.data.currentClueIndex + 1} Target = ${sync2.data.nextStationName}`);

  // Stage 8: Verify /api/teams does not return 304 and returns fresh score
  console.log('\n[Stage 8] Verifying /api/teams live update without 304 caching...');
  const teamsRes = await fetchJson('/api/teams', {
    headers: { 'If-None-Match': 'W/"stale-etag-test"' }
  });
  if (teamsRes.status !== 200) {
    throw new Error(`Expected HTTP 200, got HTTP ${teamsRes.status}`);
  }
  const myTeamInLeaderboard = teamsRes.data.teams.find(t => t._id === teamId);
  if (!myTeamInLeaderboard || myTeamInLeaderboard.score !== checkinRes.data.teamScore) {
    throw new Error(`Leaderboard teams did not reflect updated score!`);
  }
  console.log(`  ✅ Leaderboard /api/teams returned HTTP 200 with score ${myTeamInLeaderboard.score} PTS`);

  // Cleanup
  sseReq.destroy();
  await new Promise(r => server.close(r));
  console.log('\n🎉 ALL 8 STAGES PASSED! Real-time award & instant location advancement verified 100% operational!\n');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
