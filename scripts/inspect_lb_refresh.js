const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'leaderboard.html'), 'utf8');

const idx = html.indexOf('function refreshLeaderboard');
console.log(html.slice(idx, idx + 1400));
