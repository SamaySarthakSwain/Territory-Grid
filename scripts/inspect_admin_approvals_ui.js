const fs = require('fs');
const html = fs.readFileSync('public/admin_panel.html', 'utf8');

const idx = html.indexOf('function loadPendingApprovals');
console.log(html.substring(idx - 50, idx + 1800));
