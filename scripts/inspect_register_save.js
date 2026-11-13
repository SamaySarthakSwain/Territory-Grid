const fs = require('fs');
const srv = fs.readFileSync('web_server/server.js', 'utf8');

const idx = srv.indexOf("pathname === '/api/auth/register'");
console.log(srv.substring(idx + 1000, idx + 2400));
