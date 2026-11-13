const fs = require('fs');
const content = fs.readFileSync('api/index.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('if (atlasDb)') || l.includes('if (!atlasDb)')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
