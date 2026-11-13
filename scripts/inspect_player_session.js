const fs = require('fs');
const player = fs.readFileSync('public/player_dashboard.html', 'utf8');

const matches = player.match(/function\s+[a-zA-Z0-9_]+/g);
console.log('Player dashboard functions:');
console.log(matches);

const idx = player.indexOf('checkClearance');
if (idx !== -1) {
  console.log('\n--- checkClearance ---');
  console.log(player.substring(idx - 50, idx + 800));
}
