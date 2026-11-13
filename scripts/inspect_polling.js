const fs = require('fs');

const files = [
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/admin_panel.html',
  'public/leaderboard.html'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('setInterval') || l.includes('setTimeout') || l.includes('poll')) {
        console.log(`${file}:${idx+1} -> ${l.trim()}`);
      }
    });
  }
});
