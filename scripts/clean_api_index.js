const fs = require('fs');
const api = fs.readFileSync('api/index.js', 'utf8');

const lines = api.split('\n');
console.log('Total lines:', lines.length);
console.log('Line 1532:', lines[1531]);
console.log('Truncating lines after 1532...');

// Keep only up to line 1532
const validCode = lines.slice(0, 1532).join('\n') + '\n';
fs.writeFileSync('api/index.js', validCode, 'utf8');
console.log('Saved valid api/index.js. Checking syntax...');
try {
  require('child_process').execSync('node -c api/index.js');
  console.log('Syntax OK!');
} catch (e) {
  console.error('Syntax error:', e.message);
}
