const fs = require('fs');
const path = require('path');

function updateDashboard(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const hasCRLF = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  // Fix initial card population on page load:
  content = content.replace(
    `      // Initialize deterministic checkpoint card cipher\n      checkAndRotateCard(false);`,
    `      // Initialize deterministic checkpoint card cipher\n      rotateCardCipher(false);\n      checkAndRotateCard(false);`
  );

  if (hasCRLF) {
    content = content.replace(/\n/g, '\r\n');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('🎉 Updated initial rotation in ' + filePath);
}

const baseDir = path.resolve(__dirname, '..');
updateDashboard(path.join(baseDir, 'public', 'player_dashboard.html'));
updateDashboard(path.join(baseDir, 'app', 'src', 'main', 'assets', 'public', 'player_dashboard.html'));
updateDashboard(path.join(baseDir, 'design_refs', 'html', 'player_dashboard.html'));
