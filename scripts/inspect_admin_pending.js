const fs = require('fs');
const content = fs.readFileSync('public/admin_panel.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1250, 1370).join('\n'));
