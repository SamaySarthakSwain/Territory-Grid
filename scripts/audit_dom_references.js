const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

console.log('=== DOM REFERENCE INTEGRITY AUDIT ===');
files.forEach(file => {
  const content = fs.readFileSync(path.join('public', file), 'utf8');
  const regex = /document\.getElementById\(['"]([^'"]+)['"]/g;
  let match;
  const missing = [];
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    if (!content.includes('id="' + id + '"') && !content.includes("id='" + id + "'")) {
      missing.push(id);
    }
  }
  const uniqueMissing = [...new Set(missing)];
  if (uniqueMissing.length > 0) {
    console.log(`[!] ${file}: MISSING IDS: ${uniqueMissing.join(', ')}`);
  } else {
    console.log(`[OK] ${file}: All referenced element IDs exist in DOM.`);
  }
});
