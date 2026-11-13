const fs = require('fs');
const srv = fs.readFileSync('web_server/server.js', 'utf8');

const idx = srv.indexOf("pathname === '/api/admin/pending'");
console.log(srv.substring(idx - 50, idx + 1400));
