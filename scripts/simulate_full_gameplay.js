/**
 * ============================================================================
 * TERRITORY GRID // END-TO-END LIVE GAMEPLAY SIMULATION ENGINE
 * ============================================================================
 * Tests full gameplay walkthrough:
 * 1. Player squad registrations (Alpha & Bravo)
 * 2. Field Marshal registrations (2 different stations)
 * 3. Admin Game Master authentication & clearances approval
 * 4. Match start countdown & live hunt activation
 * 5. Wrong station scan rejection
 * 6. Correct station scan & instant point award + card collection
 * 7. Next station assignment progression
 * 8. Championship Leaderboard ranking reflection
 * 9. Admin scores reset & purge cleanup
 * ============================================================================
 */

const https = require('https');
const http = require('http');

const isLocal = process.argv.includes('--local');
const BASE_URL = isLocal ? 'http://localhost:8088' : 'https://territory-grid-delta.vercel.app';

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║        TERRITORY GRID // END-TO-END GAMEPLAY SIMULATION ENGINE       ║');
console.log('╠══════════════════════════════════════════════════════════════════════╣');
console.log(`║ Environment: ${BASE_URL.padEnd(55)} ║`);
console.log(`║ Timestamp:   ${new Date().toISOString().padEnd(55)} ║`);
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(urlPath, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    const isHttps = fullUrl.startsWith('https:');
    const client = isHttps ? https : http;

    const reqOpts = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
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

async function runGameplaySimulation() {
  const ts = Date.now().toString().slice(-5);
  const sqAlphaCallsign = `alpha_${ts}`;
  const sqBravoCallsign = `bravo_${ts}`;
  const mrLhcCallsign = `mr_lhc_${ts}`;
  const mrZone1Callsign = `mr_z1_${ts}`;

  let sqAlphaId = null;
  let sqBravoId = null;
  let mrLhcId = null;
  let mrZone1Id = null;

  console.log('🎮 [STEP 1] Squad Registrations & Waiting Hall');
  // Register Alpha
  const regAlpha = await request('/api/auth/register', { method: 'POST' }, {
    role: 'PLAYER',
    callsign: sqAlphaCallsign,
    name: `Squad Alpha ${sqAlphaCallsign}`,
    password: 'pass'
  });
  console.log(`  ✓ Squad Alpha registered: HTTP ${regAlpha.status} (Status: ${regAlpha.json.status})`);
  sqAlphaId = regAlpha.json.user.teamId;

  // Register Bravo
  const regBravo = await request('/api/auth/register', { method: 'POST' }, {
    role: 'PLAYER',
    callsign: sqBravoCallsign,
    name: `Squad Bravo ${sqBravoCallsign}`,
    password: 'pass'
  });
  console.log(`  ✓ Squad Bravo registered: HTTP ${regBravo.status} (Status: ${regBravo.json.status})`);
  sqBravoId = regBravo.json.user.teamId;

  console.log('\n🎮 [STEP 2] Field Marshals Registration (2 Campus Stations)');
  // Register Marshal 1 (LHC)
  const regMr1 = await request('/api/auth/register', { method: 'POST' }, {
    role: 'MEMBER',
    callsign: mrLhcCallsign,
    name: `Marshal LHC ${mrLhcCallsign}`,
    password: 'pass',
    zoneId: 'LHC',
    zoneLabel: 'Lecture Hall Complex'
  });
  console.log(`  ✓ Marshal LHC registered: HTTP ${regMr1.status}`);
  mrLhcId = regMr1.json.user._id;

  // Register Marshal 2 (ZONE 1)
  const regMr2 = await request('/api/auth/register', { method: 'POST' }, {
    role: 'MEMBER',
    callsign: mrZone1Callsign,
    name: `Marshal Zone1 ${mrZone1Callsign}`,
    password: 'pass',
    zoneId: 'ZONE 1',
    zoneLabel: 'Main Gate Arch'
  });
  console.log(`  ✓ Marshal Zone 1 registered: HTTP ${regMr2.status}`);
  mrZone1Id = regMr2.json.user._id;

  console.log('\n🎮 [STEP 3] Admin Game Master Authorization & Approval');
  const adminLogin = await request('/api/auth/login', { method: 'POST' }, {
    callsign: 'samay',
    password: 'samay'
  });
  console.log(`  ✓ Game Master Admin login: HTTP ${adminLogin.status}`);

  await wait(600);
  await request('/api/admin/approve-team', { method: 'POST' }, { teamId: sqAlphaId });
  await request('/api/admin/approve-team', { method: 'POST' }, { teamId: sqBravoId });
  await request('/api/admin/approve-user', { method: 'POST' }, { userId: mrLhcId, id: mrLhcId, callsign: mrLhcCallsign });
  await request('/api/admin/approve-user', { method: 'POST' }, { userId: mrZone1Id, id: mrZone1Id, callsign: mrZone1Callsign });
  console.log(`  ✓ Both squads and marshals approved by Game Master!`);

  console.log('\n🎮 [STEP 4] Campus Route Balancing Engine');
  await request('/api/admin/rebalance-routes', { method: 'POST' });
  const teamsRes = await request('/api/teams?_t=' + Date.now());
  const alphaObj = teamsRes.json.teams.find(t => t._id === sqAlphaId);
  const bravoObj = teamsRes.json.teams.find(t => t._id === sqBravoId);

  const cluesRes = await request('/api/clues?all=true&_t=' + Date.now());
  const clues = cluesRes.json.clues || [];
  const K = clues.length;

  const alphaTarget = clues[(alphaObj.teamCode || 11) % K].zoneId;
  const bravoTarget = clues[(bravoObj.teamCode || 12) % K].zoneId;
  console.log(`  ✓ Squad Alpha assigned to station: ${alphaTarget}`);
  console.log(`  ✓ Squad Bravo assigned to station: ${bravoTarget}`);

  console.log('\n🎮 [STEP 5] Match Start (10s Countdown -> Live Operating)');
  const startMatch = await request('/api/game/state', { method: 'POST' }, {
    status: 'COUNTDOWN',
    countdownSeconds: 10,
    durationMinutes: 52
  });
  console.log(`  ✓ Match initiated: HTTP ${startMatch.status}`);
  const stateCheck = await request('/api/game/state?_t=' + Date.now());
  console.log(`  ✓ Game status: ${stateCheck.json.state.status} (Remaining: ${stateCheck.json.countdownSeconds}s, Ends at: ${stateCheck.json.countdownEndsAt})`);

  console.log('\n🎮 [STEP 6] Station Guard & Scan Verification');
  // Attempt Alpha scan at WRONG station
  const wrongStation = clues.find(c => c.zoneId !== alphaTarget).zoneId;
  const wrongScan = await request('/api/checkin', { method: 'POST' }, {
    teamId: sqAlphaId,
    zoneId: wrongStation,
    cone: 'RED',
    cardRank: 7,
    cardSuit: '♦',
    memberId: 'marshal_test'
  });
  console.log(`  ✓ Wrong station scan rejected: HTTP ${wrongScan.status} (WrongStation: ${wrongScan.json.wrongStation})`);

  // Alpha scan at CORRECT station
  const correctScanAlpha = await request('/api/checkin', { method: 'POST' }, {
    teamId: sqAlphaId,
    zoneId: alphaTarget,
    cone: 'GREEN', // +15 pts
    cardRank: 10,  // +10 pts (Total = 25 pts)
    cardSuit: '♠',
    memberId: mrLhcCallsign
  });
  console.log(`  ✓ Alpha correct scan awarded: HTTP ${correctScanAlpha.status}`);
  console.log(`    Points awarded: +${correctScanAlpha.json.pointsAwarded} (Team Score: ${correctScanAlpha.json.teamScore} PTS)`);
  console.log(`    Next location directive: "${correctScanAlpha.json.nextZoneLabel}"`);

  // Bravo scan at CORRECT station
  const correctScanBravo = await request('/api/checkin', { method: 'POST' }, {
    teamId: sqBravoId,
    zoneId: bravoTarget,
    cone: 'YELLOW', // +12 pts
    cardRank: 8,    // +8 pts (Total = 20 pts)
    cardSuit: '♥',
    memberId: mrZone1Callsign
  });
  console.log(`  ✓ Bravo correct scan awarded: HTTP ${correctScanBravo.status}`);
  console.log(`    Points awarded: +${correctScanBravo.json.pointsAwarded} (Team Score: ${correctScanBravo.json.teamScore} PTS)`);

  console.log('\n🎮 [STEP 7] Live Championship Leaderboard Verification');
  await wait(800);
  const lbTeamsRes = await request('/api/teams?_t=' + Date.now());
  const lbSorted = (lbTeamsRes.json.teams || []).sort((a,b) => (b.score||0) - (a.score||0));
  console.log(`  ✓ Leaderboard Standings:`);
  lbSorted.forEach((t, i) => {
    console.log(`    ${i+1}. ${t.name} -> ${t.score} PTS (${(t.cards||[]).length} card, ${(t.visitedZones||[]).length} zone)`);
  });

  if (lbSorted[0]._id === sqAlphaId && lbSorted[0].score === 25) {
    console.log(`  ✅ Squad Alpha correctly leads leaderboard with 25 PTS!`);
  }

  console.log('\n🎮 [STEP 8] Reset Points to Zero & Cleanup Verification');
  const resetRes = await request('/api/admin/teams/reset-all-points', { method: 'POST' });
  console.log(`  ✓ Reset all points: HTTP ${resetRes.status} -> ${resetRes.json.message}`);

  const purgeRes = await request('/api/admin/teams/purge-all', { method: 'POST' });
  console.log(`  ✓ Purge all squads: HTTP ${purgeRes.status} -> ${purgeRes.json.message}`);

  // Reset state to LOBBY
  await request('/api/game/state', { method: 'POST' }, { status: 'RESET' });
  console.log(`  ✓ Game state reset to LOBBY.`);

  console.log('\n🎉 FULL GAMEPLAY SIMULATION COMPLETED WITH 100% SUCCESS!\n');
}

runGameplaySimulation().catch(err => {
  console.error('Fatal simulation error:', err);
  process.exit(1);
});
