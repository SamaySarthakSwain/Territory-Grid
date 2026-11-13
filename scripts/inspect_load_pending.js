const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin_panel.html'), 'utf8');

const idx = html.indexOf('function loadPendingApprovals');
console.log(html.slice(idx, idx + 1200));
