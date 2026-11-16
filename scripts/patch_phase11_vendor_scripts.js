const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'public', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

if (!content.includes('tactical-audio-haptics.js')) {
  content = content.replace('</style>', '</style>\n  <script src="vendor/tactical-audio-haptics.js"></script>\n  <script src="vendor/network-monitor.js"></script>');
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('Successfully patched public/index.html');
} else {
  console.log('public/index.html already contains vendor scripts');
}
