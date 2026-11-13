const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const idx = api.indexOf("pathname === '/api/auth/status'");
console.log(api.substring(idx - 30, idx + 1200));
