const fs = require('fs');
const html = fs.readFileSync('public/admin_panel.html', 'utf8');

const idx = html.indexOf('pendingTeams.forEach');
console.log(html.substring(idx, idx + 1800));
