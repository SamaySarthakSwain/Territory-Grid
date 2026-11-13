const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'leaderboard.html'), 'utf8');

const idx = html.indexOf('<button class="flex flex-col items-center justify-center');
console.log(html.slice(idx - 50, idx + 600));
