const fs = require('fs');
const login = fs.readFileSync('public/login.html', 'utf8');

let idx = 0;
while ((idx = login.indexOf('showWaitingHall', idx)) !== -1) {
  console.log('Index:', idx);
  console.log(login.substring(idx - 60, idx + 200));
  console.log('---');
  idx += 'showWaitingHall'.length;
}
