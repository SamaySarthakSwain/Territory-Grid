const fs = require('fs');
const content = fs.readFileSync('api/index.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes("pathname.startsWith('/api/admin')") || l.includes("'/api/admin/")) {
    console.log((idx+1) + ': ' + l);
  }
});
