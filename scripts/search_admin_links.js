const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && f !== 'node_modules' && f !== '.git' && f !== 'build') {
      searchDir(full);
    } else if (stat.isFile() && (f.endsWith('.html') || f.endsWith('.js'))) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('admin_panel.html')) {
        console.log('Found admin_panel.html in:', full);
      }
    }
  }
}

searchDir(path.join(__dirname, '..', 'public'));
