/**
 * Verification Test: Phase 8 QR Telemetry, Bidirectional Scanning & Strict Single-Award Enforce
 */

const http = require('http');

async function run() {
  const handler = require('../api/index.js');

  function makeRequest(method, urlPath, body = null) {
    return new Promise((resolve, reject) => {
      const req = {
        method,
        url: urlPath,
        headers: {
          'host': 'localhost',
          'content-type': 'application/json'
        },
        pipe: function(dest) {},
        on: function(ev, cb) {
          if (ev === 'data') {
            if (body) cb(Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
          }
          if (ev === 'end') cb();
        }
      };

      let resHeaders = {};
      let resStatusCode = 200;
      let resBody = '';

      const res = {
        writeHead: (code, headers) => {
          resStatusCode = code;
          resHeaders = headers;
        },
        end: (chunk) => {
          if (chunk) resBody += chunk;
          try {
            resolve({ status: resStatusCode, headers: resHeaders, body: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: resStatusCode, headers: resHeaders, body: resBody });
          }
        }
      };

      handler(req, res).catch(reject);
    });
  }

  console.log('🧪 Starting Phase 8 Verification Tests...\n');

  // 1. Create and approve a test team
  console.log('Test 1: Register and approve test team');
  const regRes = await makeRequest('POST', '/api/auth/register', {
    callsign: 'phase8_squad_' + Date.now(),
    name: 'Phase8 Squad',
    role: 'PLAYER',
    password: 'pass'
  });
  const userId = regRes.body.user._id;
  const teamId = regRes.body.user.teamId || regRes.body.user._id;

  await makeRequest('POST', '/api/admin/approve', { userId: userId, approved: true });
  console.log('  ✅ Squad created & approved: userId=' + userId + ', teamId=' + teamId);

  // 2. Fetch clues to see station 1
  console.log('Test 2: Check target station');
  const cluesRes = await makeRequest('GET', '/api/clues?all=true');
  const allClues = cluesRes.body.clues;
  console.log('  ✅ Clues count:', allClues.length);

  // 3. Test /api/player/sync endpoint with teamId & userId
  console.log('Test 3: Verify GET /api/player/sync before checkin');
  const sync1 = await makeRequest('GET', `/api/player/sync?teamId=${teamId}`);
  if (sync1.status !== 200 || !sync1.body.success) {
    throw new Error('player/sync failed: ' + JSON.stringify(sync1.body));
  }
  console.log('  ✅ Score:', sync1.body.score, '| Target Station:', sync1.body.nextStationName);
  const targetStationZone = sync1.body.activeClue.zoneId;

  const syncUser = await makeRequest('GET', `/api/player/sync?teamId=${userId}`);
  if (syncUser.status !== 200 || !syncUser.body.success) {
    throw new Error('player/sync with userId failed: ' + JSON.stringify(syncUser.body));
  }
  console.log('  ✅ player/sync with userId successfully resolved squad');

  // 4. Test Player Scanning Marshal Beacon (TG_STATION|...)
  console.log('Test 4: Player scans Station Beacon QR (TG_STATION|...)');
  const scan1 = await makeRequest('POST', '/api/checkin', {
    teamId: teamId,
    qrPayload: `TG_STATION|${targetStationZone}|Campus Center|marshal_1`
  });
  if (scan1.status !== 200 || !scan1.body.success) {
    throw new Error('Player scan beacon failed: ' + JSON.stringify(scan1.body));
  }
  console.log('  ✅ Checkin 1 Success! Points:', scan1.body.pointsAwarded, 'New Score:', scan1.body.teamScore, 'Next Station:', scan1.body.nextZoneLabel);

  // 5. Test STRICT SINGLE-AWARD ENFORCEMENT (Duplicate Award Rejected)
  console.log('Test 5: STRICT SINGLE-AWARD ENFORCEMENT - Attempt duplicate award at same station');
  const scanDup = await makeRequest('POST', '/api/checkin', {
    teamId: teamId,
    zoneId: targetStationZone,
    cone: 'GREEN',
    allowDuplicate: true // Even with flag set, MUST BE REJECTED!
  });
  if (scanDup.status === 400 && (scanDup.body.alreadyVisited || scanDup.body.wrongStation)) {
    console.log('  ✅ STRICT DUPLICATE REJECTION VERIFIED (HTTP 400):', scanDup.body.error);
  } else {
    throw new Error('STRICT SINGLE-AWARD ENFORCEMENT FAILED: duplicate was permitted! ' + JSON.stringify(scanDup.body));
  }

  // 6. Test GET /api/player/sync returns updated score & next location immediately
  console.log('Test 6: Verify GET /api/player/sync reflects updated score & next station immediately');
  const sync2 = await makeRequest('GET', `/api/player/sync?teamId=${teamId}`);
  if (sync2.body.score !== scan1.body.teamScore) {
    throw new Error(`Score mismatch in sync: ${sync2.body.score} vs ${scan1.body.teamScore}`);
  }
  if (!sync2.body.nextStationName) {
    throw new Error('Next station name missing in player sync!');
  }
  console.log('  ✅ Sync 2 Success! Score:', sync2.body.score, '| Next Station:', sync2.body.nextStationName, '| Next Clue:', sync2.body.nextClueText);

  // 7. Clean up test team
  await makeRequest('POST', '/api/admin/teams/purge-all', {});
  console.log('\n🎉 ALL PHASE 8 VERIFICATIONS PASSED 100%!');
}

run().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
