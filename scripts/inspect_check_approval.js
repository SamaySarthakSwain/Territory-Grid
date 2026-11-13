const fs = require('fs');
const login = fs.readFileSync('public/login.html', 'utf8');

const idx = login.indexOf('function checkApprovalStatus');
console.log(login.substring(idx, idx + 1500));
