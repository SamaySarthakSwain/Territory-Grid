const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'leaderboard.html'), 'utf8');

const idx = html.indexOf('emoji_eventsRank');
console.log(html.slice(idx - 100, idx + 600));
