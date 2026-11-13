const fs = require('fs');
const path = require('path');

const files = [
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/leaderboard.html',
  'public/index.html'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const matches = [];
  let idx = 0;
  while ((idx = code.indexOf('setInterval', idx)) !== -1) {
    matches.push(code.slice(Math.max(0, idx - 40), Math.min(code.length, idx + 100)));
    idx += 'setInterval'.length;
  }
  console.log(`\n=== ${f} (${matches.length} setIntervals) ===`);
  matches.forEach(m => console.log('  *', m.replace(/\s+/g, ' ')));
});
