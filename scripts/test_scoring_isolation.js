const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('--- 1. Fetching Teams & Verifying Unique Codes ---');
  const teamsRes = await request({
    hostname: 'localhost',
    port: 8088,
    path: '/api/teams',
    method: 'GET'
  });

  if (!teamsRes.body.success) {
    throw new Error('Failed to fetch teams: ' + JSON.stringify(teamsRes.body));
  }

  const teams = teamsRes.body.teams;
  const team1 = teams.find(t => (t.callsign || '').toLowerCase() === 'team1');
  const squadPhoenix = teams.find(t => (t.callsign || '').toLowerCase() === 'squad_phoenix');

  console.log(`team1: teamCode=${team1?.teamCode}, score=${team1?.score}`);
  console.log(`Squad Phoenix: teamCode=${squadPhoenix?.teamCode}, score=${squadPhoenix?.score}`);

  if (team1.teamCode !== 11) throw new Error(`Expected team1 to have teamCode 11, got ${team1.teamCode}`);
  if (squadPhoenix.teamCode !== 12) throw new Error(`Expected Squad Phoenix to have teamCode 12, got ${squadPhoenix.teamCode}`);
  console.log('SUCCESS: team1 is 11 and Squad Phoenix is 12 (ZERO collision)!');

  const team1InitialScore = team1.score || 0;
  const phoenixInitialScore = squadPhoenix.score || 0;

  console.log('\n--- 2. Submitting Check-in for team1 using 6-Digit Code "11 29 10" ---');
  // 11 = team1, 29 = 20 + 9 (Rank 9), 10 = hint/suit
  const checkinRes = await request({
    hostname: 'localhost',
    port: 8088,
    path: '/api/checkin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    cone: 'YELLOW', // 12 pts
    code: '112910',
    allowDuplicate: true
  });

  console.log('Check-in status:', checkinRes.status, checkinRes.body);
  if (!checkinRes.body.success) {
    throw new Error('Checkin failed: ' + JSON.stringify(checkinRes.body));
  }

  console.log('\n--- 3. Verifying Score Was Awarded Strictly & Exclusively to team1 ---');
  const teamsAfterRes = await request({
    hostname: 'localhost',
    port: 8088,
    path: '/api/teams',
    method: 'GET'
  });

  const team1After = teamsAfterRes.body.teams.find(t => (t.callsign || '').toLowerCase() === 'team1');
  const phoenixAfter = teamsAfterRes.body.teams.find(t => (t.callsign || '').toLowerCase() === 'squad_phoenix');

  console.log(`team1 score before: ${team1InitialScore}, after: ${team1After.score} (diff: +${team1After.score - team1InitialScore})`);
  console.log(`Squad Phoenix score before: ${phoenixInitialScore}, after: ${phoenixAfter.score} (diff: +${phoenixAfter.score - phoenixInitialScore})`);

  if (team1After.score !== team1InitialScore + 21) {
    throw new Error(`Expected team1 score to increase by 21 (12 cone + 9 card), but was +${team1After.score - team1InitialScore}`);
  }
  if (phoenixAfter.score !== phoenixInitialScore) {
    throw new Error(`CRITICAL BUG: Squad Phoenix score changed! Should remain unchanged!`);
  }
  console.log('SUCCESS: Points were awarded 100% EXCLUSIVELY to team1! Squad Phoenix was completely untouched!');

  console.log('\n--- 4. Testing Invalid Code "99 29 10" Rejection ---');
  const invalidRes = await request({
    hostname: 'localhost',
    port: 8088,
    path: '/api/checkin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    cone: 'YELLOW',
    code: '992910'
  });

  console.log('Invalid check-in status:', invalidRes.status, invalidRes.body);
  if (invalidRes.status !== 400 && invalidRes.status !== 404) {
    throw new Error(`Expected error 400/404 for invalid squad code, got ${invalidRes.status}`);
  }
  console.log('SUCCESS: Unrecognized code was safely rejected with error!');

  console.log('\n--- 5. Testing Player Clues (Only Places with Registered Marshals) ---');
  const playerCluesRes = await request({
    hostname: 'localhost',
    port: 8088,
    path: '/api/clues',
    method: 'GET'
  });

  const adminCluesRes = await request({
    hostname: 'localhost',
    port: 8088,
    path: '/api/clues?all=true',
    method: 'GET'
  });

  console.log(`Player clues count: ${playerCluesRes.body.clues?.length}`);
  console.log(`Admin/All clues count: ${adminCluesRes.body.clues?.length}`);
  if (playerCluesRes.body.clues.some(c => !c.hasMarshal)) {
    throw new Error('Player clues included a place without a registered marshal!');
  }
  console.log('SUCCESS: Players only see places where a marshal has registered!');

  console.log('\n========================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
