const fs = require('fs');
const login = fs.readFileSync('public/login.html', 'utf8');

const idx = login.indexOf('async function handleAuthSubmit');
console.log(login.substring(idx, idx + 2500));
