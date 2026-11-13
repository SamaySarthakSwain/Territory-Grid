const fs = require('fs');
const content = fs.readFileSync('public/login.html', 'utf8');
const idx = content.indexOf("ACCESS COMMAND TERMINAL");
console.log(content.substring(idx, idx + 500));
