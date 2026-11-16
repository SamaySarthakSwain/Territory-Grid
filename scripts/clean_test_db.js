const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'web_server', 'data', 'territory_grid_mongodb.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.teams = [];
db.checkins = [];
db.users = db.users.filter(u => u.callsign === 'samay');
db.gameState = {
  status: 'LOBBY',
  durationMinutes: 52,
  durationSeconds: 3120,
  startedAt: null,
  endsAt: null,
  countdownStartAt: null,
  countdownEndsAt: null,
  pausedAt: null,
  totalPausedMs: 0,
  endedAt: null
};

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ Cleaned test data from web_server/data/territory_grid_mongodb.json');
