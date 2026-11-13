const fs = require('fs');
const content = fs.readFileSync('public/login.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('apiUrl')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
