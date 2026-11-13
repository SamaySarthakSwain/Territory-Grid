const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin_panel.html'), 'utf8');

const matches = [];
let idx = 0;
while ((idx = html.indexOf('setInterval', idx)) !== -1) {
  matches.push(html.slice(Math.max(0, idx - 40), Math.min(html.length, idx + 120)));
  idx += 'setInterval'.length;
}
console.log('setInterval calls in admin_panel.html:', matches);
