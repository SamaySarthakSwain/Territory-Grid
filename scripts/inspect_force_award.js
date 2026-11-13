const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'member_checkin.html'), 'utf8');

const idx = html.indexOf('btn-force-award');
console.log(html.slice(idx - 100, idx + 400));
