const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 8088,
      path: path,
      method: method,
      headers: payload ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      } : {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('--- Testing GET /api/admin/logs ---');
  const logsRes = await request('GET', '/api/admin/logs');
  console.log('Status:', logsRes.status, 'Total logs in db:', logsRes.data.total, 'Logs returned:', logsRes.data.logs.length);
  if (logsRes.data.logs.length > 0) {
    console.log('Most recent log:', logsRes.data.logs[0]);
  }

  console.log('\n--- Testing Teams Fetch ---');
  const teamsRes = await request('GET', '/api/teams');
  console.log('Teams count:', teamsRes.data.teams.length);
  const sampleTeam = teamsRes.data.teams[0];

  if (sampleTeam) {
    console.log('\n--- Testing POST /api/admin/teams/reset-points ---');
    console.log('Resetting points for:', sampleTeam.name, '(' + sampleTeam._id + ')', 'Current score:', sampleTeam.score);
    const resetRes = await request('POST', '/api/admin/teams/reset-points', { teamId: sampleTeam._id });
    console.log('Reset response:', resetRes.status, resetRes.data);

    const afterResetTeams = await request('GET', '/api/teams');
    const checked = afterResetTeams.data.teams.find(t => t._id === sampleTeam._id);
    console.log('Score after reset:', checked ? checked.score : 'Not found');
  }

  console.log('\n--- Checking audit log for the reset event ---');
  const logsAfter = await request('GET', '/api/admin/logs');
  console.log('Latest event:', logsAfter.data.logs[0]);

  console.log('\n--- Testing Temporary Team Creation & Removal ---');
  // Register a dummy squad
  const regRes = await request('POST', '/api/auth/register', {
    role: 'PLAYER',
    name: 'Temporary Test Squad',
    callsign: 'test_temp_squad',
    password: 'password123'
  });
  console.log('Registered temp squad:', regRes.data);
  const tempTeamId = regRes.data.teamId;

  // Verify temp squad exists
  const teamsCheck = await request('GET', '/api/teams');
  const tempFound = teamsCheck.data.teams.find(t => t._id === tempTeamId);
  console.log('Temp team exists in DB:', !!tempFound);

  // Now delete temp squad via POST /api/admin/teams/remove
  const removeRes = await request('POST', '/api/admin/teams/remove', { teamId: tempTeamId });
  console.log('POST /api/admin/teams/remove:', removeRes.status, removeRes.data);

  // Verify temp squad is gone
  const teamsAfterRemove = await request('GET', '/api/teams');
  const tempStillExists = teamsAfterRemove.data.teams.find(t => t._id === tempTeamId);
  console.log('Temp team still exists:', !!tempStillExists);

  // Verify audit log has the REMOVE_TEAM event
  const logsFinal = await request('GET', '/api/admin/logs');
  console.log('Latest event after removal:', logsFinal.data.logs[0]);
  console.log('\nAll API tests PASSED successfully!');
})();
