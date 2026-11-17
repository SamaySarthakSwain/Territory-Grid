/**
 * Territory Grid - Full End-to-End LAN Gameplay & Strict Station Audit Test
 * Validates:
 * 1. Database Document Engine (Pure Local / Zero Cloud)
 * 2. Strict Initial Places (Atrium, LHC, Galaria)
 * 3. Uniform Marshal & Cone Color Distribution (No Duplicate Stations)
 * 4. Game State Lifecycle (LOBBY -> COUNTDOWN -> PLAYER_PHASE)
 * 5. Strict Checkpoint Matching & Wrong-Station Rejection (Zero Points on Mismatch)
 * 6. Correct Checkpoint Award & Real-Time Card/Score Advancement
 * 7. Duplicate Checkpoint Prevention (Single Award per Station)
 * 8. Real-time Telemetry Synchronization across Portals
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const DATA_FILE = path.join(__dirname, '..', 'web_server', 'data', 'test_gameplay_db.json');

// Set test environment
process.env.DATA_FILE = DATA_FILE;
process.env.NODE_ENV = 'test';

// Reset test DB
if (fs.existsSync(DATA_FILE)) {
  fs.unlinkSync(DATA_FILE);
}

const apiHandler = require('../api/index.js');

const server = http.createServer((req, res) => {
  apiHandler(req, res);
});

function request(method, pathUrl, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: pathUrl,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ PASSED: ${message}`);
}

async function runAudit() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   TEST: FULL END-TO-END LAN GAMEPLAY & STRICT CHECKPOINT AUDIT       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  console.log(`📡 Local Test Server running on http://127.0.0.1:${PORT}\n`);

  try {
    // 1. HEALTH CHECK
    console.log('⚡ [STAGE 1] Server Health & Engine Telemetry');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Health endpoint responds with 200');
    assert(health.body.database.counts.placesTotal === 3, 'Initial canonical places count is exactly 3 (Atrium, LHC, Galaria)');
    console.log('  Telemetry Info:', health.body.database.provider);

    // 2. CHECK PLACES INTEGRITY
    console.log('\n⚡ [STAGE 2] Verify Strict Places (No Fake Places)');
    const placesRes = await request('GET', '/api/clues');
    assert(placesRes.status === 200, 'Places endpoint responds 200');
    const placeIds = placesRes.body.clues.map(p => p.zoneId.toUpperCase());
    assert(placeIds.includes('ATRIUM'), 'Contains ATRIUM');
    assert(placeIds.includes('LHC'), 'Contains LHC');
    assert(placeIds.includes('GALARIA'), 'Contains GALARIA');
    assert(placesRes.body.clues.length === 3, 'Zero fake places exist; exactly 3 places present');

    // 3. REGISTER 3 FIELD MARSHALS (Should be automatically & uniformly distributed)
    console.log('\n⚡ [STAGE 3] Register & Distribute 3 Field Marshals');
    const ts = Date.now();
    const m1 = await request('POST', '/api/auth/register', { name: 'Marshal Alpha', callsign: 'marshal_a_' + ts, password: 'pass', role: 'MEMBER' });
    const m2 = await request('POST', '/api/auth/register', { name: 'Marshal Bravo', callsign: 'marshal_b_' + ts, password: 'pass', role: 'MEMBER' });
    const m3 = await request('POST', '/api/auth/register', { name: 'Marshal Charlie', callsign: 'marshal_c_' + ts, password: 'pass', role: 'MEMBER' });
    assert((m1.status === 201 || m1.status === 200) && (m2.status === 201 || m2.status === 200) && (m3.status === 201 || m3.status === 200), 'All 3 marshals registered');

    // Approve the marshals
    await request('POST', '/api/admin/approve-user', { userId: m1.body.user._id, isApproved: true });
    await request('POST', '/api/admin/approve-user', { userId: m2.body.user._id, isApproved: true });
    await request('POST', '/api/admin/approve-user', { userId: m3.body.user._id, isApproved: true });

    // Fetch updated marshals from database
    const dbAll = await request('GET', '/api/database/all');
    const marshals = dbAll.body.collections.users.filter(u => u.role === 'MEMBER' && u.callsign.includes(String(ts)));
    const assignedZones = new Set(marshals.map(m => m.zoneId.toUpperCase()));
    const assignedCones = new Set(marshals.map(m => m.coneColor.toUpperCase()));
    console.log('  Assigned Zones:', marshals.map(m => `${m.callsign}: ${m.zoneId} (${m.coneColor})`));
    assert(assignedZones.size === 3, 'All 3 marshals have DISTINCT locations (no duplicates)');
    assert(assignedCones.size === 3, 'All 3 marshals have DISTINCT cone colors (RED, YELLOW, GREEN)');

    // 4. REGISTER & APPROVE A SQUAD
    console.log('\n⚡ [STAGE 4] Register & Approve Squad "Vanguard"');
    const regSquad = await request('POST', '/api/auth/register', {
      name: 'Vanguard',
      callsign: 'team_' + ts,
      password: 'pass',
      role: 'PLAYER',
      members: ['Player One', 'Player Two']
    });
    assert(regSquad.status === 201 || regSquad.status === 200, 'Squad registered');
    const teamId = regSquad.body.user.teamId;

    const appSquad = await request('POST', '/api/admin/approve-team', { teamId: teamId, isApproved: true });
    assert(appSquad.status === 200, 'Squad approved by Game Master');

    // 5. TEST GAME STATE LIFECYCLE: LOBBY -> COUNTDOWN -> PLAYER_PHASE
    console.log('\n⚡ [STAGE 5] Game State Lifecycle Engine');
    const gsLobby = await request('GET', '/api/game/state');
    assert(gsLobby.body.state.status === 'LOBBY', 'Initial game state is LOBBY');

    const cdRes = await request('POST', '/api/game/state', { status: 'COUNTDOWN', countdownSeconds: 10, durationMinutes: 52 });
    assert(cdRes.status === 200, 'Initiated countdown');
    assert(cdRes.body.state.status === 'COUNTDOWN', 'State is now COUNTDOWN');
    assert(cdRes.body.countdownEndsAt !== undefined, 'Countdown end timestamp returned');

    // Start player phase
    const startRes = await request('POST', '/api/game/state', { status: 'PLAYER_PHASE', durationMinutes: 52 });
    assert(startRes.status === 200, 'Game started');
    assert(startRes.body.state.status === 'PLAYER_PHASE', 'State is now PLAYER_PHASE');

    // 6. SYNC SQUAD ROUTE & IDENTIFY ASSIGNED FIRST CHECKPOINT
    console.log('\n⚡ [STAGE 6] Squad Route & Target Clue Assignment');
    const syncRes1 = await request('GET', `/api/player/sync?teamId=${teamId}`);
    assert(syncRes1.status === 200, 'Player sync succeeds');
    assert(syncRes1.body.score === 0, 'Initial score is 0');
    assert(syncRes1.body.currentClueIndex === 0, 'Current clue index is 0');
    const assignedZone1 = syncRes1.body.activeClue.zoneId.toUpperCase();
    console.log(`  Squad Vanguard assigned first station: ${assignedZone1} (${syncRes1.body.activeClue.zoneLabel})`);

    // Find the marshal for assignedZone1 and a marshal for a WRONG station
    const correctMarshal = marshals.find(m => m.zoneId.toUpperCase() === assignedZone1);
    const wrongMarshal = marshals.find(m => m.zoneId.toUpperCase() !== assignedZone1);
    assert(correctMarshal !== undefined, 'Found marshal at assigned target station');
    assert(wrongMarshal !== undefined, 'Found marshal at different station');

    // 7. WRONG STATION CHECK: Attempt checkin at wrong station
    console.log(`\n⚡ [STAGE 7] Strict Station Enforcement: Scan at WRONG station (${wrongMarshal.zoneId})`);
    const wrongScanRes = await request('POST', '/api/checkin', {
      teamId: teamId,
      zoneId: wrongMarshal.zoneId,
      memberId: wrongMarshal.callsign,
      cone: wrongMarshal.coneColor,
      cardRank: 10,
      cardSuit: '♠'
    });
    assert(wrongScanRes.status === 400, 'Server REJECTS wrong station check-in with HTTP 400');
    assert(wrongScanRes.body.wrongStation === true, 'Response specifies wrongStation: true');
    console.log('  Rejection message:', wrongScanRes.body.error);

    // Verify squad points remained 0
    const syncAfterFail = await request('GET', `/api/player/sync?teamId=${teamId}`);
    assert(syncAfterFail.body.score === 0, 'Squad points REMAIN 0 after wrong station attempt');
    assert(syncAfterFail.body.currentClueIndex === 0, 'Squad clue index does NOT advance');

    // 8. CORRECT STATION CHECK: Scan at designated station
    console.log(`\n⚡ [STAGE 8] Scan at CORRECT station (${correctMarshal.zoneId})`);
    const conePoints = correctMarshal.conePoints || (correctMarshal.coneColor === 'GREEN' ? 15 : (correctMarshal.coneColor === 'RED' ? 10 : 12));
    const cardRank = 10;
    const expectedPoints = conePoints + cardRank;

    const correctScanRes = await request('POST', '/api/checkin', {
      teamId: teamId,
      zoneId: correctMarshal.zoneId,
      memberId: correctMarshal.callsign,
      cone: correctMarshal.coneColor,
      cardRank: cardRank,
      cardSuit: '♠'
    });
    assert(correctScanRes.status === 200, 'Server ACCEPTS correct station check-in with HTTP 200');
    assert(correctScanRes.body.pointsAwarded === expectedPoints, `Correctly awarded ${expectedPoints} PTS (${conePoints} cone + ${cardRank} card)`);
    assert(correctScanRes.body.teamScore === expectedPoints, `Squad total score updated to ${expectedPoints}`);
    assert(correctScanRes.body.currentClueIndex === 1, 'Clue index advanced to 1');
    const nextZone = correctScanRes.body.nextZoneId.toUpperCase();
    assert(nextZone !== assignedZone1, `Squad target advanced to NEW station: ${nextZone} (${correctScanRes.body.nextZoneLabel})`);

    // 9. DUPLICATE CHECK: Attempting scan again at the same station
    console.log(`\n⚡ [STAGE 9] Duplicate Prevention: Attempt scan again at cleared station (${correctMarshal.zoneId})`);
    const dupScanRes = await request('POST', '/api/checkin', {
      teamId: teamId,
      zoneId: correctMarshal.zoneId,
      memberId: correctMarshal.callsign,
      cone: correctMarshal.coneColor,
      cardRank: 10,
      cardSuit: '♠'
    });
    assert(dupScanRes.status === 400, 'Server REJECTS duplicate station check-in with HTTP 400');
    assert(dupScanRes.body.alreadyVisited === true, 'Response specifies alreadyVisited: true');

    // 10. REAL-TIME PORTAL SYNCHRONIZATION AUDIT
    console.log('\n⚡ [STAGE 10] Real-Time Multi-Portal Telemetry Verification');
    // Player Portal Sync
    const playerSyncFinal = await request('GET', `/api/player/sync?teamId=${teamId}`);
    assert(playerSyncFinal.body.score === expectedPoints, `Player Portal reflects ${expectedPoints} PTS`);
    assert(playerSyncFinal.body.cards.length === 1, 'Player Portal shows 1 card collected in inventory');
    assert(playerSyncFinal.body.activeClue.zoneId.toUpperCase() === nextZone, `Player Portal active clue is ${nextZone}`);

    // Leaderboard / Teams Sync
    const teamsSync = await request('GET', '/api/teams');
    const teamRecord = teamsSync.body.teams.find(t => t._id === teamId);
    assert(teamRecord.score === expectedPoints, `Leaderboard reflects ${expectedPoints} PTS for squad`);
    assert(teamRecord.visitedZones.length === 1, 'Visited zones contains 1 cleared station');

    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL 10 GAMEPLAY AUDIT STAGES PASSED WITH 100% SUCCESS!');
    console.log('══════════════════════════════════════════════════════════════════════\n');

  } finally {
    server.close();
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
  }
}

runAudit().catch(err => {
  console.error('\n❌ Audit encountered an error:', err);
  process.exit(1);
});
