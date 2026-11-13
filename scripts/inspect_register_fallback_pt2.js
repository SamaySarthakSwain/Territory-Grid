const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const regIdx = api.indexOf("pathname === '/api/auth/register'");
console.log(api.substring(regIdx + 2000, regIdx + 3500));
