const fs = require('fs');

const srv = fs.readFileSync('web_server/server.js', 'utf8');

const idx = srv.indexOf('class MongoDatabase');
console.log(srv.substring(idx, idx + 1500));
