const fs = require('fs');
const path = require('path');

const files = [
  'public/admin_panel.html',
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html',
  'public/leaderboard.html',
  'public/index.html'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) return;
  const html = fs.readFileSync(fullPath, 'utf8');

  console.log(`\n======================================================`);
  console.log(`FILE: ${file} (Size: ${html.length} bytes)`);
  console.log(`======================================================`);

  const btnRegex = /<button[\s\S]*?<\/button>/gi;
  let match;
  let count = 0;
  const issues = [];

  while ((match = btnRegex.exec(html)) !== null) {
    count++;
    const fullTag = match[0];
    const onclickMatch = fullTag.match(/onclick=["']([^"']+)["']/i);
    const idMatch = fullTag.match(/id=["']([^"']+)["']/i);
    const typeMatch = fullTag.match(/type=["']([^"']+)["']/i);
    const disabled = fullTag.includes('disabled');
    const text = fullTag.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');

    const onclick = onclickMatch ? onclickMatch[1] : null;
    const id = idMatch ? idMatch[1] : null;

    // Check potential issues
    if (!onclick && !id && (!typeMatch || typeMatch[1] !== 'submit')) {
      issues.push(`Button "${text.slice(0, 25)}" has NEITHER id nor onclick nor type="submit"! Tag: ${fullTag.slice(0, 80)}`);
    }

    if (onclick) {
      // Check if function exists in scripts
      const funcName = onclick.split('(')[0].replace(/return\s+/, '').trim();
      if (funcName && !html.includes(`function ${funcName}`) && !html.includes(`${funcName} =`) && !html.includes(`window.${funcName}`)) {
        issues.push(`Function "${funcName}" called in onclick might NOT be defined in ${file}!`);
      }
    }
  }

  console.log(`Total buttons: ${count}`);
  if (issues.length > 0) {
    console.log(`⚠️ ISSUES DETECTED (${issues.length}):`);
    issues.forEach(iss => console.log('  -', iss));
  } else {
    console.log(`✅ All buttons have valid onclick or IDs.`);
  }
});
