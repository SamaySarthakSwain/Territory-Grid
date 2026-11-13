const https = require('https');

function post(path, body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request('https://territory-grid-delta.vercel.app' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, body: d });
        }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve) => {
    https.get('https://territory-grid-delta.vercel.app' + path, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, body: d });
        }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

(async () => {
  console.log('--- Registering Marshal on Vercel ---');
  const reg = await post('/api/auth/register', {
    role: 'MEMBER',
    callsign: 'marshal_test_' + Date.now(),
    password: 'password123',
    name: 'Field Marshal Beta',
    zoneId: 'ZONE_02',
    zoneLabel: 'Zone 2 - Solar Obelisk'
  });
  console.log('Register response:', reg);

  console.log('\n--- Checking Pending on Vercel ---');
  const pending = await get('/api/admin/pending');
  console.log('Pending response:', pending);
})();
