/**
 * ============================================================================
 * TERRITORY GRID // SENIOR GAME DEVELOPER COMPREHENSIVE MATCH SIMULATION
 * ============================================================================
 * Configuration:
 *   - 20 Teams (Squads 01 to 20)
 *   - 12 Field Marshals (Staffing ZONE_01 through ZONE_12)
 *   - 1 Game Master Admin (Samay)
 *
 * Full Lifecycle Tested:
 *   1. Batch Registration & Waiting Hall Clearance
 *   2. Admin Authentication & Roster Authorization
 *   3. 12-Station Active Marshal Route Distribution & Load Balancing
 *   4. Synchronized 10s Countdown & Match Activation
 *   5. 240 Real-Time Check-In Cycles:
 *      - Strict wrong-station rejection
 *      - Accurate point calculation (Cone + Card Rank)
 *      - Card stamp persistence & visited-zone tracking
 *      - Strict duplicate scan prevention (one award per marshal)
 *      - Zero repeated stations guarantee
 *   6. Admin Live Interventions (Pause, Resume, Optimistic Revocation)
 *   7. Leaderboard Ranking & Card Deck Evaluation
 *   8. Match Termination & Post-Match Cleanup
 * ============================================================================
 */

process.env.DISABLE_CLOUD_STORE = 'true';
const http = require('http');
const https = require('https');
const apiHandler = require('../api/index');

const isLocal = process.argv.includes('--local') || true;
let BASE_URL = process.env.LOCAL_URL || '';
let localServer = null;

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const recordedIssues = [];

function assert(title, condition, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${title}${detail ? ' -> ' + detail : ''}`);
  } else {
    failedChecks++;
    const errMsg = `❌ [FAIL] ${title}${detail ? ' -> ' + detail : ''}`;
    console.error(errMsg);
    recordedIssues.push({ title, detail });
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(urlPath, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;
    const parsed = new URL(fullUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const reqOpts = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    let postData = null;
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(fullUrl, reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function startServer() {
  if (!BASE_URL) {
    return new Promise((resolve) => {
      localServer = http.createServer((req, res) => apiHandler(req, res));
      localServer.listen(0, '127.0.0.1', () => {
        BASE_URL = `http://127.0.0.1:${localServer.address().port}`;
        console.log(`[Harness] Tactical Simulation Server listening on ${BASE_URL}\n`);
        resolve();
      });
    });
  }
}

async function runSeniorDeveloperSimulation() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   TERRITORY GRID // SENIOR GAME DEV FULL MATCH SIMULATION ENGINE     ║');
  console.log('║   Configuration: 20 SQUADS | 12 STATIONS / MARSHALS | 1 ADMIN        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  await startServer();

  const nonce = Date.now().toString(36);
  const STATIONS = [
    { zoneId: 'ZONE_01', zoneLabel: 'Zone 1 - Library Arch' },
    { zoneId: 'ZONE_02', zoneLabel: 'Zone 2 - Solar Obelisk' },
    { zoneId: 'ZONE_03', zoneLabel: 'Zone 3 - Clocktower Terrace' },
    { zoneId: 'ZONE_04', zoneLabel: 'Zone 4 - Glasshouse Botanical' },
    { zoneId: 'ZONE_05', zoneLabel: 'Zone 5 - Skybridge Concourse' },
    { zoneId: 'ZONE_06', zoneLabel: 'Zone 6 - Amphitheater Canopy' },
    { zoneId: 'ZONE_07', zoneLabel: 'Zone 7 - Science Basin' },
    { zoneId: 'ZONE_08', zoneLabel: 'Zone 8 - Student Pavilion' },
    { zoneId: 'ZONE_09', zoneLabel: 'Zone 9 - North Telecom Pylon' },
    { zoneId: 'ZONE_10', zoneLabel: 'Zone 10 - Turf Perimeter' },
    { zoneId: 'ZONE_11', zoneLabel: 'Zone 11 - Energy Innovation Hub' },
    { zoneId: 'ZONE_12', zoneLabel: 'Zone 12 - Innovation Arena' }
  ];

  try {
    // -------------------------------------------------------------------------
    // STEP 0: CLEAN SLATE
    // -------------------------------------------------------------------------
    console.log('📌 [PHASE 0] Grid Reset & Clean Slate Initialization');
    const purgeInit = await request('/api/admin/teams/purge-all', { method: 'POST' });
    assert('Grid purge-all initializes clean state', purgeInit.status === 200);

    // -------------------------------------------------------------------------
    // STEP 1: REGISTER 12 FIELD MARSHALS ACROSS 12 CAMPUS STATIONS
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 1] Field Marshals Registration (12 Distinct Campus Stations)');
    const marshals = [];
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const callsign = `mr_${st.zoneId.toLowerCase()}_${nonce}`;
      const name = `Marshal ${st.zoneLabel}`;
      const reg = await request('/api/auth/register', { method: 'POST' }, {
        role: 'MEMBER',
        callsign,
        name,
        password: 'pass',
        zoneId: st.zoneId,
        zoneLabel: st.zoneLabel
      });
      assert(`Marshal #${i + 1} registered at ${st.zoneId}`, reg.status === 201 && reg.json.user);
      marshals.push({
        _id: reg.json.user._id,
        callsign,
        name,
        zoneId: st.zoneId,
        zoneLabel: st.zoneLabel
      });
    }

    // -------------------------------------------------------------------------
    // STEP 2: REGISTER 20 TACTICAL SQUADS
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 2] Tactical Squads Registration (20 Teams in Waiting Hall)');
    const squads = [];
    for (let i = 1; i <= 20; i++) {
      const padNum = String(i).padStart(2, '0');
      const callsign = `squad_${padNum}_${nonce}`;
      const name = `Squad ${padNum} Phoenix`;
      const reg = await request('/api/auth/register', { method: 'POST' }, {
        role: 'PLAYER',
        callsign,
        name,
        password: 'pass'
      });
      assert(`Squad #${i} (${callsign}) registered with WAITING_APPROVAL`, reg.status === 201 && reg.json.status === 'WAITING_APPROVAL');
      squads.push({
        _id: reg.json.user.teamId,
        userId: reg.json.user._id,
        callsign,
        name,
        squadIndex: i
      });
    }

    // -------------------------------------------------------------------------
    // STEP 3: ADMIN CLEARANCE AUTHORIZATION
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 3] Game Master Admin Login & Clearance Approvals');
    const adminLogin = await request('/api/auth/login', { method: 'POST' }, {
      callsign: 'samay',
      password: 'samay',
      requestedRole: 'ADMIN'
    });
    assert('Game Master Admin authentication succeeds', adminLogin.status === 200 && adminLogin.json.role === 'ADMIN');

    // Approve all 12 marshals
    for (const m of marshals) {
      const appUser = await request('/api/admin/approve-user', { method: 'POST' }, {
        userId: m._id,
        id: m._id,
        callsign: m.callsign
      });
      assert(`Game Master approved Marshal for ${m.zoneId}`, appUser.status === 200 && appUser.json.success === true);
    }

    // Approve all 20 squads
    for (const s of squads) {
      const appTeam = await request('/api/admin/approve-team', { method: 'POST' }, {
        teamId: s._id,
        id: s._id
      });
      assert(`Game Master approved ${s.name}`, appTeam.status === 200 && appTeam.json.success === true);
    }

    // Verify all squads now active on live roster
    const liveTeamsRes = await request('/api/teams?_t=' + Date.now());
    const liveTeams = liveTeamsRes.json.teams || [];
    assert('Live roster contains all 20 squads', liveTeams.length === 20);
    const allApproved = liveTeams.every(t => t.isApproved === true);
    assert('All 20 squads are marked isApproved: true', allApproved);

    // -------------------------------------------------------------------------
    // STEP 4: ROUTE ENGINE & LOAD-BALANCED DISTRIBUTION
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 4] Active Marshal Checkpoints & Route Balancing Engine');
    // Player clues endpoint MUST return exactly the 12 staffed stations
    const activeCluesRes = await request('/api/clues?role=PLAYER&_t=' + Date.now());
    const activeClues = activeCluesRes.json.clues || [];
    assert('Active clues returns exactly 12 staffed stations', activeClues.length === 12);
    const unstaffedClueFound = activeClues.some(c => c.zoneId === 'ZONE_13');
    assert('Unstaffed Station 13 is excluded from player clues', !unstaffedClueFound);

    // Run rebalance
    const rebalanceRes = await request('/api/admin/rebalance-routes', { method: 'POST' });
    assert('Admin rebalance-routes succeeds', rebalanceRes.status === 200 && rebalanceRes.json.success === true);

    // Inspect starting station distribution across 20 squads
    const distributionMap = {};
    for (const s of squads) {
      const syncRes = await request(`/api/player/sync?teamId=${s._id}&_t=` + Date.now());
      assert(`Squad #${s.squadIndex} initial sync successful`, syncRes.status === 200 && syncRes.json.activeClue);
      const startingStation = syncRes.json.activeClue.zoneId;
      distributionMap[startingStation] = (distributionMap[startingStation] || 0) + 1;
      s.teamCode = syncRes.json.teamCode;
    }

    console.log('  Initial Squad Distribution across 12 stations:', JSON.stringify(distributionMap));
    const stationCounts = Object.values(distributionMap);
    const maxOnAnyStation = Math.max(...stationCounts);
    const minOnAnyStation = Math.min(...stationCounts);
    assert('No station has more than 3 squads assigned at start (Zero bottlenecks)', maxOnAnyStation <= 3, `Max on any station: ${maxOnAnyStation}`);
    assert('At least 8 distinct stations have starting squads', Object.keys(distributionMap).length >= 8, `Occupied stations: ${Object.keys(distributionMap).length}`);

    // -------------------------------------------------------------------------
    // STEP 5: MATCH LAUNCH PROTOCOL (10S COUNTDOWN -> ACTIVE)
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 5] Match Launch Protocol (10s Countdown -> 52-Min Live Hunt)');
    const startMatchRes = await request('/api/game/state', { method: 'POST' }, {
      status: 'COUNTDOWN',
      countdownSeconds: 10,
      durationMinutes: 52
    });
    assert('Match countdown protocol initiated (HTTP 200)', startMatchRes.status === 200);

    const matchStateCheck = await request('/api/game/state?_t=' + Date.now());
    assert('Game state status is COUNTDOWN', matchStateCheck.json.state.status === 'COUNTDOWN');
    assert('Countdown remaining seconds is active', matchStateCheck.json.countdownSeconds > 0 && matchStateCheck.json.countdownSeconds <= 10);
    assert('Countdown endsAt ISO string exists', !!matchStateCheck.json.countdownEndsAt);

    // Transition to ACTIVE
    await request('/api/game/state', { method: 'POST' }, { status: 'ACTIVE', durationMinutes: 52 });
    const activeState = await request('/api/game/state?_t=' + Date.now());
    assert('Game state status is now ACTIVE / PLAYER_PHASE', activeState.json.state.status === 'ACTIVE' || activeState.json.state.status === 'PLAYER_PHASE');

    // -------------------------------------------------------------------------
    // STEP 6: SIMULATED GAMEPLAY (20 SQUADS × 12 STATIONS = 240 VISITS)
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 6] Live Gameplay Execution (20 Squads Traversing 12 Campus Stations)');
    const CONE_COLORS = ['RED', 'YELLOW', 'GREEN']; // 10, 12, 15 pts
    const SUITS = ['♠', '♥', '♦', '♣'];

    for (let round = 1; round <= 12; round++) {
      console.log(`\n  --- CHECKPOINT ROUND ${round} / 12 ---`);
      
      for (let sqIdx = 0; sqIdx < squads.length; sqIdx++) {
        const squad = squads[sqIdx];
        
        // 6a. Get squad telemetry
        const syncRes = await request(`/api/player/sync?teamId=${squad._id}&_t=` + Date.now());
        const activeClue = syncRes.json.activeClue;
        assert(`Round ${round}: Squad #${squad.squadIndex} receives target station`, !!activeClue, activeClue ? activeClue.zoneId : 'NONE');
        
        if (!activeClue) continue;
        const targetStation = activeClue.zoneId;

        // 6b. SECURITY NEGATIVE TEST: Attempt check-in at WRONG station
        const otherStations = STATIONS.filter(st => st.zoneId !== targetStation);
        const wrongStationObj = otherStations[(sqIdx + round) % otherStations.length];
        const wrongMarshal = marshals.find(m => m.zoneId === wrongStationObj.zoneId);

        const wrongScanRes = await request('/api/checkin', { method: 'POST' }, {
          teamId: squad._id,
          zoneId: wrongStationObj.zoneId,
          cone: 'YELLOW',
          cardRank: 8,
          cardSuit: '♥',
          memberId: wrongMarshal.callsign
        });
        assert(`Round ${round}: Squad #${squad.squadIndex} scan at wrong station (${wrongStationObj.zoneId}) is STRICTLY REJECTED`,
          wrongScanRes.status === 400 && (wrongScanRes.json.wrongStation === true || wrongScanRes.json.alreadyVisited === true));

        // 6c. AUTHORIZED CHECK-IN AT ASSIGNED STATION
        const correctMarshal = marshals.find(m => m.zoneId === targetStation);
        const coneChoice = CONE_COLORS[(sqIdx + round) % CONE_COLORS.length];
        const coneValues = { RED: 10, YELLOW: 12, GREEN: 15 };
        const cardRankChoice = ((sqIdx * 3 + round * 5) % 13) + 1; // 1 to 13
        const cardSuitChoice = SUITS[(sqIdx + round) % 4];
        const expectedAwardPts = coneValues[coneChoice] + cardRankChoice;

        const correctScanRes = await request('/api/checkin', { method: 'POST' }, {
          teamId: squad._id,
          zoneId: targetStation,
          cone: coneChoice,
          cardRank: cardRankChoice,
          cardSuit: cardSuitChoice,
          memberId: correctMarshal.callsign
        });

        assert(`Round ${round}: Squad #${squad.squadIndex} correct scan at ${targetStation} succeeds (HTTP 200)`,
          correctScanRes.status === 200 && correctScanRes.json.success === true);
        assert(`Round ${round}: Squad #${squad.squadIndex} points awarded (${expectedAwardPts} PTS)`,
          correctScanRes.json && correctScanRes.json.pointsAwarded === expectedAwardPts);

        // 6d. DUPLICATE CHECK-IN NEGATIVE TEST (Single Award Rule)
        const dupScanRes = await request('/api/checkin', { method: 'POST' }, {
          teamId: squad._id,
          zoneId: targetStation,
          cone: 'RED',
          cardRank: 10,
          cardSuit: '♠',
          memberId: correctMarshal.callsign
        });
        assert(`Round ${round}: Duplicate scan at ${targetStation} strictly rejected with alreadyVisited: true`,
          dupScanRes.status === 400 && (dupScanRes.json.alreadyVisited === true || dupScanRes.json.wrongStation === true));
      }
    }

    // -------------------------------------------------------------------------
    // STEP 7: POST-HUNT SQUAD INTEGRITY & ZERO REPEATED STATIONS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 7] Final Roster & Zero-Repetition Mathematical Integrity Audit');
    const finalTeamsRes = await request('/api/teams?_t=' + Date.now());
    const finalTeams = finalTeamsRes.json.teams || [];

    for (const team of finalTeams) {
      const vz = team.visitedZones || [];
      const cards = team.cards || [];
      
      // Visited zones count
      assert(`Squad "${team.name}" has cleared all 12 stations`, vz.length === 12, `Visited count: ${vz.length}`);
      
      // Zero repetition check: set size must equal array length
      const uniqueZones = new Set(vz.map(z => z.toUpperCase()));
      assert(`Squad "${team.name}" has ZERO repeated locations (Strict Unique Set)`, uniqueZones.size === 12, `Unique: ${uniqueZones.size} / 12`);
      
      // Cards count matches 12 cards stamped
      assert(`Squad "${team.name}" collected 12 stamped playing cards`, cards.length === 12, `Cards count: ${cards.length}`);
    }

    // -------------------------------------------------------------------------
    // STEP 8: LIVE ADMIN INTERVENTIONS (PAUSE, RESUME, REVOKE)
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 8] Admin Real-Time Intervention Protocols');
    // 8a. Pause game
    const pauseRes = await request('/api/game/state', { method: 'POST' }, { status: 'PAUSED' });
    assert('Game Master pauses match (HTTP 200)', pauseRes.status === 200);
    const pauseCheck = await request('/api/game/state?_t=' + Date.now());
    assert('Game state status confirms PAUSED', pauseCheck.json.state.status === 'PAUSED');

    // 8b. Resume game
    const resumeRes = await request('/api/game/state', { method: 'POST' }, { status: 'RESUME' });
    assert('Game Master resumes match (HTTP 200)', resumeRes.status === 200);
    const resumeCheck = await request('/api/game/state?_t=' + Date.now());
    assert('Game state status confirms RESUMED / PLAYER_PHASE', resumeCheck.json.state.status === 'PLAYER_PHASE' || resumeCheck.json.state.status === 'ACTIVE');

    // 8c. Instant Squad Revocation
    const squadToRevoke = squads[12]; // Squad 13
    const revokeRes = await request('/api/admin/teams/remove', { method: 'POST' }, {
      teamId: squadToRevoke._id
    });
    assert(`Game Master instantly revokes Squad #${squadToRevoke.squadIndex} (${squadToRevoke.name})`,
      revokeRes.status === 200 && revokeRes.json.success === true);

    const teamsAfterRevoke = await request('/api/teams?_t=' + Date.now());
    const remainingTeams = teamsAfterRevoke.json.teams || [];
    assert('Roster decremented to 19 active squads after revocation', remainingTeams.length === 19);
    const revokedStillExists = remainingTeams.some(t => t._id === squadToRevoke._id);
    assert('Revoked squad is completely expunged from live grid', !revokedStillExists);

    // -------------------------------------------------------------------------
    // STEP 9: CHAMPIONSHIP LEADERBOARD & PODIUM VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 9] Championship Leaderboard Standings & Podium Rankings');
    const sortedLeaderboard = remainingTeams.sort((a, b) => (b.score || 0) - (a.score || 0));
    console.log('  Top 5 Championship Teams:');
    sortedLeaderboard.slice(0, 5).forEach((t, i) => {
      console.log(`    Rank ${i + 1}: ${t.name.padEnd(26)} -> Score: ${t.score} PTS | Cards: ${(t.cards || []).length} | Zones: ${(t.visitedZones || []).length}`);
    });

    assert('Leaderboard correctly sorted in descending order of score',
      sortedLeaderboard[0].score >= sortedLeaderboard[1].score && sortedLeaderboard[1].score >= sortedLeaderboard[2].score);
    assert('Gold Medalist team has valid score (> 150 PTS)', sortedLeaderboard[0].score > 150, `Winning Score: ${sortedLeaderboard[0].score}`);

    // -------------------------------------------------------------------------
    // STEP 10: MATCH TERMINATION & CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n📌 [PHASE 10] Match Termination, Reset & Post-Game Purge');
    const resetPointsRes = await request('/api/admin/teams/reset-all-points', { method: 'POST' });
    assert('Admin resets all points to zero (HTTP 200)', resetPointsRes.status === 200);

    const teamsAfterReset = await request('/api/teams?_t=' + Date.now());
    const allZeroScore = (teamsAfterReset.json.teams || []).every(t => t.score === 0 && (t.cards || []).length === 0 && (t.visitedZones || []).length === 0);
    assert('All squad scores, cards, and visited zones reset to 0', allZeroScore);

    const purgeFinal = await request('/api/admin/teams/purge-all', { method: 'POST' });
    assert('Admin purges all squads from grid', purgeFinal.status === 200);

    const finalRoster = await request('/api/teams?_t=' + Date.now());
    assert('Live grid roster is empty (0 squads)', (finalRoster.json.teams || []).length === 0);

    // Admin Samay account preserved
    const adminCheck = await request('/api/auth/login', { method: 'POST' }, { callsign: 'samay', password: 'samay', requestedRole: 'ADMIN' });
    assert('Game Master Admin account preserved after purge', adminCheck.status === 200 && adminCheck.json.role === 'ADMIN');

    await request('/api/game/state', { method: 'POST' }, { status: 'RESET' });
    console.log('  Game state reset to LOBBY.');

  } catch (err) {
    console.error('Fatal Simulation Exception:', err);
    assert('Complete simulation run without unhandled exceptions', false, err.message);
  } finally {
    if (localServer) {
      try { localServer.close(); } catch (e) {}
    }
  }

  // ---------------------------------------------------------------------------
  // FINAL SCORECARD
  // ---------------------------------------------------------------------------
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║        SENIOR GAME DEVELOPER SIMULATION AUDIT SCORECARD              ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║ Total Verifications: ${String(totalChecks).padEnd(46)} ║`);
  console.log(`║ Passed:              ${String(passedChecks).padEnd(46)} ║`);
  console.log(`║ Failed:              ${String(failedChecks).padEnd(46)} ║`);
  const successRate = ((passedChecks / Math.max(1, totalChecks)) * 100).toFixed(1);
  console.log(`║ Success Rate:        ${(successRate + '%').padEnd(46)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  if (recordedIssues.length > 0) {
    console.log('\n⚠️  ISSUES RECORDED DURING GAMEPLAY:');
    recordedIssues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue.title} -> ${issue.detail}`);
    });
    process.exit(1);
  } else {
    console.log('\n🏆 ALL 20 TEAMS, 12 MARSHALS & ADMIN CONTROL FULLY VALIDATED WITH ZERO GLITCHES!\n');
    process.exit(0);
  }
}

runSeniorDeveloperSimulation().catch(err => {
  console.error('Execution failure:', err);
  process.exit(1);
});
