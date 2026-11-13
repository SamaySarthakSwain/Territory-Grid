const fs = require('fs');

const content = fs.readFileSync('public/admin_panel.html', 'utf8');

// Find all onclick attributes
const onclickRegex = /onclick="([a-zA-Z0-9_]+)\(/g;
let match;
const uniqueOnclicks = new Set();
while ((match = onclickRegex.exec(content)) !== null) {
  uniqueOnclicks.add(match[1]);
}

console.log('Total onclick functions:', uniqueOnclicks.size);
for (const fn of uniqueOnclicks) {
  const isDef = content.includes('function ' + fn) || 
                content.includes('var ' + fn) || 
                content.includes('let ' + fn) || 
                content.includes('const ' + fn) || 
                content.includes(fn + ' =');
  if (!isDef) {
    console.error('MISSING ONCLICK FUNCTION:', fn);
  } else {
    console.log('OK:', fn);
  }
}
