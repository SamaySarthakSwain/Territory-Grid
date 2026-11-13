const fs = require('fs');

const api = fs.readFileSync('api/index.js', 'utf8');

const idx = api.indexOf('MONGODB_URI');
console.log(api.substring(idx - 50, idx + 800));
