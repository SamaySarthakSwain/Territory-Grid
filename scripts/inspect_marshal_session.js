const fs = require('fs');
const marshal = fs.readFileSync('public/member_checkin.html', 'utf8');

const matches = marshal.match(/function\s+[a-zA-Z0-9_]+/g);
console.log('Marshal functions:');
console.log(matches);

const idx = marshal.indexOf('localStorage');
console.log('\n--- localStorage in member_checkin ---');
console.log(marshal.substring(idx - 50, idx + 600));
