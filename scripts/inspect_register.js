const fs = require('fs');

const srv = fs.readFileSync('web_server/server.js', 'utf8');
const api = fs.readFileSync('api/index.js', 'utf8');

function printRoute(name, code, term) {
  console.log('=== ' + name + ' ' + term + ' ===');
  const idx = code.indexOf(term);
  if (idx === -1) {
    console.log('NOT FOUND');
  } else {
    console.log(code.substring(idx, idx + 1400));
  }
}

printRoute('SERVER.JS', srv, "pathname === '/api/auth/register'");
printRoute('API/INDEX.JS', api, "pathname === '/api/auth/register'");
