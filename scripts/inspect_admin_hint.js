const fs = require('fs');
const content = fs.readFileSync('public/login.html', 'utf8');
const idx = content.indexOf("admin-credentials-hint");
console.log(content.substring(idx - 50, idx + 600));
