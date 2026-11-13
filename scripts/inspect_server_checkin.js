const fs = require('fs');
const content = fs.readFileSync('web_server/server.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1015, 1070).join('\n'));
