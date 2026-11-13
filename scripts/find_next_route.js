const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const idx = api.indexOf("pathname === '/api/auth/status'");
const nextRouteIdx = api.indexOf("if (pathname ===", idx + 50);
console.log('Next route:');
console.log(api.substring(nextRouteIdx - 50, nextRouteIdx + 150));
