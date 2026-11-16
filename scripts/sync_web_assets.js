const fs = require('fs');
const path = require('path');

const srcDir = 'public';
const destDirs = [
  'design_refs/html',
  'app/src/main/assets/public'
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name.endsWith('.apk')) return;
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${path.relative('public', srcPath)} -> ${dest}`);
    }
  });
}

destDirs.forEach(dest => {
  copyRecursive(srcDir, dest);
});

console.log('All web assets synced successfully!');
