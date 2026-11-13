const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const lines = api.split('\n');
console.log(lines.slice(1500, 1535).map((l, i) => (1501 + i) + ': ' + l).join('\n'));
