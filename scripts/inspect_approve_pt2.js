const fs = require('fs');
const html = fs.readFileSync('public/admin_panel.html', 'utf8');

const idx = html.indexOf('function approveEntity');
console.log(html.substring(idx + 1200, idx + 2500));
