const fs = require('fs');
const content = fs.readFileSync('api/index.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1140, 1200).join('\n'));
