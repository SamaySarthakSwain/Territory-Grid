const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'member_checkin.html'), 'utf8');

const matches = [];
let idx = 0;
while ((idx = html.indexOf('btn-force-award', idx)) !== -1) {
  matches.push(idx);
  idx += 'btn-force-award'.length;
}
console.log('Occurrences of btn-force-award:', matches);
