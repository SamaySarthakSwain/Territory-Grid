const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin_panel.html'), 'utf8');

const idx = html.indexOf('nav-btn-ops');
console.log(html.slice(idx - 50, idx + 800));
