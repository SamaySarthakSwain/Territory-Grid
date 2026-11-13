const fs = require('fs');
const path = require('path');

const auditPath = path.join(__dirname, '..', 'scripts', 'system_health_audit.js');
let content = fs.readFileSync(auditPath, 'utf8');

const target = `    if (testMarshalId) {
      const approveMarshal = await request('/api/admin/approve-user', { method: 'POST' }, {
        userId: testMarshalId
      });
      report('Admin approves field marshal (HTTP 200)', approveMarshal.status === 200 && approveMarshal.json.success === true);
    }`;

const replacement = `    if (testMarshalId || testMarshalCallsign) {
      await wait(800);
      const approveMarshal = await request('/api/admin/approve-user', { method: 'POST' }, {
        userId: testMarshalId,
        id: testMarshalId || testMarshalCallsign,
        callsign: testMarshalCallsign
      });
      report('Admin approves field marshal (HTTP 200)', approveMarshal.status === 200 && approveMarshal.json && approveMarshal.json.success === true);
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(auditPath, content, 'utf8');
  console.log('Successfully updated approveMarshal test in system_health_audit.js');
} else {
  console.warn('Target not found in system_health_audit.js');
}
