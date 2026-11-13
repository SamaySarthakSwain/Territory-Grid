const fs = require('fs');
const path = require('path');

const files = [
  'public/admin_panel.html',
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/leaderboard.html',
  'public/index.html'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const idx = code.indexOf('function apiUrl');
  if (idx !== -1) {
    console.log(`=== ${f} ===`);
    console.log(code.slice(idx, idx + 400));
  }
});
