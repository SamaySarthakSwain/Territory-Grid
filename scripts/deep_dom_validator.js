const fs = require('fs');
const path = require('path');

const files = [
  'public/index.html',
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/admin_panel.html',
  'public/leaderboard.html'
];

let totalIssues = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.error('File not found: ' + fullPath);
    return;
  }

  console.log('\n=== Checking: ' + file + ' ===');
  const content = fs.readFileSync(fullPath, 'utf8');

  // 1. Collect all declared IDs in the HTML
  const declaredIds = new Set();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    declaredIds.add(match[1]);
  }

  // 2. Find all document.getElementById calls
  const getElRegex = /document\.getElementById\(\s*["']([^"']+)["']\s*\)/gi;
  const missingIds = new Set();
  const knownDynamicIds = new Set(['player-celebration-toast', 'award-toast-pill', 'admin-toast-banner', 'current-score', 'screen-waiting-hall', 'screen-active-hunt']);
  while ((match = getElRegex.exec(content)) !== null) {
    const id = match[1];
    // Dynamic or generated IDs created programmatically
    if (!declaredIds.has(id) && !knownDynamicIds.has(id)) {
      missingIds.add(id);
    }
  }

  if (missingIds.size > 0) {
    console.log('  ⚠️ Unmatched DOM IDs queried by getElementById:');
    missingIds.forEach(id => console.log('    - ' + id));
    totalIssues += missingIds.size;
  } else {
    console.log('  ✅ All DOM IDs queried by getElementById exist in HTML (' + declaredIds.size + ' declared IDs)!');
  }

  // 3. Check onclick functions
  const onclickRegex = /\bonclick=["']\s*([a-zA-Z0-9_$]+)\s*\(/gi;
  const onclickFunctions = new Set();
  while ((match = onclickRegex.exec(content)) !== null) {
    onclickFunctions.add(match[1]);
  }

  const missingFunctions = [];
  onclickFunctions.forEach(fn => {
    const builtins = ['alert', 'confirm', 'prompt', 'print', 'close', 'open'];
    if (!builtins.includes(fn)) {
      const fnDefRegex = new RegExp('(?:function\\s+' + fn + '\\b|window\\.' + fn + '\\s*=|var\\s+' + fn + '\\s*=|let\\s+' + fn + '\\s*=|const\\s+' + fn + '\\s*=)', 'i');
      if (!fnDefRegex.test(content)) {
        missingFunctions.push(fn);
      }
    }
  });

  if (missingFunctions.length > 0) {
    console.log('  ⚠️ Missing onclick functions:');
    missingFunctions.forEach(fn => console.log('    - ' + fn));
    totalIssues += missingFunctions.length;
  } else {
    console.log('  ✅ All ' + onclickFunctions.size + ' onclick handlers correspond to defined functions!');
  }
});

console.log('\n=======================================');
console.log('DOM & Onclick Validation Issues: ' + totalIssues);
console.log('=======================================');
