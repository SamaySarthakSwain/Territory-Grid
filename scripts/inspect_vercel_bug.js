const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const regIdx = api.indexOf("pathname === '/api/auth/register'");
console.log('=== REGISTER in api/index.js ===');
console.log(api.substring(regIdx, regIdx + 1500));

const pendingIdx = api.indexOf("pathname === '/api/admin/pending'");
console.log('\n=== PENDING in api/index.js ===');
console.log(api.substring(pendingIdx, pendingIdx + 1200));
