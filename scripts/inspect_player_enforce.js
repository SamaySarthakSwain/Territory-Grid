const fs = require('fs');
const player = fs.readFileSync('public/player_dashboard.html', 'utf8');

function printSection(name) {
  const idx = player.indexOf(name);
  console.log('=== ' + name + ' ===');
  console.log(player.substring(idx, idx + 1200));
}

printSection('function enforceClearance');
printSection('function syncTeamData');
