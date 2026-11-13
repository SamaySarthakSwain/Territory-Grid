const fs = require('fs');
const content = fs.readFileSync('api/index.js', 'utf8');
const idx = content.indexOf("pathname === '/api/auth/register'");
console.log(content.substring(idx - 50, idx + 2000));
