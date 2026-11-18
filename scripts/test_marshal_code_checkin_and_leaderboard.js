/**
 * Comprehensive Test: Marshal Code Entry, Point Allocation, Leaderboard Update & Override
 */
const BASE_URL = process.env.TEST_URL || 'https://territory-grid-delta.vercel.app';

async function run() {
  console.log(`\n======================================================`);
  console.log(`🧪 TESTING MARSHAL CODE CHECK-IN & LEADERBOARD PIPELINE`);
  console.log(`   Target Server: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Step 1: Health Check
  console.log('1️⃣ Checking API Health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  console.log(`   Health: ${health.status}, Teams: ${health.database?.counts?.teamsTotal}, Marshals: ${health.database?.counts?.marshals}`);

  // Step 1b: Clean slate
  console.log('   Resetting scores to 0 for test...');
  await fetch(`${BASE_URL}/api/admin/teams/reset-all-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Step 2: Fetch Squad & Target Station
  console.log('\n2️⃣ Fetching Squad Telemetry...');
  const teamsRes = await fetch(`${BASE_URL}/api/teams`);
  const teamsData = await teamsRes.json();
  const squad = (teamsData.teams || []).find(t => t.isApproved);
  if (!squad) {
    throw new Error('No approved squad found in database!');
  }
  console.log(`   Squad: "${squad.name}" (ID: ${squad._id}, Callsign: ${squad.callsign}, TeamCode: ${squad.teamCode}, Score: ${squad.score})`);

  // Step 3: Fetch Player Target Station & Card Code
  console.log('\n3️⃣ Fetching Player Target Station & Clue...');
  const syncRes = await fetch(`${BASE_URL}/api/player/sync?callsign=${encodeURIComponent(squad.callsign)}&_t=${Date.now()}`);
  const syncData = await syncRes.json();
  console.log(`   Target Station: ${syncData.activeClue?.zoneId} (${syncData.activeClue?.zoneLabel})`);
  console.log(`   Next Clue: "${syncData.activeClue?.text}"`);

  // Calculate the 6-digit code for this squad & checkpoint
  const CARD_RANKS = [
    { code: 'A', value: 1 }, { code: '2', value: 2 }, { code: '3', value: 3 },
    { code: '4', value: 4 }, { code: '5', value: 5 }, { code: '6', value: 6 },
    { code: '7', value: 7 }, { code: '8', value: 8 }, { code: '9', value: 9 },
    { code: '10', value: 10 }, { code: 'J', value: 11 }, { code: 'Q', value: 12 }, { code: 'K', value: 13 }
  ];
  const CARD_SUITS = [
    { symbol: '♠', name: 'Spades' }, { symbol: '♥', name: 'Hearts' },
    { symbol: '♦', name: 'Diamonds' }, { symbol: '♣', name: 'Clubs' }
  ];
  const tt = squad.teamCode || 11;
  const cIdx = syncData.currentClueIndex || 0;
  const rankIdx = Math.abs((tt * 7 + cIdx * 5 + 3)) % 13;
  const suitIdx = Math.abs((tt * 3 + cIdx * 7 + 1)) % 4;
  const rankObj = CARD_RANKS[rankIdx];
  const suitObj = CARD_SUITS[suitIdx];
  const rr = 20 + rankObj.value;
  const hh = 10 + suitIdx + (((tt + cIdx) % 10) * 4);
  const sixDigitCode = `${tt}${rr}${String(hh).padStart(2, '0')}`;
  console.log(`   Calculated 6-Digit Cipher: ${sixDigitCode} (TT=${tt}, Card=${rankObj.code}${suitObj.symbol}, RankVal=${rankObj.value})`);

  // Step 4: Test Checkin at Target Station
  console.log('\n4️⃣ Testing Check-in Submission at Target Station...');
  const targetZone = syncData.activeClue?.zoneId || 'ZONE_08';
  const checkinPayload = {
    teamId: squad._id,
    zoneId: targetZone,
    cone: 'GREEN',
    cardRank: rankObj.value,
    cardSuit: suitObj.symbol,
    memberId: 'Ma',
    code: sixDigitCode
  };

  const checkinRes = await fetch(`${BASE_URL}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkinPayload)
  });
  const checkinResult = await checkinRes.json();
  console.log(`   Checkin HTTP Status: ${checkinRes.status}`);
  console.log(`   Result:`, checkinResult);

  if (!checkinResult.success) {
    throw new Error(`Checkin failed: ${checkinResult.error}`);
  }
  console.log(`   ✅ POINTS AWARDED: +${checkinResult.pointsAwarded} PTS (Total Score: ${checkinResult.teamScore} PTS)`);

  // Step 5: Verify Leaderboard Telemetry
  console.log('\n5️⃣ Verifying Updated Leaderboard...');
  const updatedTeamsRes = await fetch(`${BASE_URL}/api/teams?_t=${Date.now()}`);
  const updatedTeamsData = await updatedTeamsRes.json();
  const updatedSquad = (updatedTeamsData.teams || []).find(t => t._id === squad._id);
  console.log(`   Squad Score on Leaderboard: ${updatedSquad?.score} PTS (Expected: ${checkinResult.teamScore})`);
  if (updatedSquad?.score !== checkinResult.teamScore) {
    throw new Error(`Score mismatch! Expected ${checkinResult.teamScore}, got ${updatedSquad?.score}`);
  }
  console.log(`   ✅ LEADERBOARD ACCURATELY REFLECTS POINTS!`);

  // Step 6: Test Wrong Station Rejection & Marshal Override
  console.log('\n6️⃣ Testing Wrong Station & Marshal Override...');
  // Reset team to Checkpoint 1 so target station is ZONE_08
  await fetch(`${BASE_URL}/api/admin/teams/reset-all-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const wrongStationPayload = {
    teamId: squad._id,
    zoneId: 'ZONE_01', // Deliberately wrong zone
    cone: 'YELLOW',
    cardRank: 10,
    cardSuit: '♠',
    memberId: 'marshal_01',
    code: '112910'
  };

  // Test 6a: Without override (should reject with 400 wrongStation)
  const wrongRes = await fetch(`${BASE_URL}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(wrongStationPayload)
  });
  const wrongData = await wrongRes.json();
  console.log(`   Without Override: HTTP ${wrongRes.status}, wrongStation=${wrongData.wrongStation}`);
  if (wrongRes.status !== 400 || !wrongData.wrongStation) {
    throw new Error(`Expected HTTP 400 wrongStation, got ${wrongRes.status}`);
  }
  console.log(`   ✅ Strict Station Validation Working: correctly rejected wrong checkpoint.`);

  // Test 6b: With Marshal Override (should allow checkin and award points)
  const overridePayload = {
    ...wrongStationPayload,
    allowOverride: true,
    forceCheckin: true
  };
  const overrideRes = await fetch(`${BASE_URL}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overridePayload)
  });
  const overrideData = await overrideRes.json();
  console.log(`   With Marshal Override: HTTP ${overrideRes.status}, success=${overrideData.success}`);
  if (!overrideData.success) {
    throw new Error(`Override failed: ${overrideData.error}`);
  }
  console.log(`   ✅ Marshal Override Working: awarded +${overrideData.pointsAwarded} PTS (New Score: ${overrideData.teamScore})`);

  // Step 7: Reset Scores cleanly for user
  console.log('\n7️⃣ Resetting Scores to Clean Slate...');
  await fetch(`${BASE_URL}/api/admin/teams/reset-all-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log(`   ✅ Clean reset complete.`);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL 7/7 TESTS PASSED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
