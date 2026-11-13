const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const lines = api.split('\n');
console.log(lines.slice(605, 630).join('\n'));
