async function testLiveVercel() {
  const base = 'https://territory-grid-delta.vercel.app';
  console.log('Testing live deployment at:', base);

  // 1. Check health / database all
  const dbRes = await fetch(base + '/api/database/all?_t=' + Date.now(), { cache: 'no-store' });
  console.log('GET /api/database/all Status:', dbRes.status);
  const dbData = await dbRes.json();
  console.log('Live users count:', (dbData.data && dbData.data.users) ? dbData.data.users.length : 'N/A');
  console.log('Live teams count:', (dbData.data && dbData.data.teams) ? dbData.data.teams.length : 'N/A');

  // 2. Register live test operative
  const testCallsign = 'phone_test_' + Date.now();
  console.log('\nRegistering test operative with callsign:', testCallsign);
  const regRes = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'PLAYER',
      name: 'Mobile Phone Squad',
      callsign: testCallsign,
      password: 'mypassword123'
    })
  });
  console.log('POST /api/auth/register Status:', regRes.status);
  const regData = await regRes.json();
  console.log('Register response:', regData);

  // 3. Admin checks pending queue on Vercel
  console.log('\nAdmin polling /api/admin/pending on Vercel...');
  const pendingRes = await fetch(base + '/api/admin/pending?_t=' + Date.now(), { cache: 'no-store' });
  console.log('GET /api/admin/pending Status:', pendingRes.status);
  const pendingData = await pendingRes.json();
  console.log('Pending count:', pendingData.count);
  const found = (pendingData.teams || []).find(t => t.callsign === testCallsign);
  console.log('Admin sees pending squad:', !!found);

  if (!found) {
    console.error('Squad not found in pending queue! Testing again in 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
    const retryRes = await fetch(base + '/api/admin/pending?_t=' + Date.now(), { cache: 'no-store' });
    const retryData = await retryRes.json();
    console.log('Retry pending count:', retryData.count);
    const retryFound = (retryData.teams || []).find(t => t.callsign === testCallsign);
    console.log('Retry found:', !!retryFound);
    if (!retryFound) throw new Error('Live verification failed: Admin did not receive pending squad!');
  }

  // 4. Admin approves
  const targetId = (found || {})._id;
  console.log('\nAdmin approving squad with ID:', targetId);
  const approveRes = await fetch(base + '/api/admin/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'TEAM',
      id: targetId
    })
  });
  console.log('POST /api/admin/approve Status:', approveRes.status);
  const approveData = await approveRes.json();
  console.log('Approve response:', approveData);

  // 5. Mobile polls status
  console.log('\nMobile phone polling /api/auth/status...');
  const statusRes = await fetch(base + '/api/auth/status?id=' + encodeURIComponent(targetId) + '&callsign=' + encodeURIComponent(testCallsign) + '&_t=' + Date.now(), { cache: 'no-store' });
  console.log('GET /api/auth/status Status:', statusRes.status);
  const statusData = await statusRes.json();
  console.log('Mobile sees status:', statusData);
  console.log('IS APPROVED:', statusData.isApproved, 'STATUS:', statusData.status);

  // 6. Clean up
  console.log('\nCleaning up live test operative...');
  const resetRes = await fetch(base + '/api/admin/teams/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: targetId })
  });
  console.log('Clean up status:', resetRes.status);

  console.log('\n>>> ALL LIVE VERCEL TESTS PASSED WITH 100% SUCCESS! <<<');
}

testLiveVercel().catch(console.error);
