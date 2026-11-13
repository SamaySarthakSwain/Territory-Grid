const fs = require('fs');
const content = fs.readFileSync('public/login.html', 'utf8');
const idx = content.indexOf("function selectPortal");
console.log(content.substring(idx, idx + 1800));
