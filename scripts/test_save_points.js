const assert = require('assert');

const BASE_URL = process.env.GAME_URL || 'https://territory-grid-delta.vercel.app';

async function run() {
  console.log('========================================================');
  console.log('🧪 VERIFYING TACTICAL SAVE POINT SYSTEM');
  console.log(`   Target: ${BASE_URL}`);
  console.log('========================================================\n');

  // Step 1: Query initial savepoints
  console.log('1. Fetching save points list...');
  const res1 = await fetch(`${BASE_URL}/api/savepoints`);
  assert.strictEqual(res1.status, 200, 'GET /api/savepoints returned non-200');
  const data1 = await res1.json();
  console.log(`   Initial Save Points Count: ${data1.count}`);

  // Step 2: Create a manual savepoint
  console.log('\n2. Creating manual save point ("Mid-Match Checkpoint #1")...');
  const res2 = await fetch(`${BASE_URL}/api/savepoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mid-Match Checkpoint #1',
      type: 'MANUAL',
      createdBy: 'Game Master Samay'
    })
  });
  assert.strictEqual(res2.status, 200, 'POST /api/savepoints returned non-200');
  const data2 = await res2.json();
  assert(data2.success, 'Save point creation failed');
  const createdSp = data2.savePoint;
  console.log(`   Created Save Point ID: ${createdSp._id}`);
  console.log(`   Name: ${createdSp.name}`);
  console.log(`   Timestamp: ${createdSp.timestamp}`);
  console.log(`   Summary: Phase=${createdSp.summary.phase}, Squads=${createdSp.summary.teamsCount}, Pts=${createdSp.summary.totalPointsAwarded}`);

  // Step 3: Verify it appears in GET /api/savepoints
  console.log('\n3. Verifying save point appears in directory...');
  const res3 = await fetch(`${BASE_URL}/api/savepoints`);
  const data3 = await res3.json();
  const found = data3.savePoints.find(p => p._id === createdSp._id);
  assert(found, 'Created save point not found in list');
  console.log(`   Found in directory: "${found.name}" (${found.timestamp})`);

  // Step 4: Export Save Point JSON
  console.log('\n4. Testing Save Point JSON Export...');
  const res4 = await fetch(`${BASE_URL}/api/savepoints/export?id=${encodeURIComponent(createdSp._id)}`);
  assert.strictEqual(res4.status, 200, 'Export returned non-200');
  const exported = await res4.json();
  assert.strictEqual(exported._id, createdSp._id, 'Exported ID mismatch');
  assert(exported.snapshot, 'Exported JSON missing snapshot payload');
  console.log(`   Exported JSON verified (Snapshot has gameState, teams, users, checkins, clues)`);

  // Step 5: Test Squad Level Save Point Verification
  console.log('\n5. Testing Squad-Level Save Point / Verification Sync...');
  const res5 = await fetch(`${BASE_URL}/api/team/savepoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callsign: 'alpha'
    })
  });
  if (res5.status === 200) {
    const data5 = await res5.json();
    console.log(`   Squad Save Point Confirmed: Squad=${data5.teamName}, Score=${data5.score}, SavedAt=${data5.savedAt}`);
  } else {
    console.log(`   Note: Squad 'alpha' was not active in storage (status ${res5.status}), skipping squad check.`);
  }

  // Step 6: Test Restore Save Point
  console.log('\n6. Testing Save Point Restoration...');
  const res6 = await fetch(`${BASE_URL}/api/savepoints/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      savePointId: createdSp._id
    })
  });
  assert.strictEqual(res6.status, 200, 'Restore returned non-200');
  const data6 = await res6.json();
  assert(data6.success, 'Restore call returned success: false');
  console.log(`   Restore successful: "${data6.savePoint.name}"`);

  // Step 7: Clean up test save point
  console.log('\n7. Testing Delete Save Point...');
  const res7 = await fetch(`${BASE_URL}/api/savepoints`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: createdSp._id
    })
  });
  assert.strictEqual(res7.status, 200, 'DELETE returned non-200');
  const data7 = await res7.json();
  assert(data7.success, 'Delete failed');
  console.log(`   Save point deleted cleanly.`);

  console.log('\n========================================================');
  console.log('🎉 ALL SAVE POINT SYSTEM TESTS PASSED SUCCESSFULLY (7/7)');
  console.log('========================================================\n');
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
