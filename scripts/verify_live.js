const https = require('https');

function check(url) {
  return new Promise(resolve => {
    https.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
  });
}

async function run() {
  const login = await check('https://territory-grid-delta.vercel.app/login.html?_t=' + Date.now());
  console.log('Login status:', login.status);
  console.log('Login has active-session-banner:', login.body.includes('active-session-banner'));
  console.log('Login has no forced redirect:', !login.body.includes('// Check if user is already authenticated\n        var session = getStoredSession();\n        if (session && session.isApproved) {\n          redirectToDashboard(session.role);'));

  const admin = await check('https://territory-grid-delta.vercel.app/admin_panel.html?_t=' + Date.now());
  console.log('Admin status:', admin.status);
  console.log('Admin has syntax fix:', admin.body.includes('if (serverGameState !== \'COUNTDOWN\' && adminCountdownTimer)'));
}

run();
