const fs = require('fs');
const login = fs.readFileSync('public/login.html', 'utf8');

const matches = login.match(/function\s+[a-zA-Z0-9_]+/g);
console.log(matches);
