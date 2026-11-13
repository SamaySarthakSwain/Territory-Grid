const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const lines = api.split('\n');
console.log(lines.slice(1525, 1570).map((l, i) => (1526 + i) + ': ' + l).join('\n'));
