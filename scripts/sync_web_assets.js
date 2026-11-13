const fs = require('fs');
const path = require('path');

const srcDir = 'public';
const destDirs = [
  'design_refs/html',
  'app/src/main/assets/public'
];

const files = fs.readdirSync(srcDir);

destDirs.forEach(dest => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isFile() && !file.endsWith('.apk')) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} -> ${dest}`);
    }
  });
});

console.log('All web assets synced successfully!');
