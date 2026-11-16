const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.js');
let code = fs.readFileSync(apiPath, 'utf8');

// 1. In GET /api/player/sync: Fix allCompleted to check activeClues, not allClues
code = code.replace(
  'allCompleted: !activeClue && ((myTeam.currentClueIndex || 0) >= (allClues.length || 1)),',
  'allCompleted: !activeClue || ((myTeam.currentClueIndex || 0) >= (activeClues.length || 1)),'
);

// 2. In POST /api/checkin: Check alreadyVisited before wrongStation
const oldStationCheck = `      // ─────────────────────────────────────────────────────────
      // STRICT STATION ENFORCEMENT & EQUAL LOAD ROUTE CHECK
      // ─────────────────────────────────────────────────────────
      let allClues = [];
      let allUsers = [];
      if (atlasDb) {
        allClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        allUsers = await atlasDb.collection('users').find().toArray();
      } else {
        allClues = memoryStore.collections.clues || [];
        allUsers = memoryStore.collections.users || [];
      }

      const activeClues = getActiveMarshalClues(allClues, allUsers);

      let activeTargetClue = null;
      if (activeClues.length > 0) {
        activeTargetClue = resolveTeamTargetClue(team, activeClues);
        if (!activeTargetClue) {
          return sendJson(res, 400, {
            success: false,
            allCompleted: true,
            error: 'Squad "' + (team.name || team.callsign) + '" has already cleared all ' + allClues.length + ' campus checkpoints! Direct them to Game Master Central.'
          });
        }

        const targetZoneNorm = normalizeZone(activeTargetClue.zoneId);
        const marshalZoneNorm = normalizeZone(zoneId);

        if (targetZoneNorm !== marshalZoneNorm) {
          const targetStationName = activeTargetClue.zoneLabel || activeTargetClue.zoneId;
          const currentStationName = zoneId || 'this station';
          return sendJson(res, 400, {
            success: false,
            wrongStation: true,
            error: '⛔ WRONG STATION: Squad "' + (team.name || team.callsign) + '" is currently assigned to ' + targetStationName + ' for Checkpoint #' + ((team.currentClueIndex || 0) + 1) + '. Points CANNOT be awarded at ' + currentStationName + '!',
            targetZoneId: activeTargetClue.zoneId,
            targetZoneLabel: targetStationName,
            currentStation: zoneId,
            currentClueIndex: team.currentClueIndex || 0
          });
        }
      }

      const recordedZone = activeTargetClue ? activeTargetClue.zoneId : (zoneId || 'ZONE_01');
      const recordedZoneNorm = normalizeZone(recordedZone);

      // ─────────────────────────────────────────────────────────
      // ABSOLUTE STRICT ONE-AWARD-PER-MARSHAL-PER-TEAM ENFORCEMENT
      // A squad CANNOT be awarded more than once at any station.
      // Zero bypasses, zero duplicate allowances.
      // ─────────────────────────────────────────────────────────
      const alreadyInVisited = Array.isArray(team.visitedZones) && team.visitedZones.some(z => normalizeZone(z) === recordedZoneNorm);
      
      let alreadyInCheckins = false;
      if (atlasDb) {
        const existingCheckin = await checkinsCol.findOne({
          teamId: team._id,
          zoneId: recordedZone
        });
        if (existingCheckin) alreadyInCheckins = true;
      } else {
        alreadyInCheckins = (memoryStore.collections.checkins || []).some(
          c => c.teamId === team._id && normalizeZone(c.zoneId) === recordedZoneNorm
        );
      }

      if (alreadyInVisited || alreadyInCheckins) {
        return sendJson(res, 400, {
          success: false,
          alreadyVisited: true,
          error: '⛔ STATION ALREADY CLEARED: Squad "' + (team.name || team.callsign) + '" has ALREADY received points for ' + recordedZone + '! Each marshal can only award a squad once.'
        });
      }`;

const newStationCheck = `      // ─────────────────────────────────────────────────────────
      // STRICT ONE-AWARD-PER-MARSHAL & STATION ROUTE ENFORCEMENT
      // ─────────────────────────────────────────────────────────
      let allClues = [];
      let allUsers = [];
      if (atlasDb) {
        allClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        allUsers = await atlasDb.collection('users').find().toArray();
      } else {
        allClues = memoryStore.collections.clues || [];
        allUsers = memoryStore.collections.users || [];
      }

      const activeClues = getActiveMarshalClues(allClues, allUsers);
      const marshalZoneNorm = normalizeZone(zoneId);

      // 1. Check if team has ALREADY visited this marshal's station!
      const alreadyInVisited = Array.isArray(team.visitedZones) && team.visitedZones.some(z => normalizeZone(z) === marshalZoneNorm);
      let alreadyInCheckins = false;
      if (atlasDb) {
        const existingCheckin = await checkinsCol.findOne({
          teamId: team._id,
          zoneId: zoneId
        });
        if (existingCheckin) alreadyInCheckins = true;
      } else {
        alreadyInCheckins = (memoryStore.collections.checkins || []).some(
          c => c.teamId === team._id && normalizeZone(c.zoneId) === marshalZoneNorm
        );
      }

      if (alreadyInVisited || alreadyInCheckins) {
        return sendJson(res, 400, {
          success: false,
          alreadyVisited: true,
          error: '⛔ STATION ALREADY CLEARED: Squad "' + (team.name || team.callsign) + '" has ALREADY received points for ' + (zoneId || 'this station') + '! Each marshal can only award a squad once.'
        });
      }

      // 2. Check if this is the assigned target station
      let activeTargetClue = null;
      if (activeClues.length > 0) {
        activeTargetClue = resolveTeamTargetClue(team, activeClues);
        if (!activeTargetClue) {
          return sendJson(res, 400, {
            success: false,
            allCompleted: true,
            error: 'Squad "' + (team.name || team.callsign) + '" has already cleared all ' + activeClues.length + ' campus checkpoints! Direct them to Game Master Central.'
          });
        }

        const targetZoneNorm = normalizeZone(activeTargetClue.zoneId);
        if (targetZoneNorm !== marshalZoneNorm) {
          const targetStationName = activeTargetClue.zoneLabel || activeTargetClue.zoneId;
          const currentStationName = zoneId || 'this station';
          return sendJson(res, 400, {
            success: false,
            wrongStation: true,
            error: '⛔ WRONG STATION: Squad "' + (team.name || team.callsign) + '" is currently assigned to ' + targetStationName + ' for Checkpoint #' + ((team.currentClueIndex || 0) + 1) + '. Points CANNOT be awarded at ' + currentStationName + '!',
            targetZoneId: activeTargetClue.zoneId,
            targetZoneLabel: targetStationName,
            currentStation: zoneId,
            currentClueIndex: team.currentClueIndex || 0
          });
        }
      }

      const recordedZone = activeTargetClue ? activeTargetClue.zoneId : (zoneId || 'ZONE_01');
      const recordedZoneNorm = normalizeZone(recordedZone);`;

code = code.replace(oldStationCheck.replace(/\r\n/g, '\n'), newStationCheck);
code = code.replace(oldStationCheck, newStationCheck);

fs.writeFileSync(apiPath, code, 'utf8');
console.log('✅ Successfully patched api/index.js with prioritized alreadyVisited check and accurate allCompleted');
