const fs = require('fs');

let code = fs.readFileSync('api/index.js', 'utf8');

// 1. Upgrade sendJson with Edge Cache-Control & ETag support
const oldSendJson = `function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(JSON.stringify(data));
}`;

const newSendJson = `function sendJson(res, statusCode, data, cacheControl = null, req = null) {
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (cacheControl) {
    headers['Cache-Control'] = cacheControl;
  } else {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }

  const jsonStr = JSON.stringify(data);

  // ETag conditional validation (HTTP 304 Not Modified)
  if (req && req.headers && req.method === 'GET') {
    const etag = 'W/"' + jsonStr.length + '-' + (data.state ? (data.state.status + '-' + (data.state.startedAt || '')) : '') + '"';
    headers['ETag'] = etag;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
  }

  res.writeHead(statusCode, headers);
  res.end(jsonStr);
}`;

if (code.includes(oldSendJson)) {
  code = code.replace(oldSendJson, newSendJson);
  console.log('Upgraded sendJson in api/index.js');
} else {
  // Try regex replacement if whitespace differed
  const sendJsonRegex = /function sendJson\(res, statusCode, data\) \{[\s\S]*?res\.end\(JSON\.stringify\(data\)\);\s*\}/;
  if (sendJsonRegex.test(code)) {
    code = code.replace(sendJsonRegex, newSendJson);
    console.log('Upgraded sendJson via regex in api/index.js');
  } else {
    console.error('Could not find sendJson in api/index.js');
  }
}

// 2. Add Edge Cache-Control to /api/game/state GET
code = code.replace(
  `        return sendJson(res, 200, {
          success: true,
          state: gs,
          serverTime: new Date(now).toISOString(),
          remainingSeconds: remainingSeconds,
          countdownSeconds: countdownSeconds,
          durationSeconds: gs.durationSeconds,
          durationMinutes: gs.durationMinutes
        });`,
  `        return sendJson(res, 200, {
          success: true,
          state: gs,
          serverTime: new Date(now).toISOString(),
          remainingSeconds: remainingSeconds,
          countdownSeconds: countdownSeconds,
          durationSeconds: gs.durationSeconds,
          durationMinutes: gs.durationMinutes
        }, 'public, max-age=1, s-maxage=1, stale-while-revalidate=2', req);`
);

// 3. Add Edge Cache-Control and Slimming to /api/teams GET
const oldTeamsRoute = `      ensureUniqueTeamCodes(memoryStore.collections.teams);
      return sendJson(res, 200, {
        success: true,
        teams: memoryStore.collections.teams
      });`;

const newTeamsRoute = `      const teams = ensureUniqueTeamCodes(memoryStore.collections.teams || []);
      const slimTeams = teams.map(t => ({
        _id: t._id,
        id: t._id,
        name: t.name,
        callsign: t.callsign,
        score: t.score || 0,
        teamCode: t.teamCode,
        cardsCount: (t.cards || []).length,
        visitedZonesCount: (t.visitedZones || []).length,
        isApproved: !!t.isApproved,
        updatedAt: t.updatedAt
      }));
      return sendJson(res, 200, {
        success: true,
        teams: slimTeams
      }, 'public, max-age=1, s-maxage=2, stale-while-revalidate=4', req);`;

if (code.includes(oldTeamsRoute)) {
  code = code.replace(oldTeamsRoute, newTeamsRoute);
  console.log('Optimized /api/teams in api/index.js');
}

// 4. Add Edge Cache-Control to /api/clues GET
const oldCluesRoute = `      return sendJson(res, 200, {
        success: true,
        clues: memoryStore.collections.clues
      });`;

const newCluesRoute = `      return sendJson(res, 200, {
        success: true,
        clues: memoryStore.collections.clues
      }, 'public, max-age=10, s-maxage=30, stale-while-revalidate=60', req);`;

if (code.includes(oldCluesRoute)) {
  code = code.replace(oldCluesRoute, newCluesRoute);
  console.log('Optimized /api/clues in api/index.js');
}

fs.writeFileSync('api/index.js', code, 'utf8');
console.log('api/index.js concurrency enhancements applied!');
