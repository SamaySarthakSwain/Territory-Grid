const https = require('https');

setTimeout(() => {
  https.get('https://territory-grid-delta.vercel.app/admin_panel.html?_t=' + Date.now(), (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Contains loadApprovedRoster def:', body.includes('async function loadApprovedRoster()'));
      console.log('Contains ops-pending-banner:', body.includes('ops-pending-banner'));
    });
  });
}, 3000);
