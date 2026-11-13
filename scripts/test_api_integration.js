const handler = require('../api/index.js');
const http = require('http');

// Helper to simulate HTTP request to the serverless handler
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

async function runLiveTest() {
  console.log('--- Step 1: Register Field Marshal via api/index.js ---');
  const testCallsign = 'marshal_live_' + Date.now();
  const regRes = await invokeHandler('POST', '/api/auth/register', {
    role: 'MEMBER',
    callsign: testCallsign,
    name: 'Live Field Marshal Test',
    password: 'password123',
    zoneId: 'ZONE_01',
    zoneLabel: 'Zone 1 - Campus Station'
  });
  console.log('Register status:', regRes.status, 'Response:', regRes.json);

  console.log('\n--- Step 2: Query Pending Approvals as Admin ---');
  const pendingRes = await invokeHandler('GET', '/api/admin/pending');
  console.log('Pending count:', pendingRes.json.count);
  const foundInPending = (pendingRes.json.users || []).find(u => u.callsign === testCallsign);
  console.log('Found new marshal in admin pending queue:', !!foundInPending);

  if (!foundInPending) {
    throw new Error('Marshal was not found in pending queue!');
  }

  console.log('\n--- Step 3: Approve Marshal via /api/admin/approve ---');
  const approveRes = await invokeHandler('POST', '/api/admin/approve', {
    type: 'USER',
    id: foundInPending._id
  });
  console.log('Approve status:', approveRes.status, 'Response:', approveRes.json);

  console.log('\n--- Step 4: Check Clearance Status via /api/auth/status ---');
  const statusRes = await invokeHandler('GET', `/api/auth/status?id=${foundInPending._id}&callsign=${testCallsign}`);
  console.log('Status query response:', statusRes.json);
  console.log('Is Approved:', statusRes.json.isApproved, 'Status:', statusRes.json.status);

  if (statusRes.json.isApproved && statusRes.json.status === 'AUTHORIZED') {
    console.log('\n>>> SUCCESS: Full registration -> admin pending -> approval -> authorization cycle passed flawlessly with persistent cloud store! <<<');
  } else {
    throw new Error('Approval verification failed!');
  }

  // Step 5: Clean up test user
  const dbAllRes = await invokeHandler('GET', '/api/database/all');
  if (dbAllRes.json && dbAllRes.json.data) {
    dbAllRes.json.data.users = (dbAllRes.json.data.users || []).filter(u => u.callsign !== testCallsign);
    // Persist clean state
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
    console.log('Cleaned up test marshal from cloud store.');
  }
}

runLiveTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
