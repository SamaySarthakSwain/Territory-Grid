const fs = require('fs');
['public/login.html', 'public/player_dashboard.html', 'public/member_checkin.html', 'public/admin_panel.html'].forEach(file => {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((l, idx) => {
      if (l.includes("fetch('/api") || l.includes('fetch(`/api') || l.includes('fetch("/api')) {
        console.log(`${file}:${idx+1} -> ${l.trim()}`);
      }
    });
  }
});
