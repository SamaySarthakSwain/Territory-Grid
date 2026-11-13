const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'member_checkin.html'), 'utf8');

console.log(html.slice(70950, 71200));
