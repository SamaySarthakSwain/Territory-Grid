const fs = require('fs');
const path = require('path');

const auditPath = path.join(__dirname, '..', 'scripts', 'system_health_audit.js');
let content = fs.readFileSync(auditPath, 'utf8');

// 1. Define two squads
content = content.replace(
  `const testSquadCallsign = \`audit_sq_\${auditTimestamp.toString().slice(-6)}\`;
  const testMarshalCallsign = \`audit_mr_\${auditTimestamp.toString().slice(-6)}\`;
  let testTeamId = null;
  let testUserId = null;
  let testMarshalId = null;`,
  `const testSquadCallsign = \`audit_sq_\${auditTimestamp.toString().slice(-6)}\`;
  const testSquad2Callsign = \`audit_sq2_\${auditTimestamp.toString().slice(-6)}\`;
  const testMarshalCallsign = \`audit_mr_\${auditTimestamp.toString().slice(-6)}\`;
  let testTeamId = null;
  let testTeam2Id = null;
  let testUserId = null;
  let testMarshalId = null;`
);

// 2. Register squad 2
const targetReg = `    // 2b. Register Field Marshal`;
const squad2Reg = `    // 2a-2. Register Second Operative Squad for balanced routing
    const regSquad2 = await request('/api/auth/register', { method: 'POST' }, {
      role: 'PLAYER',
      callsign: testSquad2Callsign,
      name: \`Audit Squad 2 \${testSquad2Callsign}\`,
      password: 'password123'
    });
    if (regSquad2.json && regSquad2.json.user) {
      testTeam2Id = regSquad2.json.user.teamId;
    }

    // 2b. Register Field Marshal`;

content = content.replace(targetReg, squad2Reg);

// 3. Approve squad 2 in Module 3
const targetApprove = `if (testMarshalId) {`;
const approveSquad2 = `if (testTeam2Id) {
      await request('/api/admin/approve-team', { method: 'POST' }, { teamId: testTeam2Id });
    }

    if (testMarshalId) {`;

content = content.replace(targetApprove, approveSquad2);

// 4. Update the distribution check
const targetDist = `    const uniqueTargetCount = Object.keys(distribution).length;
    report('Squads are equally divided across stations (no single bottleneck)', uniqueTargetCount >= Math.min(2, K), JSON.stringify(distribution));`;

const replacementDist = `    const uniqueTargetCount = Object.keys(distribution).length;
    const requiredMin = Math.min(K, teamsList.length);
    report('Squads are equally divided across stations (no single bottleneck)', uniqueTargetCount >= Math.min(2, requiredMin), JSON.stringify(distribution));`;

content = content.replace(targetDist, replacementDist);

fs.writeFileSync(auditPath, content, 'utf8');
console.log('Successfully updated system_health_audit.js');
