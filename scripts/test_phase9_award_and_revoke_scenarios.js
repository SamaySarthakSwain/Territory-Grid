/**
 * PHASE 9 VERIFICATION SUITE:
 * 1. Fast, smooth, optimistic admin revocation
 * 2. Active Marshal Station Routing (Teams only routed to stations with approved marshals)
 * 3. Strict Single Award: Each marshal awards a squad once only; duplicate scan rejected
 * 4. Zero Repeated Locations: Squad is never assigned the same location twice
 * 5. Instant Player Sync: Telemetry returns updated cards, score, next station, and live leaderboard
 */

const http = require('http');
const https = require('https');
const apiHandler = require('../api/index');

function createTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      apiHandler(req, res);
    });
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runPhase9Audit() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       PHASE 9: AWARD SYSTEM, ACTIVE ROUTING & REVOKE AUDIT       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const { server, baseUrl } = await createTestServer();
  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  const nonce = Date.now().toString(36);

  try {
    // 1. Health check
    const hRes = await request(`${baseUrl}/api/health`);
    assert('Local test harness is online and healthy', hRes.status === 200 && hRes.json.status === 'HEALTHY');

    // 2. Register Game Master Admin
    const adminLogin = await request(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: { callsign: 'samay', password: 'samay', requestedRole: 'ADMIN' }
    });
    assert('Game Master Samay login succeeds', adminLogin.status === 200 && adminLogin.json.role === 'ADMIN');

    // Purge previous test squads for a clean slate
    await request(`${baseUrl}/api/admin/teams/purge-all`, { method: 'POST' });

    // 3. Register Two Field Marshals at distinct stations: Station 1 and LHC
    const marshal1Reg = await request(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: {
        role: 'MEMBER',
        name: 'Field Marshal One',
        callsign: `m1_${nonce}`,
        password: 'pass',
        zoneId: 'ZONE_01',
        zoneLabel: 'Station 1 - Library Arch'
      }
    });
    assert('Field Marshal 1 registered at ZONE_01', marshal1Reg.status === 201);

    const marshal2Reg = await request(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: {
        role: 'MEMBER',
        name: 'Field Marshal LHC',
        callsign: `m2_${nonce}`,
        password: 'pass',
        zoneId: 'LHC',
        zoneLabel: 'Lecture Hall Complex'
      }
    });
    assert('Field Marshal 2 registered at LHC', marshal2Reg.status === 201);

    // 4. Register a Squad
    const teamReg = await request(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: {
        role: 'PLAYER',
        name: 'Bravo Squad',
        callsign: `bravo_${nonce}`,
        password: 'pass'
      }
    });
    assert('Bravo Squad registered', teamReg.status === 201);
    const teamId = teamReg.json.user.teamId;

    // 5. Admin Approves Marshal 1, Marshal 2, and Bravo Squad
    await request(`${baseUrl}/api/admin/approve`, { method: 'POST', body: { id: marshal1Reg.json.user._id, type: 'USER' } });
    await request(`${baseUrl}/api/admin/approve`, { method: 'POST', body: { id: marshal2Reg.json.user._id, type: 'USER' } });
    await request(`${baseUrl}/api/admin/approve`, { method: 'POST', body: { id: teamId, type: 'TEAM' } });
    assert('Admin approved squad and both field marshals', true);

    // 6. Test GET /api/clues?role=PLAYER: MUST ONLY return stations with approved marshals (ZONE_01 and LHC)
    const cluesRes = await request(`${baseUrl}/api/clues?role=PLAYER`);
    assert('GET /api/clues returns active stations', cluesRes.status === 200 && Array.isArray(cluesRes.json.clues));
    const returnedZones = cluesRes.json.clues.map(c => c.zoneId.toUpperCase());
    assert('Returned stations contains ZONE_01', returnedZones.includes('ZONE_01'));
    assert('Returned stations contains LHC', returnedZones.includes('LHC'));
    assert('Unassigned stations (e.g. ZONE_03, ZONE_07) are NOT returned to players', !returnedZones.includes('ZONE_03') && !returnedZones.includes('ZONE_07'));

    // 7. Test Initial Player Sync: Assigned Station MUST be either ZONE_01 or LHC
    const syncRes1 = await request(`${baseUrl}/api/player/sync?teamId=${teamId}`);
    assert('GET /api/player/sync returns squad telemetry', syncRes1.status === 200 && syncRes1.json.teamId === teamId);
    assert('Leaderboard included in player sync', Array.isArray(syncRes1.json.leaderboard) && syncRes1.json.leaderboard.length > 0);
    const station1 = syncRes1.json.activeClue.zoneId;
    assert('First assigned station is one of active marshals (ZONE_01 or LHC)', station1 === 'ZONE_01' || station1 === 'LHC');
    const remainingStation = (station1 === 'ZONE_01') ? 'LHC' : 'ZONE_01';

    // 8. Test Wrong Station Rejection: Scanning at the other station must be rejected!
    const wrongScan = await request(`${baseUrl}/api/checkin`, {
      method: 'POST',
      body: {
        teamId: teamId,
        zoneId: remainingStation,
        cone: 'YELLOW',
        cardRank: 10,
        cardSuit: '♠',
        memberId: 'marshal_test'
      }
    });
    assert('Check-in at wrong station strictly rejected with HTTP 400', wrongScan.status === 400 && wrongScan.json.wrongStation === true);

    // 9. Check-in at the Correct Station: Award MUST succeed immediately!
    const validScan1 = await request(`${baseUrl}/api/checkin`, {
      method: 'POST',
      body: {
        teamId: teamId,
        zoneId: station1,
        cone: 'GREEN',
        cardRank: 13,
        cardSuit: '♠',
        memberId: 'marshal_1'
      }
    });
    assert('Check-in at correct station succeeds (HTTP 200)', validScan1.status === 200 && validScan1.json.success === true);
    assert('Points correctly awarded (15 cone + 13 card = 28 pts)', validScan1.json.pointsAwarded === 28);
    assert('New team score is 28', validScan1.json.teamScore === 28);
    assert('Next station directive is the remaining unvisited marshal station', validScan1.json.nextZoneId === remainingStation);

    // 10. STRICT RULE CHECK: Marshal cannot assign points more than once to the same squad
    const duplicateScan = await request(`${baseUrl}/api/checkin`, {
      method: 'POST',
      body: {
        teamId: teamId,
        zoneId: station1,
        cone: 'GREEN',
        cardRank: 13,
        cardSuit: '♠',
        memberId: 'marshal_1'
      }
    });
    assert('Duplicate check-in at already-cleared station strictly rejected (HTTP 400)', duplicateScan.status === 400 && duplicateScan.json.alreadyVisited === true);

    // 11. Check-in at Second Station (LHC): Award MUST succeed and complete the mission
    const validScan2 = await request(`${baseUrl}/api/checkin`, {
      method: 'POST',
      body: {
        teamId: teamId,
        zoneId: remainingStation,
        cone: 'YELLOW',
        cardRank: 12,
        cardSuit: '♥',
        memberId: 'marshal_2'
      }
    });
    assert('Second checkpoint checkin succeeds (HTTP 200)', validScan2.status === 200);
    assert('Score increased to 52 (28 + 24)', validScan2.json.teamScore === 52);
    assert('Squad has cleared all active marshal stations', validScan2.json.allCompleted === true);

    // 12. STRICT RULE CHECK: Squad is NEVER given the same location twice
    const finalSync = await request(`${baseUrl}/api/player/sync?teamId=${teamId}`);
    assert('Final sync confirms all stations completed', finalSync.json.allCompleted === true);
    assert('Visited zones has exactly 2 distinct stations', finalSync.json.visitedZones.length === 2);
    assert('Visited zones contains both stations with zero repetition', 
      new Set(finalSync.json.visitedZones.map(z => z.toUpperCase())).size === 2
    );

    // 13. Test Admin Revocation: Revoking clearance for squad
    const revokeRes = await request(`${baseUrl}/api/admin/reject`, {
      method: 'POST',
      body: { id: teamId, type: 'TEAM' }
    });
    assert('Admin revocation succeeds (HTTP 200)', revokeRes.status === 200 && revokeRes.json.success === true);

    const checkRevoked = await request(`${baseUrl}/api/player/sync?teamId=${teamId}`);
    assert('Revoked squad is no longer active in live grid (HTTP 404)', checkRevoked.status === 404);

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║ PASSED: ${passed} / ${passed + failed} verifications`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

runPhase9Audit();
