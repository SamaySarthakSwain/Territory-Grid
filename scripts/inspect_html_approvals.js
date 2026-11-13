const fs = require('fs');
const html = fs.readFileSync('public/admin_panel.html', 'utf8');

function printFunc(name) {
  console.log('=== ' + name + ' ===');
  const idx = html.indexOf(name);
  if (idx === -1) {
    console.log('NOT FOUND');
  } else {
    console.log(html.substring(idx - 20, idx + 1800));
  }
}

printFunc('function loadPendingApprovals');
printFunc('function approveEntity');
