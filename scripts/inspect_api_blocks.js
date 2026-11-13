const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

function findBlock(route) {
  const idx = api.indexOf(route);
  console.log('=== ' + route + ' ===');
  if (idx !== -1) {
    console.log(api.substring(idx - 30, idx + 800));
  } else {
    console.log('NOT FOUND');
  }
}

findBlock("pathname === '/api/admin/pending'");
findBlock("pathname === '/api/admin/approve'");
findBlock("pathname === '/api/auth/status'");
