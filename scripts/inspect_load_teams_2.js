const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'member_checkin.html'), 'utf8');

const idx = html.indexOf('function loadTeams');
console.log(html.slice(idx + 1000, idx + 2400));
