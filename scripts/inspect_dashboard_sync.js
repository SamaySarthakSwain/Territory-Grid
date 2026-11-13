const fs = require('fs');
const content = fs.readFileSync('public/player_dashboard.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1200, 1270).join('\n'));
