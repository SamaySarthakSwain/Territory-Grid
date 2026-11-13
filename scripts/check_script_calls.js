const fs = require('fs');
const files = [
  'public/admin_panel.html',
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/leaderboard.html'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=== Checking ${file} ===`);
  const fnCalls = new Set();
  const definedFns = new Set();
  
  // Find defined functions
  const defRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
  let m;
  while ((m = defRegex.exec(content)) !== null) {
    definedFns.add(m[1]);
  }
  
  // Also check setInterval / setTimeout passed functions
  const timerRegex = /(?:setInterval|setTimeout)\s*\(\s*([a-zA-Z0-9_]+)\s*,/g;
  while ((m = timerRegex.exec(content)) !== null) {
    const fnName = m[1];
    if (!definedFns.has(fnName)) {
      console.error(`In ${file}: Timer targets UNDEFINED function "${fnName}"!`);
    } else {
      console.log(`Timer target "${fnName}": OK`);
    }
  }

  // Check DOMContentLoaded direct calls
  const dclMatch = content.match(/addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*(?:async\s*)?function\s*\(\s*\)\s*\{([\s\S]*?)\}\s*\)/);
  if (dclMatch) {
    const body = dclMatch[1];
    const callRegex = /([a-zA-Z0-9_]+)\s*\(/g;
    while ((m = callRegex.exec(body)) !== null) {
      const call = m[1];
      if (['setInterval', 'setTimeout', 'clearInterval', 'clearTimeout', 'parseInt', 'parseFloat', 'selectPortal', 'loadDynamicStations', 'getStoredSession', 'showWaitingHall', 'checkApprovalStatus', 'redirectToDashboard', 'clearSession'].includes(call)) continue;
      if (!definedFns.has(call)) {
        console.error(`In ${file} DOMContentLoaded: Calls UNDEFINED function "${call}"!`);
      } else {
        console.log(`DOMContentLoaded call "${call}": OK`);
      }
    }
  }
});
