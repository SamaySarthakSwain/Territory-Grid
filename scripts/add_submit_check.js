const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, '..', 'public', 'login.html');
let content = fs.readFileSync(loginPath, 'utf8');

const target = `      if (!callsign || !password) {
        showAlert('Please fill in callsign and access key.', true);
        return;
      }`;

const replacement = `      if (!callsign || !password) {
        showAlert('Please fill in callsign and access key.', true);
        return;
      }

      if (currentRole === 'ADMIN' && (callsign.toLowerCase() !== 'samay' || password !== 'samay')) {
        showAlert('Security Rejection: Game Master Terminal access is strictly restricted. Only ID "samay" and password "samay" is authorized.', true);
        return;
      }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(loginPath, content, 'utf8');
  console.log('✅ Added strict samay validation to handleFormSubmit in login.html');
} else {
  console.error('❌ Could not find target in login.html');
}
