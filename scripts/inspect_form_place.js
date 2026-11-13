const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin_panel.html'), 'utf8');

const idx = html.indexOf('btn-save-place');
const formStart = html.lastIndexOf('<form', idx);
console.log(html.slice(formStart, formStart + 300));
