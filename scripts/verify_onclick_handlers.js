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

let totalChecks = 0;
let failedChecks = 0;

files.forEach(f => {
  const fullPath = path.join(__dirname, '..', f);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Extract all onclick handlers
  const onclickMatches = content.match(/onclick="([^"]+)"/g) || [];
  const handlers = new Set();
  onclickMatches.forEach(m => {
    const raw = m.replace(/onclick="/, '').replace(/"$/, '').trim();
    // Extract function name
    const fnMatch = raw.match(/^([a-zA-Z0-9_$]+)\s*\(/);
    if (fnMatch) {
      handlers.add(fnMatch[1]);
    }
  });

  console.log(`\n📄 Verifying ${f} (${handlers.size} unique onclick handlers):`);
  handlers.forEach(fn => {
    totalChecks++;
    // Check if function fn is defined or built-in
    const isBuiltin = ['confirm', 'alert', 'prompt', 'print'].includes(fn);
    const hasDef = new RegExp(`function\\s+${fn}\\b`).test(content) ||
                   new RegExp(`var\\s+${fn}\\s*=`).test(content) ||
                   new RegExp(`let\\s+${fn}\\s*=`).test(content) ||
                   new RegExp(`const\\s+${fn}\\s*=`).test(content) ||
                   new RegExp(`window\\.${fn}\\s*=`).test(content) ||
                   isBuiltin;
    if (hasDef) {
      console.log(`  ✅ ${fn}`);
    } else {
      console.error(`  ❌ MISSING FUNCTION: ${fn}`);
      failedChecks++;
    }
  });
});

console.log(`\n══════════════════════════════════════════`);
console.log(`Total Handlers Checked: ${totalChecks}`);
console.log(`Passed: ${totalChecks - failedChecks}`);
console.log(`Failed: ${failedChecks}`);
console.log(`══════════════════════════════════════════`);

if (failedChecks > 0) process.exit(1);
