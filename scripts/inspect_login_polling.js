const fs = require('fs');
const login = fs.readFileSync('public/login.html', 'utf8');

function searchPatterns(file, patterns) {
  patterns.forEach(p => {
    let idx = 0;
    while ((idx = file.indexOf(p, idx)) !== -1) {
      console.log('Found "' + p + '" at index ' + idx);
      console.log(file.substring(idx - 50, idx + 400));
      console.log('-------------------------------------------');
      idx += p.length;
    }
  });
}

searchPatterns(login, ['WAITING_APPROVAL', 'pollApproval', 'isApproved', 'checkApproval']);
