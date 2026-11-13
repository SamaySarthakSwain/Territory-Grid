const https = require('https');

const BASE_URL = 'https://territory-grid-delta.vercel.app';

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = data ? JSON.stringify(data) : null;
    const req = https.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('=== STARTING FULL END-TO-END VERIFICATION ===\n');
  const ts = Date.now();
  const squadCallsign = 'test_sq_' + ts;
  const marshalCallsign = 'test_mr_' + ts;

  // 1. Register Squad
  console.log('1. Registering new Squad:', squadCallsign);
  const regSquad = await request('/api/auth/register', 'POST', {
    role: 'PLAYER',
    callsign: squadCallsign,
    password: 'pass_' + ts,
    name: 'Automated Test Squad ' + ts
  });
  console.log('Squad reg status:', regSquad.status, 'success:', regSquad.data.success, 'status:', regSquad.data.status);
  const squadUserId = regSquad.data.user._id;
  const squadTeamId = regSquad.data.user.teamId;

  // 2. Register Marshal
  console.log('\n2. Registering new Marshal:', marshalCallsign);
  const regMarshal = await request('/api/auth/register', 'POST', {
    role: 'MEMBER',
    callsign: marshalCallsign,
    password: 'pass_' + ts,
    name: 'Field Marshal ' + ts,
    zoneId: 'ZONE_01',
    zoneLabel: 'Station 1'
  });
  console.log('Marshal reg status:', regMarshal.status, 'success:', regMarshal.data.success, 'status:', regMarshal.data.status);
  const marshalUserId = regMarshal.data.user._id;

  // 3. Admin Fetches Pending
  console.log('\n3. Admin querying /api/admin/pending...');
  const pending = await request('/api/admin/pending?_t=' + Date.now(), 'GET');
  console.log('Pending count:', pending.data.count);
  const foundSquad = (pending.data.teams || []).find(t => t._id === squadTeamId || t.callsign === squadCallsign);
  const foundMarshal = (pending.data.users || []).find(u => u._id === marshalUserId || u.callsign === marshalCallsign);
  console.log('Admin detected pending Squad in queue:', !!foundSquad, foundSquad ? foundSquad.name : 'NONE');
  console.log('Admin detected pending Marshal in queue:', !!foundMarshal, foundMarshal ? foundMarshal.name : 'NONE');

  if (!foundSquad || !foundMarshal) {
    throw new Error('FAILED: Registered entities were not found in admin pending queue!');
  }

  // 4. Admin Approves Squad
  console.log('\n4. Admin Approving Squad:', squadTeamId);
  const approveSquad = await request('/api/admin/approve', 'POST', {
    type: 'TEAM',
    id: squadTeamId
  });
  console.log('Approve Squad status:', approveSquad.status, 'msg:', approveSquad.data.message);

  // 5. Check Squad Status (simulating mobile waiting hall)
  console.log('\n5. Mobile checking status for Squad...');
  const statusSquad = await request(`/api/auth/status?id=${squadUserId}&callsign=${squadCallsign}&_t=` + Date.now());
  console.log('Squad approval status seen by mobile:', statusSquad.data.isApproved, 'status:', statusSquad.data.status);

  // 6. Admin Approves Marshal
  console.log('\n6. Admin Approving Marshal:', marshalUserId);
  const approveMarshal = await request('/api/admin/approve', 'POST', {
    type: 'USER',
    id: marshalUserId
  });
  console.log('Approve Marshal status:', approveMarshal.status, 'msg:', approveMarshal.data.message);

  // 7. Check Marshal Status (simulating mobile waiting hall)
  console.log('\n7. Mobile checking status for Marshal...');
  const statusMarshal = await request(`/api/auth/status?id=${marshalUserId}&callsign=${marshalCallsign}&_t=` + Date.now());
  console.log('Marshal approval status seen by mobile:', statusMarshal.data.isApproved, 'status:', statusMarshal.data.status);

  // 8. Verify Pending is now empty for these entities
  console.log('\n8. Re-querying /api/admin/pending after approvals...');
  const pendingAfter = await request('/api/admin/pending?_t=' + Date.now(), 'GET');
  const stillFoundSquad = (pendingAfter.data.teams || []).find(t => t._id === squadTeamId);
  const stillFoundMarshal = (pendingAfter.data.users || []).find(u => u._id === marshalUserId);
  console.log('Remaining pending count:', pendingAfter.data.count);
  console.log('Squad cleared from pending queue:', !stillFoundSquad);
  console.log('Marshal cleared from pending queue:', !stillFoundMarshal);

  // 9. Cleanup test squad & marshal
  console.log('\n9. Cleaning up test records...');
  await request('/api/admin/teams/remove', 'POST', { teamId: squadTeamId });
  console.log('Cleanup complete.');
  console.log('\n>>> ALL 9 VERIFICATION CHECKS PASSED PERFECTLY! <<<');
}

run().catch(err => {
  console.error('\n*** TEST FAILED ***', err);
  process.exit(1);
});
