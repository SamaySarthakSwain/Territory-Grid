async function testLoginReal() {
  const base = 'https://territory-grid-delta.vercel.app';

  console.log('1. Logging in as team1 (team1 / team1)...');
  const teamRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callsign: 'team1',
      password: 'team1',
      requestedRole: 'PLAYER'
    })
  });
  console.log('team1 login status:', teamRes.status);
  const teamData = await teamRes.json();
  console.log('team1 login response:', teamData);

  console.log('\n2. Logging in as marshal1 (marshal1 / marshal1)...');
  const mRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callsign: 'marshal1',
      password: 'marshal1',
      requestedRole: 'MEMBER'
    })
  });
  console.log('marshal1 login status:', mRes.status);
  const mData = await mRes.json();
  console.log('marshal1 login response:', mData);
}
testLoginReal();
