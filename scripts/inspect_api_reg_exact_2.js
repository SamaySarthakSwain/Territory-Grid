const fs = require('fs');
const lines = fs.readFileSync('api/index.js', 'utf8').split('\n');
console.log(lines.slice(310, 360).join('\n'));
