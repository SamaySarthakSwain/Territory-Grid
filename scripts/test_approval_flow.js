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
  // 1. Check pending approvals
  const pendingBefore = await get('/api/admin/pending');
  console.log('Pending count before:', pendingBefore.data.count);
  console.log('Pending teams:', pendingBefore.data.teams.map(t => ({ id: t._id, name: t.name })));

  if (pendingBefore.data.teams.length > 0) {
    const targetTeam = pendingBefore.data.teams[0];
    console.log('Approving team:', targetTeam.name, targetTeam.id || targetTeam._id);

    // Test approve with type: 'TEAM', id: targetTeam._id
    const approveRes = await post('/api/admin/approve', {
      type: 'TEAM',
      id: targetTeam._id
    });
    console.log('Approve response:', approveRes.status, approveRes.data);

    // 2. Check pending approvals right after approve
    const pendingAfter = await get('/api/admin/pending');
    console.log('Pending count after approve:', pendingAfter.data.count);
    console.log('Pending teams after approve:', pendingAfter.data.teams.map(t => ({ id: t._id, name: t.name })));
  }
})();
