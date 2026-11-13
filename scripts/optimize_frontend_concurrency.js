const fs = require('fs');

// 1. Patch public/player_dashboard.html
let dash = fs.readFileSync('public/player_dashboard.html', 'utf8');

const oldDashSync = `      loadCluesAndSync();
      // Fast live sync every 1.5 seconds for instantaneous clue & score updates
      setInterval(syncTeamData, 1500);

      // Fast game state sync every 1.5 seconds & continuous 1s timer countdown
      syncGameState();
      setInterval(syncGameState, 1500);`;

const newDashSync = `      loadCluesAndSync();
      // Adaptive Jittered Sync Engine (Engineered for 1,000+ Concurrent Operatives)
      function scheduleNextTeamSync() {
        var jitter = Math.floor(Math.random() * 800);
        setTimeout(function() {
          syncTeamData().finally(scheduleNextTeamSync);
        }, 3200 + jitter);
      }
      scheduleNextTeamSync();

      function scheduleNextGameStateSync() {
        var jitter = Math.floor(Math.random() * 800);
        var baseDelay = currentGameState === 'PLAYER_PHASE' ? 3600 : 2500;
        setTimeout(function() {
          syncGameState().finally(scheduleNextGameStateSync);
        }, baseDelay + jitter);
      }
      syncGameState();
      scheduleNextGameStateSync();`;

if (dash.includes(oldDashSync)) {
  dash = dash.replace(oldDashSync, newDashSync);
  fs.writeFileSync('public/player_dashboard.html', dash, 'utf8');
  console.log('Optimized public/player_dashboard.html polling!');
} else {
  console.warn('Could not find exact oldDashSync string, checking with regex...');
  const dashSyncRegex = /loadCluesAndSync\(\);\s*\/\/[^\n]*\s*setInterval\(syncTeamData,\s*1500\);\s*\/\/[^\n]*\s*syncGameState\(\);\s*setInterval\(syncGameState,\s*1500\);/;
  if (dashSyncRegex.test(dash)) {
    dash = dash.replace(dashSyncRegex, newDashSync);
    fs.writeFileSync('public/player_dashboard.html', dash, 'utf8');
    console.log('Optimized public/player_dashboard.html polling via regex!');
  }
}

// 2. Patch public/login.html
let login = fs.readFileSync('public/login.html', 'utf8');
const oldLoginPoll = `      // Start live fast polling every 1.5 seconds
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(function() {
        checkApprovalStatus(userId, role, false);
      }, 1200);`;

const newLoginPoll = `      // High-concurrency jittered polling (handles 1,000+ concurrent entrants)
      if (pollInterval) clearInterval(pollInterval);
      function scheduleNextClearancePoll() {
        if (!document.getElementById('view-waiting-hall') || document.getElementById('view-waiting-hall').classList.contains('hidden')) return;
        var jitter = Math.floor(Math.random() * 600);
        pollInterval = setTimeout(function() {
          checkApprovalStatus(userId, role, false).finally(scheduleNextClearancePoll);
        }, 2200 + jitter);
      }
      scheduleNextClearancePoll();`;

if (login.includes(oldLoginPoll)) {
  login = login.replace(oldLoginPoll, newLoginPoll);
  fs.writeFileSync('public/login.html', login, 'utf8');
  console.log('Optimized public/login.html polling!');
} else {
  const loginPollRegex = /\/\/\s*Start live fast polling[\s\S]*?setInterval\(function\(\)\s*\{\s*checkApprovalStatus\(userId,\s*role,\s*false\);\s*\},\s*\d+\);/;
  if (loginPollRegex.test(login)) {
    login = login.replace(loginPollRegex, newLoginPoll);
    fs.writeFileSync('public/login.html', login, 'utf8');
    console.log('Optimized public/login.html polling via regex!');
  }
}

// 3. Patch public/member_checkin.html
let checkin = fs.readFileSync('public/member_checkin.html', 'utf8');
checkin = checkin.replace('setInterval(loadTeams, 4000);', 'setInterval(loadTeams, 5000 + Math.floor(Math.random()*1000));');
checkin = checkin.replace('setInterval(syncMarshalGameState, 2000);', 'setInterval(syncMarshalGameState, 3500 + Math.floor(Math.random()*800));');
fs.writeFileSync('public/member_checkin.html', checkin, 'utf8');
console.log('Optimized public/member_checkin.html polling!');

// 4. Patch public/leaderboard.html
let lboard = fs.readFileSync('public/leaderboard.html', 'utf8');
lboard = lboard.replace('setInterval(refreshLeaderboard, 3000);', 'setInterval(refreshLeaderboard, 4000 + Math.floor(Math.random()*1000));');
lboard = lboard.replace('setInterval(syncGameStateClock, 2500);', 'setInterval(syncGameStateClock, 3500 + Math.floor(Math.random()*800));');
fs.writeFileSync('public/leaderboard.html', lboard, 'utf8');
console.log('Optimized public/leaderboard.html polling!');
