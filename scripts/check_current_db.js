const fs = require('fs');

const data = JSON.parse(fs.readFileSync('web_server/data/territory_grid_mongodb.json', 'utf8'));

console.log('--- TEAMS ---');
data.teams.forEach(t => {
  console.log(`_id: ${t._id}, name: ${t.name}, callsign: ${t.callsign}, isApproved: ${t.isApproved} (${typeof t.isApproved})`);
});

console.log('\n--- USERS (Sample) ---');
data.users.forEach(u => {
  console.log(`_id: ${u._id}, role: ${u.role}, callsign: ${u.callsign}, teamId: ${u.teamId}, isApproved: ${u.isApproved} (${typeof u.isApproved})`);
});
