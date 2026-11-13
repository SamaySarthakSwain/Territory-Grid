const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const idx = api.indexOf("pathname === '/api/admin/approve'");
console.log(api.substring(idx, idx + 1800));
