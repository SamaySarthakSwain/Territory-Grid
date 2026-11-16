const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// =====================================================================
// 1. PATCH api/index.js (Include teamCode in player/sync)
// =====================================================================
const apiPath = path.join(rootDir, 'api', 'index.js');
let apiCode = fs.readFileSync(apiPath, 'utf8');

// Include teamCode in GET /api/player/sync response
apiCode = apiCode.replace(
  'teamId: myTeam._id,',
  'teamId: myTeam._id,\n        teamCode: myTeam.teamCode,\n        squadNumber: (myTeam.teamCode >= 11 ? (myTeam.teamCode - 10) : 1),'
);
console.log('✅ Added teamCode and squadNumber to GET /api/player/sync');

fs.writeFileSync(apiPath, apiCode, 'utf8');
console.log('🎉 Successfully saved api/index.js');


// =====================================================================
// 2. PATCH public/player_dashboard.html (Relative vendor paths, teamCode sync, card preservation)
// =====================================================================
const playerPath = path.join(rootDir, 'public', 'player_dashboard.html');
let playerCode = fs.readFileSync(playerPath, 'utf8');

// Fix vendor paths to relative (critical for Android WebView file:///android_asset/)
playerCode = playerCode.replace('src="/vendor/qrcode.bundle.js"', 'src="vendor/qrcode.bundle.js"');
playerCode = playerCode.replace('src="/vendor/html5-qrcode.min.js"', 'src="vendor/html5-qrcode.min.js"');
console.log('✅ Fixed vendor script paths in player_dashboard.html');

// In applyPlayerSyncData: assign teamCode to currentMyTeam
const oldApplyTeamCode = `      currentMyTeam._id = data.teamId;
      currentMyTeam.name = data.teamName;
      currentMyTeam.callsign = data.callsign;`;

const newApplyTeamCode = `      currentMyTeam._id = data.teamId;
      currentMyTeam.teamCode = (typeof data.teamCode === 'number') ? data.teamCode : currentMyTeam.teamCode;
      currentMyTeam.name = data.teamName;
      currentMyTeam.callsign = data.callsign;`;

playerCode = playerCode.replace(oldApplyTeamCode.replace(/\r\n/g, '\n'), newApplyTeamCode);
playerCode = playerCode.replace(oldApplyTeamCode, newApplyTeamCode);
console.log('✅ Updated applyPlayerSyncData with teamCode assignment');

// In handlePlayerBeaconScan: preserve activeCipherCard rank and suit
const oldBeaconCheckin = `        var res = await fetch(apiUrl('/api/checkin'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: teamId,
            qrPayload: decodedText,
            cone: 'GREEN',
            cardRank: 13,
            cardSuit: '♠',
            memberId: 'self_scan_beacon'
          })
        });`;

const newBeaconCheckin = `        var activeRank = activeCipherCard ? (activeCipherCard.rank || 13) : 13;
        var activeSuit = activeCipherCard ? (activeCipherCard.suit || '♠') : '♠';

        var res = await fetch(apiUrl('/api/checkin'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: teamId,
            qrPayload: decodedText,
            cone: 'GREEN',
            cardRank: activeRank,
            cardSuit: activeSuit,
            memberId: 'self_scan_beacon'
          })
        });`;

playerCode = playerCode.replace(oldBeaconCheckin.replace(/\r\n/g, '\n'), newBeaconCheckin);
playerCode = playerCode.replace(oldBeaconCheckin, newBeaconCheckin);
console.log('✅ Updated handlePlayerBeaconScan to send active card rank and suit');

fs.writeFileSync(playerPath, playerCode, 'utf8');
console.log('🎉 Successfully saved public/player_dashboard.html');


// =====================================================================
// 3. PATCH public/member_checkin.html (Relative paths, active clues, target matching)
// =====================================================================
const marshalPath = path.join(rootDir, 'public', 'member_checkin.html');
let marshalCode = fs.readFileSync(marshalPath, 'utf8');

// Fix vendor paths to relative and add qrcode.bundle.js
marshalCode = marshalCode.replace(
  '<script src="/vendor/html5-qrcode.min.js"></script>',
  '<script src="vendor/qrcode.bundle.js"></script>\n  <script src="vendor/html5-qrcode.min.js"></script>'
);
console.log('✅ Fixed vendor script paths in member_checkin.html');

// In loadTeams: fetch role=PLAYER (only active marshal stations) instead of all=true
marshalCode = marshalCode.replace(
  "var cluesRes = await fetch(apiUrl('/api/clues?all=true&_t=' + Date.now()));",
  "var cluesRes = await fetch(apiUrl('/api/clues?role=PLAYER&_t=' + Date.now()));"
);
console.log('✅ Updated loadTeams in member_checkin.html to load active marshal clues');

// Update resolveTeamTargetClue in member_checkin.html to filter out visited zones
const oldMarshalTargetClue = `    function resolveTeamTargetClue(team, clues, teamsList) {
      if (!clues || clues.length === 0) return null;
      var route = resolveTeamRoute(team, clues, teamsList);
      var currentIdx = (team && typeof team.currentClueIndex === 'number') ? team.currentClueIndex : 0;
      if (currentIdx >= route.length) return null;
      return route[currentIdx];
    }`;

const newMarshalTargetClue = `    function resolveTeamTargetClue(team, clues, teamsList) {
      if (!clues || clues.length === 0) return null;
      var route = resolveTeamRoute(team, clues, teamsList);
      var visitedSet = new Set((team.visitedZones || []).map(function(z) {
        return normalizeZone(z);
      }));
      for (var i = 0; i < route.length; i++) {
        var norm = normalizeZone(route[i].zoneId);
        if (!visitedSet.has(norm)) {
          return route[i];
        }
      }
      return null;
    }`;

marshalCode = marshalCode.replace(oldMarshalTargetClue.replace(/\r\n/g, '\n'), newMarshalTargetClue);
marshalCode = marshalCode.replace(oldMarshalTargetClue, newMarshalTargetClue);
console.log('✅ Updated resolveTeamTargetClue in member_checkin.html with visitedZones filter');

// In simulateQRScan: pick the squad currently assigned to this station
const oldSimulateScan = `      var idx = selector.selectedIndex >= 0 ? selector.selectedIndex : 0;
      var chosenTeamId = selector.options[idx] ? selector.options[idx].value : (currentTeams[0] ? currentTeams[0]._id : 'team_demo');
      var chosenTeamName = (currentTeams[0] ? (currentTeams[0].name || currentTeams[0].callsign) : 'Squad');`;

const newSimulateScan = `      var myZoneNorm = normalizeZone(currentUser.zoneId || 'ZONE_01');
      var targetTeam = currentTeams.find(function(t) {
        var alreadyAwarded = t.visitedZones && t.visitedZones.some(function(z) { return normalizeZone(z) === myZoneNorm; });
        var target = resolveTeamTargetClue(t, allStationClues, currentTeams);
        return !alreadyAwarded && target && normalizeZone(target.zoneId) === myZoneNorm;
      }) || currentTeams.find(function(t) {
        return !(t.visitedZones && t.visitedZones.some(function(z) { return normalizeZone(z) === myZoneNorm; }));
      }) || currentTeams[0];

      var chosenTeamId = targetTeam ? targetTeam._id : (selector.options[0] ? selector.options[0].value : 'team_demo');
      var chosenTeamName = targetTeam ? (targetTeam.name || targetTeam.callsign) : 'Squad';
      if (selector && chosenTeamId) selector.value = chosenTeamId;`;

marshalCode = marshalCode.replace(oldSimulateScan.replace(/\r\n/g, '\n'), newSimulateScan);
marshalCode = marshalCode.replace(oldSimulateScan, newSimulateScan);
console.log('✅ Updated simulateQRScan to pick assigned squad for testing');

fs.writeFileSync(marshalPath, marshalCode, 'utf8');
console.log('🎉 Successfully saved public/member_checkin.html');
