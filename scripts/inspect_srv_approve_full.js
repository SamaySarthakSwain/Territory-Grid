const fs = require('fs');
const srv = fs.readFileSync('web_server/server.js', 'utf8');

const idx = srv.indexOf("pathname === '/api/admin/approve'");
console.log(srv.substring(idx, idx + 1400));
