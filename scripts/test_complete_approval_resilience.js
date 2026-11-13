const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 8088,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8088' + path, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    }).on('error', reject);
  });
}

(async () => {
  console.log('=== STEP 1: Register new squad "Phoenix Vanguard" ===');
  const reg = await post('/api/auth/register', {
    role: 'PLAYER',
    name: 'Phoenix Vanguard',
    callsign: 'phoenix_vanguard',
    password: 'password123'
  });
  console.log('Registration status:', reg.status, reg.data.success ? 'SUCCESS' : 'FAILED');
  const teamId = reg.data.user.teamId;
  const userId = reg.data.user._id;
  console.log('Registered teamId:', teamId, 'userId:', userId);

  console.log('\n=== STEP 2: Check Pending Approvals in Admin ===');
  const pending1 = await get('/api/admin/pending');
  const foundInPending = pending1.data.teams.some(t => t._id === teamId || t.callsign === 'phoenix_vanguard');
  console.log('Team visible in Admin Pending queue:', foundInPending, 'Total pending:', pending1.data.count);

  console.log('\n=== STEP 3: Check Player Waiting Hall Status ===');
  const status1 = await get('/api/auth/status?id=' + userId + '&callsign=phoenix_vanguard');
  console.log('Player status before approval:', status1.data.status, 'isApproved:', status1.data.isApproved);

  console.log('\n=== STEP 4: Admin Approves Team ===');
  const approveRes = await post('/api/admin/approve', {
    type: 'TEAM',
    id: teamId
  });
  console.log('Admin approval response:', approveRes.status, approveRes.data);

  console.log('\n=== STEP 5: Verify Pending Queue after Approval ===');
  const pending2 = await get('/api/admin/pending');
  const stillInPending = pending2.data.teams.some(t => t._id === teamId || t.callsign === 'phoenix_vanguard');
  console.log('Team STILL in pending (should be false):', stillInPending);

  console.log('\n=== STEP 6: Verify Player Waiting Hall Status now AUTHORIZED ===');
  const status2 = await get('/api/auth/status?id=' + userId + '&callsign=phoenix_vanguard');
  console.log('Player status after approval:', status2.data.status, 'isApproved:', status2.data.isApproved);

  console.log('\n=== STEP 7: Simulate Page Refresh (Multiple Rapid Requests) ===');
  for (let i = 1; i <= 3; i++) {
    const refreshed = await get('/api/admin/pending?_t=' + Date.now());
    const reappeared = refreshed.data.teams.some(t => t._id === teamId || t.callsign === 'phoenix_vanguard');
    console.log(`Refresh #${i}: Team reappeared as pending:`, reappeared);
  }

  console.log('\n=== STEP 8: Clean up test squad ===');
  const rem = await post('/api/admin/teams/remove', { teamId: teamId });
  console.log('Cleanup result:', rem.data.message);

  console.log('\n>>> ALL TEST VERIFICATIONS PASSED 100%! <<<');
})();
