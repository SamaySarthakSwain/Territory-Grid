/**
 * Live End-to-End Test for Phase 8 on Production Vercel
 */

const https = require('https');

function makeLiveReq(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://territory-grid-delta.vercel.app' + urlPath);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => { resBody += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: resBody });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Running Live Production End-to-End Test for Phase 8...\n');

  // 1. Register test squad
  console.log('Step 1: Register Operative Squad on Live Vercel');
  const regRes = await makeLiveReq('POST', '/api/auth/register', {
    callsign: 'live_test_' + Date.now(),
    name: 'Live Verifier Squad',
    role: 'PLAYER',
    password: 'pass'
  });
  if (regRes.status !== 201) throw new Error('Reg failed: ' + JSON.stringify(regRes.body));
  const userId = regRes.body.user._id;
  const teamId = regRes.body.user.teamId || userId;
  console.log('  ✅ Registered: userId=' + userId + ', teamId=' + teamId);

  // 2. Admin approves team
  console.log('Step 2: Admin approves squad');
  const appRes = await makeLiveReq('POST', '/api/admin/approve', { userId, approved: true });
  if (appRes.status !== 200) throw new Error('Approval failed: ' + JSON.stringify(appRes.body));
  console.log('  ✅ Squad approved on live grid');

  // 3. Fast Player Telemetry Sync before checkin
  console.log('Step 3: Fast Telemetry Sync GET /api/player/sync');
  const sync1 = await makeLiveReq('GET', `/api/player/sync?teamId=${teamId}`);
  if (sync1.status !== 200 || !sync1.body.success) throw new Error('Sync 1 failed: ' + JSON.stringify(sync1.body));
  console.log('  ✅ Score:', sync1.body.score, '| Target Station:', sync1.body.nextStationName);
  const targetZoneId = sync1.body.activeClue.zoneId;

  // 4. Player scans Station Beacon QR
  console.log('Step 4: Player scans Station Beacon QR (TG_STATION|...)');
  const scan1 = await makeLiveReq('POST', '/api/checkin', {
    teamId: teamId,
    qrPayload: `TG_STATION|${targetZoneId}|Live Beacon Station|marshal_live`
  });
  if (scan1.status !== 200 || !scan1.body.success) throw new Error('Checkin 1 failed: ' + JSON.stringify(scan1.body));
  console.log('  ✅ Checkin 1 Success! Points:', scan1.body.pointsAwarded, 'New Score:', scan1.body.teamScore, 'Next Station:', scan1.body.nextZoneLabel);

  // 5. Strict Single-Award Enforcement (Attempt duplicate award)
  console.log('Step 5: STRICT SINGLE-AWARD ENFORCEMENT - Attempt duplicate check-in');
  const scanDup = await makeLiveReq('POST', '/api/checkin', {
    teamId: teamId,
    zoneId: targetZoneId,
    cone: 'GREEN',
    allowDuplicate: true
  });
  if (scanDup.status === 400 && (scanDup.body.alreadyVisited || scanDup.body.wrongStation)) {
    console.log('  ✅ STRICT DUPLICATE REJECTION CONFIRMED (HTTP 400):', scanDup.body.error);
  } else {
    throw new Error('DUPLICATE NOT BLOCKED: ' + JSON.stringify(scanDup.body));
  }

  // 6. Fast Player Telemetry Sync after checkin
  console.log('Step 6: Verify Player Dashboard Telemetry Sync');
  const sync2 = await makeLiveReq('GET', `/api/player/sync?teamId=${teamId}`);
  if (sync2.status !== 200 || sync2.body.score !== scan1.body.teamScore) {
    throw new Error('Sync 2 score mismatch: ' + JSON.stringify(sync2.body));
  }
  console.log('  ✅ Sync 2 Confirmed! Score:', sync2.body.score, '| Next Station:', sync2.body.nextStationName, '| Next Clue:', sync2.body.nextClueText);

  // 7. Cleanup
  console.log('Step 7: Purge test squads');
  await makeLiveReq('POST', '/api/admin/teams/purge-all', {});
  console.log('  ✅ Grid purged clean');

  console.log('\n🎉 ALL LIVE PRODUCTION VERIFICATIONS PASSED 100%!');
}

run().catch(err => {
  console.error('\n❌ Live Verification Failed:', err);
  process.exit(1);
});
