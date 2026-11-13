async function testLogin() {
  const base = 'https://territory-grid-delta.vercel.app';

  // 1. Test Admin Login (samay / samay)
  console.log('Testing Admin Login (samay / samay)...');
  const adminRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callsign: 'samay',
      password: 'samay',
      requestedRole: 'ADMIN'
    })
  });
  console.log('Admin login status:', adminRes.status);
  const adminData = await adminRes.json();
  console.log('Admin login data:', adminData);

  // 2. Test Player Login (team1)
  console.log('\nTesting Player Login (team1)...');
  const teamRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callsign: 'team1',
      password: 'wrong_password',
      requestedRole: 'PLAYER'
    })
  });
  console.log('Wrong pass status:', teamRes.status, await teamRes.json());
}
testLogin();
