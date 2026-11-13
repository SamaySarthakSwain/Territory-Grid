const fs = require('fs');

let html = fs.readFileSync('public/login.html', 'utf8');

// Fix 1: loadDynamicStations clue fetch
html = html.replace(
  "var res = await fetch(apiUrl('/api/clues?all=true&_t=' + Date.now(), { cache: 'no-store' });",
  "var res = await fetch(apiUrl('/api/clues?all=true&_t=' + Date.now()), { cache: 'no-store' });"
);

// Fix 2: checkApprovalStatus status fetch
html = html.replace(
  "var res = await fetch(apiUrl('/api/auth/status?id=' + encodeURIComponent(uid) + '&callsign=' + encodeURIComponent(csign) + '&_t=' + Date.now(), {",
  "var res = await fetch(apiUrl('/api/auth/status?id=' + encodeURIComponent(uid) + '&callsign=' + encodeURIComponent(csign) + '&_t=' + Date.now()), {"
);

fs.writeFileSync('public/login.html', html, 'utf8');
console.log('Fixed syntax in public/login.html');
