const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'leaderboard.html'), 'utf8');

const matches = [];
let idx = 0;
while ((idx = html.indexOf('<button class="flex flex-col', idx)) !== -1) {
  matches.push(html.slice(idx, idx + 180));
  idx += 20;
}
console.log('Occurrences in leaderboard.html:', matches);
