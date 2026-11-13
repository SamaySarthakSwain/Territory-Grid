const fs = require('fs');
const lines = fs.readFileSync('api/index.js', 'utf8').split('\n');
console.log(lines.slice(215, 330).join('\n'));
