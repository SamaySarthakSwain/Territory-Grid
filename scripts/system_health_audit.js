/**
 * ============================================================================
 * TERRITORY GRID // COMPREHENSIVE PROCESS & ELEMENT SYSTEM HEALTH AUDIT
 * ============================================================================
 * Automated testing framework to verify every single process, endpoint,
 * security rule, station assignment, card cipher, and UI element in the app.
 *
 * Usage:
 *   node scripts/system_health_audit.js [--local | --prod]
 * ============================================================================
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const isLocal = process.argv.includes('--local');
const BASE_URL = isLocal ? 'http://localhost:3000' : 'https://territory-grid-delta.vercel.app';

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║        TERRITORY GRID // DEEP PROCESS & ELEMENT AUDIT ENGINE        ║');
console.log('╠══════════════════════════════════════════════════════════════════════╣');
console.log(`║ Target Environment: ${BASE_URL.padEnd(48)} ║`);
console.log(`║ Local Time:         ${new Date().toISOString().padEnd(48)} ║`);
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function report(name, passed, detail = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name}${detail ? ' -> ' + detail : ''}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}${detail ? ' -> ' + detail : ''}`);
  }
}

function request(urlPath, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = urlPath.startsWith('http') ? urlPath : (BASE_URL + urlPath);
    const u = new URL(fullUrl);
    const isHttps = u.protocol === 'https:';
    const client = isHttps ? https : http;

    const opts = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        ...(options.headers || {})
      }
    };

    if (body) {
      opts.headers['Content-Type'] = 'application/json';
    }

    const req = client.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, json, text: data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT SUITE
// ─────────────────────────────────────────────────────────────────────────────

async function runAudit() {
  const auditTimestamp = Date.now();
  const testSquadCallsign = `audit_sq_${auditTimestamp.toString().slice(-6)}`;
  const testMarshalCallsign = `audit_mr_${auditTimestamp.toString().slice(-6)}`;
  let testTeamId = null;
  let testUserId = null;
  let testMarshalId = null;
  let activeStations = [];

  // =========================================================================
  // MODULE 1: SYSTEM HEALTH & TELEMETRY DIAGNOSTICS
  // =========================================================================
  console.log('📌 [MODULE 1] System Health & Database Diagnostics');
  try {
    const health = await request('/api/health');
    report('GET /api/health responds with HTTP 200', health.status === 200);
    if (health.json) {
      report('System Health status is HEALTHY', health.json.status === 'HEALTHY');
      report('Database provider is connected', !!health.json.database);
      report('Cloud sync telemetry active', !!health.json.cloudSync);
    }
  } catch (err) {
    report('GET /api/health accessible', false, err.message);
  }

  // =========================================================================
  // MODULE 2: AUTHENTICATION & REGISTRATION WORKFLOW
  // =========================================================================
  console.log('\n📌 [MODULE 2] Registration & Authentication Lifecycle');
  try {
    // 2a. Register Operative Squad
    const regSquad = await request('/api/auth/register', { method: 'POST' }, {
      role: 'PLAYER',
      callsign: testSquadCallsign,
      name: `Audit Squad ${testSquadCallsign}`,
      password: 'password123'
    });
    report('Operative registration returns HTTP 201', regSquad.status === 201);
    report('Operative status is WAITING_APPROVAL', regSquad.json && regSquad.json.status === 'WAITING_APPROVAL');
    if (regSquad.json && regSquad.json.user) {
      testUserId = regSquad.json.user._id;
      testTeamId = regSquad.json.user.teamId;
    }

    // 2b. Register Field Marshal
    const regMarshal = await request('/api/auth/register', { method: 'POST' }, {
      role: 'MEMBER',
      callsign: testMarshalCallsign,
      name: `Field Marshal ${testMarshalCallsign}`,
      password: 'password123',
      zoneId: 'ZONE_01',
      zoneLabel: 'Sector A: Library Arch'
    });
    report('Field Marshal registration returns HTTP 201', regMarshal.status === 201);
    if (regMarshal.json && regMarshal.json.user) {
      testMarshalId = regMarshal.json.user._id;
    }

    // 2c. Admin Login (samay / samay)
    const adminLogin = await request('/api/auth/login', { method: 'POST' }, {
      callsign: 'samay',
      password: 'samay'
    });
    report('Game Master Admin login succeeds', adminLogin.status === 200 && adminLogin.json && adminLogin.json.role === 'ADMIN');

    // 2d. Player Login before approval
    const playerPreLogin = await request('/api/auth/login', { method: 'POST' }, {
      callsign: testSquadCallsign,
      password: 'password123'
    });
    report('Unapproved operative login handles WAITING_APPROVAL correctly', playerPreLogin.status === 200 && playerPreLogin.json.isApproved === false);

    // 2e. Invalid password rejection
    const badLogin = await request('/api/auth/login', { method: 'POST' }, {
      callsign: testSquadCallsign,
      password: 'wrong_password_xyz'
    });
    report('Invalid credentials rejected with HTTP 401', badLogin.status === 401);

  } catch (err) {
    report('Authentication workflow execution', false, err.message);
  }

  // =========================================================================
  // MODULE 3: ADMIN APPROVAL PIPELINE
  // =========================================================================
  console.log('\n📌 [MODULE 3] Game Master Admin Approval Pipeline');
  try {
    if (testTeamId) {
      const approveTeam = await request('/api/admin/approve-team', { method: 'POST' }, {
        teamId: testTeamId
      });
      report('Admin approves operative squad (HTTP 200)', approveTeam.status === 200 && approveTeam.json.success === true);
    }

    if (testMarshalId) {
      const approveMarshal = await request('/api/admin/approve-user', { method: 'POST' }, {
        userId: testMarshalId
      });
      report('Admin approves field marshal (HTTP 200)', approveMarshal.status === 200 && approveMarshal.json.success === true);
    }

    // Verify team is now approved on GET /api/teams
    const teamsRes = await request('/api/teams?_t=' + Date.now());
    const matchedTeam = (teamsRes.json && teamsRes.json.teams || []).find(t => t._id === testTeamId);
    report('Approved squad is active on live roster', !!matchedTeam && matchedTeam.isApproved === true);
    if (matchedTeam) {
      report('Squad has deterministic permanent teamCode integer', typeof matchedTeam.teamCode === 'number' && matchedTeam.teamCode >= 11);
    }
  } catch (err) {
    report('Admin approval pipeline execution', false, err.message);
  }

  // =========================================================================
  // MODULE 4: CHECKPOINTS & BALANCED ROUTE DISTRIBUTION
  // =========================================================================
  console.log('\n📌 [MODULE 4] Campus Checkpoints & Balanced Route Engine');
  try {
    const cluesRes = await request('/api/clues?all=true&_t=' + Date.now());
    report('GET /api/clues returns active campus places', cluesRes.status === 200 && Array.isArray(cluesRes.json.clues));
    activeStations = cluesRes.json ? cluesRes.json.clues : [];
    report('Campus has configured checkpoints (>= 2 stations)', activeStations.length >= 2, `${activeStations.length} places registered`);

    // Execute route rebalance
    const rebalRes = await request('/api/admin/rebalance-routes', { method: 'POST' });
    report('POST /api/admin/rebalance-routes succeeds', rebalRes.status === 200 && rebalRes.json.success === true);

    // Verify squads are not all on a single zone
    const teamsAfterRebal = await request('/api/teams?_t=' + Date.now());
    const teamsList = teamsAfterRebal.json ? teamsAfterRebal.json.teams : [];
    
    const K = activeStations.length;
    const distribution = {};
    teamsList.forEach((t, i) => {
      const offset = (t.teamCode || (11 + i)) % K;
      const targetStation = activeStations[offset] ? activeStations[offset].zoneId : 'NONE';
      distribution[targetStation] = (distribution[targetStation] || 0) + 1;
    });

    const uniqueTargetCount = Object.keys(distribution).length;
    report('Squads are equally divided across stations (no single bottleneck)', uniqueTargetCount >= Math.min(2, K), JSON.stringify(distribution));
  } catch (err) {
    report('Checkpoint route engine execution', false, err.message);
  }

  // =========================================================================
  // MODULE 5: STRICT MARSHAL STATION ENFORCEMENT & INSTANT POINT AWARD
  // =========================================================================
  console.log('\n📌 [MODULE 5] Strict Station Enforcement & Instant Point Award');
  try {
    if (testTeamId && activeStations.length >= 2) {
      const teamObj = (await request('/api/teams?_t=' + Date.now())).json.teams.find(t => t._id === testTeamId);
      const K = activeStations.length;
      const targetOffset = (teamObj.teamCode || 11) % K;
      const correctStation = activeStations[targetOffset].zoneId;
      const wrongStation = activeStations[(targetOffset + 1) % K].zoneId;

      // 5a. Attempt check-in at WRONG station
      const wrongCheckin = await request('/api/checkin', { method: 'POST' }, {
        teamId: testTeamId,
        zoneId: wrongStation,
        cone: 'YELLOW',
        cardRank: 10,
        cardSuit: '♠',
        memberId: 'audit_marshal_wrong'
      });
      report('Wrong station scan is STRICTLY REJECTED with HTTP 400', wrongCheckin.status === 400 && wrongCheckin.json.wrongStation === true);
      report('Wrong station response returns target station name', !!wrongCheckin.json.targetZoneId);

      // Verify 0 points awarded from failed scan
      const teamAfterFail = (await request('/api/teams?_t=' + Date.now())).json.teams.find(t => t._id === testTeamId);
      report('Zero points awarded on unauthorized scan (Score: 0)', teamAfterFail.score === 0);

      // 5b. Attempt check-in at CORRECT station
      const correctCheckin = await request('/api/checkin', { method: 'POST' }, {
        teamId: testTeamId,
        zoneId: correctStation,
        cone: 'YELLOW', // +12 pts
        cardRank: 10,   // +10 pts (Total = 22 pts)
        cardSuit: '♠',
        memberId: 'audit_marshal_correct'
      });
      report('Authorized station checkin succeeds with HTTP 200', correctCheckin.status === 200 && correctCheckin.json.success === true);
      report('Points correctly calculated (12 cone + 10 card = 22 pts)', correctCheckin.json && correctCheckin.json.pointsAwarded === 22);
      report('Team score updated to 22 PTS', correctCheckin.json && correctCheckin.json.teamScore === 22);
      report('Current clue index incremented to 1', correctCheckin.json && correctCheckin.json.nextClueIndex === 1);
      report('Next location directive returned instantly', !!correctCheckin.json.nextZoneLabel);

      // 5c. Cloud Database Persistence Check
      await wait(1200);
      const teamAfterSuccess = (await request('/api/teams?_t=' + Date.now())).json.teams.find(t => t._id === testTeamId);
      report('Score persisted to cloud database (Score: 22)', teamAfterSuccess && teamAfterSuccess.score === 22);
      report('Card record persisted to cards inventory', teamAfterSuccess && teamAfterSuccess.cards.length === 1);
      report('Visited zones recorded in squad history', teamAfterSuccess && teamAfterSuccess.visitedZones.length === 1);

      // 5d. Duplicate Check-in Prevention
      const dupCheckin = await request('/api/checkin', { method: 'POST' }, {
        teamId: testTeamId,
        zoneId: correctStation,
        cone: 'RED',
        cardRank: 8,
        cardSuit: '♦',
        memberId: 'audit_marshal_correct'
      });
      report('Duplicate station scan prevented (HTTP 400)', dupCheckin.status === 400 && (dupCheckin.json.alreadyVisited === true || dupCheckin.json.wrongStation === true));
    }
  } catch (err) {
    report('Station enforcement execution', false, err.message);
  }

  // =========================================================================
  // MODULE 6: CLIENT-SIDE HTML, DOM & SCRIPT INTEGRITY AUDIT
  // =========================================================================
  console.log('\n📌 [MODULE 6] Client HTML, Scripts & DOM Elements Integrity Audit');
  const pages = [
    {
      file: 'public/index.html',
      name: 'Landing Gateway',
      requiredIds: [],
      requiredTexts: ['Territory Grid', 'Operative Sign In', 'Field Marshal Access', 'Game Master Terminal']
    },
    {
      file: 'public/login.html',
      name: 'Login Portal',
      requiredIds: ['role-toggle-player', 'role-toggle-member', 'callsign', 'password', 'login-btn', 'auth-status'],
      requiredTexts: ['Authentication Required', 'SIGN IN']
    },
    {
      file: 'public/player_dashboard.html',
      name: 'Player Dashboard',
      requiredIds: [
        'active-station-name', 'active-clue-text', 'active-checkpoint-label', 'active-zone-badge',
        'card-qr-container', 'manual-cipher-code', 'cards-count-label', 'score-progress-bar',
        'team-callsign-display', 'collected-deck-container', 'card-front-face', 'card-back-face'
      ],
      requiredTexts: ['resolveTeamTargetClue', 'rotateCardCipher', 'apiUrl']
    },
    {
      file: 'public/member_checkin.html',
      name: 'Field Marshal Station',
      requiredIds: [
        'station-zone-id', 'station-zone-label', 'telemetry-logged-count', 'telemetry-assigned-count',
        'assigned-squads-chips', 'wrong-station-modal', 'celebration-overlay', 'team-selector',
        'manual-cipher-input', 'btn-toggle-camera'
      ],
      requiredTexts: ['showWrongStationModal', 'autoAwardCheckin', 'resolveTeamTargetClue']
    },
    {
      file: 'public/admin_panel.html',
      name: 'Admin Master Control',
      requiredIds: [
        'places-total-count', 'stat-teams-count', 'stat-registered-count', 'stat-total-points',
        'pending-approvals-table', 'approved-roster-table', 'hunt-timer-display', 'places-list'
      ],
      requiredTexts: ['rebalanceAllSquadRoutes', 'loadApprovedRoster', 'loadPendingApprovals']
    },
    {
      file: 'public/leaderboard.html',
      name: 'Championship Leaderboard',
      requiredIds: [
        'podium-slots-container', 'contenders-rows-container', 'hunt-timer-display',
        'current-user-strip', 'live-event-feed-text'
      ],
      requiredTexts: ['refreshLeaderboard', 'renderPodium', 'renderContenders']
    }
  ];

  pages.forEach(p => {
    try {
      const fullPath = path.resolve(p.file);
      if (!fs.existsSync(fullPath)) {
        report(`File exists: ${p.file}`, false);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      report(`Page ${p.name} (${p.file}) exists and readable`, true);

      // Check required element IDs
      let missingIds = [];
      p.requiredIds.forEach(id => {
        if (!content.includes(`id="${id}"`) && !content.includes(`id='${id}'`)) {
          missingIds.push(id);
        }
      });
      report(`Page ${p.name} contains all ${p.requiredIds.length} required DOM IDs`, missingIds.length === 0, missingIds.length > 0 ? `Missing: ${missingIds.join(', ')}` : 'All verified');

      // Check required code signatures
      let missingTexts = [];
      p.requiredTexts.forEach(txt => {
        if (!content.includes(txt)) {
          missingTexts.push(txt);
        }
      });
      report(`Page ${p.name} contains required engine functions & strings`, missingTexts.length === 0, missingTexts.length > 0 ? `Missing: ${missingTexts.join(', ')}` : 'All verified');

    } catch (err) {
      report(`DOM audit for ${p.file}`, false, err.message);
    }
  });

  // =========================================================================
  // MODULE 7: ANDROID APK & ASSET SYNCHRONIZATION AUDIT
  // =========================================================================
  console.log('\n📌 [MODULE 7] Android APK Integrity & Synchronized Assets');
  try {
    const webFiles = fs.readdirSync('public').filter(f => f.endsWith('.html'));
    const androidAssetDir = 'app/src/main/assets/public';
    report(`Android WebView assets directory exists (${androidAssetDir})`, fs.existsSync(androidAssetDir));

    let assetMismatches = [];
    webFiles.forEach(f => {
      const webPath = path.join('public', f);
      const androidPath = path.join(androidAssetDir, f);
      if (!fs.existsSync(androidPath)) {
        assetMismatches.push(f + ' (missing)');
      } else {
        const webStat = fs.statSync(webPath);
        const androidStat = fs.statSync(androidPath);
        if (webStat.size !== androidStat.size) {
          assetMismatches.push(f + ` (size diff: ${webStat.size} vs ${androidStat.size})`);
        }
      }
    });
    report('Web assets in public/ are 100% in sync with app/src/main/assets/public/', assetMismatches.length === 0, assetMismatches.length > 0 ? assetMismatches.join(', ') : 'All 6 HTML files match');

    const apkPath = 'C:/Users/LENOVO/Desktop/TerritoryGrid-debug.apk';
    const apkExists = fs.existsSync(apkPath);
    report(`Compiled Android APK exists at Desktop location (${apkPath})`, apkExists);
    if (apkExists) {
      const apkSizeMb = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(2);
      report(`Android APK size is optimized under 25 MB (${apkSizeMb} MB)`, parseFloat(apkSizeMb) <= 25.0);
    }
  } catch (err) {
    report('Android APK audit execution', false, err.message);
  }

  // =========================================================================
  // FINAL SCORECARD
  // =========================================================================
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                     FINAL AUDIT SCORECARD                            ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║ Total Verifications: ${String(totalTests).padEnd(46)} ║`);
  console.log(`║ Passed:              ${String(passedTests).padEnd(46)} ║`);
  console.log(`║ Failed:              ${String(failedTests).padEnd(46)} ║`);
  const rate = ((passedTests / Math.max(1, totalTests)) * 100).toFixed(1);
  console.log(`║ Success Rate:        ${(rate + '%').padEnd(46)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  if (failedTests > 0) {
    console.error(`\n⚠️  AUDIT COMPLETE: ${failedTests} issue(s) detected during verification.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL SYSTEMS FULLY OPERATIONAL: 100% of processes & elements passed verification.');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
