const fs = require('fs');
let s = fs.readFileSync('web_server/server.js', 'utf8');
s = s.replace("parseInt(urlObj.searchParams.get('limit'), 10)", "parseInt(parsedUrl.query.limit, 10)");
fs.writeFileSync('web_server/server.js', s, 'utf8');
console.log('Fixed urlObj in web_server/server.js');
