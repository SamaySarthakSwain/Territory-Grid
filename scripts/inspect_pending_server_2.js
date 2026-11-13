const fs = require('fs');
const lines = fs.readFileSync('web_server/server.js', 'utf8').split('\n');
console.log(lines.slice(490, 545).join('\n'));
