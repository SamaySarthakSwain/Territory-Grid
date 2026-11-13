const fs = require('fs');

const srv = fs.readFileSync('web_server/server.js', 'utf8');
const api = fs.readFileSync('api/index.js', 'utf8');

const srvIdx = srv.indexOf("pathname === '/api/auth/register'");
console.log('SERVER.JS lines 260-310:');
console.log(srv.substring(srvIdx + 600, srvIdx + 1800));
