const fs = require('fs');
const lines = fs.readFileSync('web_server/server.js', 'utf8').split('\n');
console.log(lines.slice(450, 490).join('\n'));
