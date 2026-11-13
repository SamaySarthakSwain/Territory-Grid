const fs = require('fs');
const content = fs.readFileSync('public/login.html', 'utf8');
const idx = content.indexOf("function fillAdminCredentials");
console.log(content.substring(idx, idx + 1000));
