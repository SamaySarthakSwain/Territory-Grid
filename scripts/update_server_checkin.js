const fs = require('fs');
const path = require('path');

function updateServerFiles() {
  const serverPath = path.join(__dirname, '..', 'web_server', 'server.js');
  let s = fs.readFileSync(serverPath, 'utf8');

  // Replace `if (!teamId && Array.isArray(db.collections.teams))`
  const oldTeamMatch = `// Match team strictly by TT
            if (!teamId && Array.isArray(db.collections.teams)) {
              let matchedTeam = db.collections.teams.find(t => t.teamCode === tt);
              if (!matchedTeam && tt >= 11 && tt <= 99) {
                const targetCallsign = 'team' + (tt - 10);
                matchedTeam = db.collections.teams.find(t => 
                  (t.callsign || '').toLowerCase() === targetCallsign.toLowerCase() ||
                  (t.name || '').toLowerCase() === targetCallsign.toLowerCase()
                );
              }
              if (matchedTeam) teamId = matchedTeam._id;
            }`;

  const newTeamMatch = `// Match team strictly by TT from 6-digit cipher code
            if (Array.isArray(db.collections.teams)) {
              let matchedTeam = db.collections.teams.find(t => t.teamCode === tt);
              if (!matchedTeam && tt >= 11 && tt <= 99) {
                const targetCallsign = 'team' + (tt - 10);
                matchedTeam = db.collections.teams.find(t => 
                  (t.callsign || '').toLowerCase() === targetCallsign.toLowerCase() ||
                  (t.name || '').toLowerCase() === targetCallsign.toLowerCase()
                );
              }
              if (matchedTeam) {
                teamId = matchedTeam._id;
              } else if (!teamId) {
                return sendJson(res, 400, { success: false, error: \`Squad code (\${tt}) does not match any registered team.\` });
              }
            }`;

  s = s.replace(oldTeamMatch, newTeamMatch);

  // Fix suits array and cardSuit fallbacks
  s = s.replace("const suits = ['â™ ', 'â™¥', 'â™¦', 'â™£'];", "const suits = ['♠', '♥', '♦', '♣'];");
  s = s.replace("if (!cardSuit) cardSuit = suits[suitIdx] || 'â™ ';", "if (!cardSuit) cardSuit = suits[suitIdx] || '♠';");
  s = s.replace("cardSuit: cardSuit || 'â™ ',", "cardSuit: cardSuit || '♠',");
  s = s.replace("suit: cardSuit || 'â™ ',", "suit: cardSuit || '♠',");

  fs.writeFileSync(serverPath, s, 'utf8');
  console.log('Updated server.js');

  // Now update api/index.js
  const apiPath = path.join(__dirname, '..', 'api', 'index.js');
  let a = fs.readFileSync(apiPath, 'utf8');

  const oldApiTeamMatch = `// Match team strictly by TT
          if (!teamId) {
            let candidateTeams = [];
            if (atlasDb) {
              candidateTeams = await atlasDb.collection('teams').find().toArray();
            } else {
              memoryStore.load();
              candidateTeams = memoryStore.collections.teams || [];
            }
            ensureUniqueTeamCodes(candidateTeams);
            let matchedTeam = candidateTeams.find(t => t.teamCode === tt);
            if (!matchedTeam && tt >= 11 && tt <= 99) {
              const targetCallsign = 'team' + (tt - 10);
              matchedTeam = candidateTeams.find(t => 
                (t.callsign || '').toLowerCase() === targetCallsign.toLowerCase() ||
                (t.name || '').toLowerCase() === targetCallsign.toLowerCase()
              );
            }
            if (matchedTeam) teamId = matchedTeam._id;
          }`;

  const newApiTeamMatch = `// Match team strictly by TT from 6-digit cipher code
          let candidateTeams = [];
          if (atlasDb) {
            candidateTeams = await atlasDb.collection('teams').find().toArray();
          } else {
            memoryStore.load();
            candidateTeams = memoryStore.collections.teams || [];
          }
          ensureUniqueTeamCodes(candidateTeams);
          let matchedTeam = candidateTeams.find(t => t.teamCode === tt);
          if (!matchedTeam && tt >= 11 && tt <= 99) {
            const targetCallsign = 'team' + (tt - 10);
            matchedTeam = candidateTeams.find(t => 
              (t.callsign || '').toLowerCase() === targetCallsign.toLowerCase() ||
              (t.name || '').toLowerCase() === targetCallsign.toLowerCase()
            );
          }
          if (matchedTeam) {
            teamId = matchedTeam._id;
          } else if (!teamId) {
            return sendJson(res, 400, { success: false, error: \`Squad code (\${tt}) does not match any registered team.\` });
          }`;

  a = a.replace(oldApiTeamMatch, newApiTeamMatch);

  a = a.replace("const suits = ['â™ ', 'â™¥', 'â™¦', 'â™£'];", "const suits = ['♠', '♥', '♦', '♣'];");
  a = a.replace("if (!cardSuit) cardSuit = suits[suitIdx] || 'â™ ';", "if (!cardSuit) cardSuit = suits[suitIdx] || '♠';");
  a = a.replace("cardSuit: cardSuit || 'â™ ',", "cardSuit: cardSuit || '♠',");
  a = a.replace("suit: cardSuit || 'â™ ',", "suit: cardSuit || '♠',");

  fs.writeFileSync(apiPath, a, 'utf8');
  console.log('Updated api/index.js');
}

updateServerFiles();
