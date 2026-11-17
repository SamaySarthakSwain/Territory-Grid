const fs = require('fs');

const html = fs.readFileSync('public/member_checkin.html', 'utf8');
['scan-detected-banner', 'scan-result-team-name', 'scan-result-rank', 'scan-result-suit', 'scan-result-pts-tag'].forEach(id => {
  console.log(id + ': ' + (html.includes('id="' + id + '"') ? 'EXISTS' : 'MISSING'));
});
