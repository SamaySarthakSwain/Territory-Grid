const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'member_checkin.html'), 'utf8');

const matches = html.match(/function\s+[a-zA-Z0-9_]+\s*\(/g);
console.log('Functions in member_checkin.html:', matches);
