const fs = require('fs');
const vm = require('vm');

const files = [
  'public/login.html',
  'public/admin_panel.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/leaderboard.html',
  'public/index.html'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    const scripts = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
    scripts.forEach((s, idx) => {
      if (s.includes('src=')) return;
      const code = s.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '');
      try {
        new vm.Script(code);
        console.log(`${file} script ${idx}: VALID`);
      } catch (e) {
        console.error(`${file} script ${idx}: SYNTAX ERROR -> ${e.message}`);
      }
    });
  }
});
