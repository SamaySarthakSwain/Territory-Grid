const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'player_dashboard.html'), 'utf8');

const idx = html.indexOf('function scrollToTop');
console.log(html.slice(idx, idx + 600));
