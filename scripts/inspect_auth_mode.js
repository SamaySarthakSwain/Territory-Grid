const fs = require('fs');
const content = fs.readFileSync('public/login.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(425, 520).join('\n'));
