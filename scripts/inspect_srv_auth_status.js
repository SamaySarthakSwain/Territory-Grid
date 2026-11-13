const fs = require('fs');
const srv = fs.readFileSync('web_server/server.js', 'utf8');

const idx = srv.indexOf("pathname === '/api/auth/status'");
console.log(srv.substring(idx - 40, idx + 800));
