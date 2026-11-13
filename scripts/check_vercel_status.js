const https = require('https');

function checkVercel(path) {
  return new Promise((resolve) => {
    https.get('https://territory-grid-delta.vercel.app' + path, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, body: d.substring(0, 300) });
        }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

(async () => {
  console.log('Checking Vercel game state:');
  const gs = await checkVercel('/api/game/state');
  console.log('Game state:', gs);

  console.log('\nChecking Vercel pending:');
  const p = await checkVercel('/api/admin/pending');
  console.log('Pending:', p);

  console.log('\nChecking Vercel teams:');
  const t = await checkVercel('/api/teams');
  console.log('Teams count:', t.body ? t.body.teams ? t.body.teams.length : 'no teams' : 'error');
})();
