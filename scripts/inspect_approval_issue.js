const fs = require('fs');

const srv = fs.readFileSync('web_server/server.js', 'utf8');
const api = fs.readFileSync('api/index.js', 'utf8');

function printRoute(name, code, term) {
  console.log('=== ' + name + ' ' + term + ' ===');
  const idx = code.indexOf(term);
  if (idx === -1) {
    console.log('NOT FOUND');
  } else {
    console.log(code.substring(idx - 50, idx + 1200));
  }
}

printRoute('SERVER.JS', srv, '/api/admin/pending');
printRoute('SERVER.JS', srv, '/api/admin/approve');
printRoute('API/INDEX.JS', api, '/api/admin/pending');
printRoute('API/INDEX.JS', api, '/api/admin/approve');
