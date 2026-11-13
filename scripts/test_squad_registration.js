const handler = require('../api/index.js');
const http = require('http');

function invokeHandler(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const req = new http.IncomingMessage(null);
    req.method = method;
    req.url = path;
    req.headers = { 'content-type': 'application/json' };

    let resBody = '';
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(code, headers) {
        this.statusCode = code;
        this.headers = headers || {};
      },
      end(chunk) {
        if (chunk) resBody += chunk;
        try {
          resolve({ status: this.statusCode, json: JSON.parse(resBody), headers: this.headers });
        } catch (e) {
          resolve({ status: this.statusCode, text: resBody, headers: this.headers });
        }
      }
    };

    if (body) {
      req.push(JSON.stringify(body));
      req.push(null);
    } else {
      req.push(null);
    }

    handler(req, res).catch(reject);
  });
}

async function runSquadTest() {
  console.log('--- Step 1: Register Player Squad via api/index.js ---');
  const testCallsign = 'squad_live_' + Date.now();
  const regRes = await invokeHandler('POST', '/api/auth/register', {
    role: 'PLAYER',
    callsign: testCallsign,
    name: 'Live Squad Beta',
    password: 'password123'
  });
  console.log('Register status:', regRes.status, 'Response:', regRes.json);

  console.log('\n--- Step 2: Query Pending Approvals as Admin ---');
  const pendingRes = await invokeHandler('GET', '/api/admin/pending');
  console.log('Pending count:', pendingRes.json.count);
  const foundSquad = (pendingRes.json.teams || []).find(t => t.callsign === testCallsign);
  console.log('Found new squad in admin pending queue:', !!foundSquad);

  if (!foundSquad) {
    throw new Error('Squad was not found in pending queue!');
  }

  console.log('\n--- Step 3: Approve Squad via /api/admin/approve ---');
  const approveRes = await invokeHandler('POST', '/api/admin/approve', {
    type: 'TEAM',
    id: foundSquad._id
  });
  console.log('Approve status:', approveRes.status, 'Response:', approveRes.json);

  console.log('\n--- Step 4: Check Clearance Status via /api/auth/status ---');
  const statusRes = await invokeHandler('GET', `/api/auth/status?id=${foundSquad._id}&callsign=${testCallsign}`);
  console.log('Status query response:', statusRes.json);
  console.log('Is Approved:', statusRes.json.isApproved, 'Status:', statusRes.json.status);

  if (statusRes.json.isApproved && statusRes.json.status === 'AUTHORIZED') {
    console.log('\n>>> SUCCESS: Squad registration -> admin pending -> approval -> authorization cycle passed! <<<');
  } else {
    throw new Error('Squad approval verification failed!');
  }

  // Step 5: Clean up test squad and user
  const dbAllRes = await invokeHandler('GET', '/api/database/all');
  if (dbAllRes.json && dbAllRes.json.data) {
    dbAllRes.json.data.users = (dbAllRes.json.data.users || []).filter(u => u.callsign !== testCallsign);
    dbAllRes.json.data.teams = (dbAllRes.json.data.teams || []).filter(t => t.callsign !== testCallsign);
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
    const SUPABASE_ANON = process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';
    await fetch(`${SUPABASE_URL}/rest/v1/territory_store`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key: 'main_store',
        data: dbAllRes.json.data,
        updated_at: new Date().toISOString()
      })
    });
    console.log('Cleaned up test squad.');
  }
}

runSquadTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
