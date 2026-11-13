const https = require('https');

https.get('https://territory-grid-delta.vercel.app/api/database/all', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const data = JSON.parse(d);
    console.log('Engine:', data.engine);
    console.log('Connected:', data.connected);
    console.log('Host:', data.host);
    console.log('Users count:', data.stats.usersCount);
    console.log('Users:');
    (data.collections.users || []).forEach(u => {
      console.log(`_id: ${u._id}, callsign: ${u.callsign}, role: ${u.role}, isApproved: ${u.isApproved} (${typeof u.isApproved})`);
    });
  });
});
