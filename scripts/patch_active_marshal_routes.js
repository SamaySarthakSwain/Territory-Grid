const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.js');
let code = fs.readFileSync(apiPath, 'utf8');

// 1. Add getActiveMarshalClues helper & update resolveTeamTargetClue
const oldRouteFunctions = `function resolveTeamRoute(team, allClues, teamIndex = 0) {
  if (!Array.isArray(allClues) || allClues.length === 0) return [];
  const K = allClues.length;
  const code = (typeof team.teamCode === 'number' && team.teamCode >= 11)
    ? team.teamCode
    : (11 + (teamIndex % 88));
  const offset = code % K;
  const route = [];
  for (let i = 0; i < K; i++) {
    route.push(allClues[(offset + i) % K]);
  }
  return route;
}

function resolveTeamTargetClue(team, allClues, teamIndex = 0) {
  if (!Array.isArray(allClues) || allClues.length === 0) return null;
  const route = resolveTeamRoute(team, allClues, teamIndex);
  const currentIdx = parseInt(team.currentClueIndex, 10) || 0;
  if (currentIdx >= route.length) {
    return null; // All checkpoints completed
  }
  return route[currentIdx];
}`;

const newRouteFunctions = `function getActiveMarshalClues(allClues, allUsers) {
  if (!Array.isArray(allClues) || allClues.length === 0) return [];

  // Filter approved field marshals who have an assigned station/zoneId
  const approvedMarshals = (allUsers || []).filter(u => 
    u.role === 'MEMBER' && u.isApproved && u.zoneId
  );

  // If no marshals are approved yet, fallback to allClues (for tests / setup)
  if (approvedMarshals.length === 0) {
    return allClues;
  }

  // Build map of normalized zone -> marshal info
  const marshalZoneMap = new Map();
  approvedMarshals.forEach(m => {
    const norm = normalizeZone(m.zoneId);
    if (!marshalZoneMap.has(norm)) {
      marshalZoneMap.set(norm, m);
    }
  });

  // Filter campus clues to ONLY those matching approved marshals
  const activeClues = [];
  const handledNorms = new Set();

  allClues.forEach(c => {
    const norm = normalizeZone(c.zoneId);
    if (marshalZoneMap.has(norm) && !handledNorms.has(norm)) {
      const marshal = marshalZoneMap.get(norm);
      activeClues.push({
        ...c,
        zoneLabel: c.zoneLabel || marshal.zoneLabel || c.zoneId,
        marshalCallsign: marshal.callsign || marshal.name,
        hasMarshal: true
      });
      handledNorms.add(norm);
    }
  });

  // If any marshal has a custom zoneId not in DEFAULT_CLUES (e.g. 'LHC'), create a clue for it!
  approvedMarshals.forEach(m => {
    const norm = normalizeZone(m.zoneId);
    if (!handledNorms.has(norm)) {
      activeClues.push({
        _id: 'clue_' + norm.toLowerCase(),
        zoneId: m.zoneId,
        zoneLabel: m.zoneLabel || m.zoneId,
        text: 'Proceed to ' + (m.zoneLabel || m.zoneId) + ' and report to Field Marshal ' + (m.callsign || m.name) + '.',
        marshalCallsign: m.callsign || m.name,
        hasMarshal: true
      });
      handledNorms.add(norm);
    }
  });

  return activeClues.length > 0 ? activeClues : allClues;
}

function resolveTeamRoute(team, activeClues, teamIndex = 0) {
  if (!Array.isArray(activeClues) || activeClues.length === 0) return [];
  const K = activeClues.length;
  const code = (typeof team.teamCode === 'number' && team.teamCode >= 11)
    ? team.teamCode
    : (11 + (teamIndex % 88));
  const offset = code % K;
  const route = [];
  for (let i = 0; i < K; i++) {
    route.push(activeClues[(offset + i) % K]);
  }
  return route;
}

function resolveTeamTargetClue(team, activeClues, teamIndex = 0) {
  if (!Array.isArray(activeClues) || activeClues.length === 0) return null;
  const route = resolveTeamRoute(team, activeClues, teamIndex);
  
  // Set of normalized zones already visited/awarded to this team
  const visitedSet = new Set(
    (team.visitedZones || []).map(z => normalizeZone(z))
  );

  // Return the first station in the assigned sequence that has NOT been visited yet
  // This GUARANTEES no team is ever given the same location twice!
  for (let i = 0; i < route.length; i++) {
    const stationNorm = normalizeZone(route[i].zoneId);
    if (!visitedSet.has(stationNorm)) {
      return {
        ...route[i],
        routeIndex: i,
        totalStations: route.length
      };
    }
  }

  // All active marshal stations have been visited!
  return null;
}`;

// CRLF normalization
code = code.replace(oldRouteFunctions.replace(/\r\n/g, '\n'), newRouteFunctions);
code = code.replace(oldRouteFunctions, newRouteFunctions);
console.log('✅ Updated getActiveMarshalClues and strict unvisited-only resolveTeamTargetClue');

// 2. Update GET /api/player/sync to load allUsers and use getActiveMarshalClues
const oldSyncTarget = `      let allTeams = [];
      let allClues = [];
      let allCheckins = [];

      if (atlasDb) {
        allTeams = await atlasDb.collection('teams').find().toArray();
        allClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        allCheckins = await atlasDb.collection('checkins').find().sort({ timestamp: -1 }).toArray();
      } else {
        memoryStore.load();
        allTeams = memoryStore.collections.teams || [];
        allClues = memoryStore.collections.clues || [];
        allCheckins = memoryStore.collections.checkins || [];
      }`;

const newSyncCode = `      let allTeams = [];
      let allClues = [];
      let allCheckins = [];
      let allUsers = [];

      if (atlasDb) {
        allTeams = await atlasDb.collection('teams').find().toArray();
        allClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        allCheckins = await atlasDb.collection('checkins').find().sort({ timestamp: -1 }).toArray();
        allUsers = await atlasDb.collection('users').find().toArray();
      } else {
        memoryStore.load();
        allTeams = memoryStore.collections.teams || [];
        allClues = memoryStore.collections.clues || [];
        allCheckins = memoryStore.collections.checkins || [];
        allUsers = memoryStore.collections.users || [];
      }`;

code = code.replace(oldSyncTarget.replace(/\r\n/g, '\n'), newSyncCode);
code = code.replace(oldSyncTarget, newSyncCode);
console.log('✅ Added allUsers load to GET /api/player/sync');

// Update activeClue resolution in player/sync:
const oldSyncActiveClue = `      const myRank = approvedTeams.findIndex(t => t._id === myTeam._id);
      const activeClue = resolveTeamTargetClue(myTeam, allClues);`;

const newSyncActiveClue = `      const myRank = approvedTeams.findIndex(t => t._id === myTeam._id);
      const activeClues = getActiveMarshalClues(allClues, allUsers);
      const activeClue = resolveTeamTargetClue(myTeam, activeClues);`;

code = code.replace(oldSyncActiveClue.replace(/\r\n/g, '\n'), newSyncActiveClue);
code = code.replace(oldSyncActiveClue, newSyncActiveClue);
console.log('✅ Updated activeClue resolution in player/sync to use active marshal stations only');

// 3. Update POST /api/checkin to load allUsers and use getActiveMarshalClues
const oldCheckinClues = `      // ─────────────────────────────────────────────────────────
      // STRICT STATION ENFORCEMENT & EQUAL LOAD ROUTE CHECK
      // ─────────────────────────────────────────────────────────
      let allClues = [];
      if (atlasDb) {
        allClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
      } else {
        allClues = memoryStore.collections.clues || [];
      }

      let activeTargetClue = null;
      if (allClues.length > 0) {
        activeTargetClue = resolveTeamTargetClue(team, allClues);`;

const newCheckinClues = `      // ─────────────────────────────────────────────────────────
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
        activeTargetClue = resolveTeamTargetClue(team, activeClues);`;

code = code.replace(oldCheckinClues.replace(/\r\n/g, '\n'), newCheckinClues);
code = code.replace(oldCheckinClues, newCheckinClues);
console.log('✅ Updated checkin targetClue to use active marshal stations only');

// Update nextClue computation in checkin:
code = code.replace(/const nextClue = \(allClues\.length > 0\) \? resolveTeamTargetClue\(updatedTeam, allClues\) : null;/g,
  'const nextClue = (activeClues.length > 0) ? resolveTeamTargetClue(updatedTeam, activeClues) : null;');
code = code.replace(/const nextClue = \(allClues\.length > 0\) \? resolveTeamTargetClue\(team, allClues\) : null;/g,
  'const nextClue = (activeClues.length > 0) ? resolveTeamTargetClue(team, activeClues) : null;');
console.log('✅ Updated nextClue in checkin return to use activeClues');

// 4. Update rebalance-routes to also use getActiveMarshalClues
const oldRebalance = `        const rawClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        const rawTeams = await atlasDb.collection('teams').find().toArray();
        const teams = ensureUniqueTeamCodes(rawTeams);
        for (let i = 0; i < teams.length; i++) {
          const t = teams[i];
          const route = resolveTeamRoute(t, rawClues, i);`;

const newRebalance = `        const rawClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        const rawUsers = await atlasDb.collection('users').find().toArray();
        const rawTeams = await atlasDb.collection('teams').find().toArray();
        const targetClues = getActiveMarshalClues(rawClues, rawUsers);
        const teams = ensureUniqueTeamCodes(rawTeams);
        for (let i = 0; i < teams.length; i++) {
          const t = teams[i];
          const route = resolveTeamRoute(t, targetClues, i);`;

code = code.replace(oldRebalance.replace(/\r\n/g, '\n'), newRebalance);
code = code.replace(oldRebalance, newRebalance);

const oldRebalanceMem = `      const rawClues = memoryStore.collections.clues || [];
      const teams = ensureUniqueTeamCodes(memoryStore.collections.teams || []);
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const route = resolveTeamRoute(t, rawClues, i);`;

const newRebalanceMem = `      const rawClues = memoryStore.collections.clues || [];
      const rawUsers = memoryStore.collections.users || [];
      const targetClues = getActiveMarshalClues(rawClues, rawUsers);
      const teams = ensureUniqueTeamCodes(memoryStore.collections.teams || []);
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const route = resolveTeamRoute(t, targetClues, i);`;

code = code.replace(oldRebalanceMem.replace(/\r\n/g, '\n'), newRebalanceMem);
code = code.replace(oldRebalanceMem, newRebalanceMem);
console.log('✅ Updated rebalance-routes to balance across active marshal stations');

fs.writeFileSync(apiPath, code, 'utf8');
console.log('🎉 Successfully saved api/index.js');
