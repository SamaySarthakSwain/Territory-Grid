const fs = require('fs');
const lines = fs.readFileSync('api/index.js', 'utf8').split('\n');
console.log(lines.slice(360, 420).join('\n'));
