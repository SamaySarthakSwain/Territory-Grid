const fs = require('fs');
const content = fs.readFileSync('public/player_dashboard.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1205, 1235).join('\n'));
