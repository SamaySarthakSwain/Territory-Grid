const fs = require('fs');

let code = fs.readFileSync('web_server/server.js', 'utf8');

// 1. Upgrade sendJson with Cache-Control & ETag
const sendJsonRegex = /function sendJson\(res, statusCode, data\) \{[\s\S]*?res\.end\(JSON\.stringify\(data\)\);\s*\}/;

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

if (sendJsonRegex.test(code)) {
  code = code.replace(sendJsonRegex, newSendJson);
  console.log('Upgraded sendJson in web_server/server.js');
}

// 2. Add keepAlive and high-concurrency settings to HTTP server
const serverListenStr = "server.listen(PORT, '0.0.0.0', () => {";
if (code.includes(serverListenStr) && !code.includes('server.keepAliveTimeout')) {
  code = code.replace(
    serverListenStr,
    `server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.maxRequestsPerSocket = 0;

${serverListenStr}`
  );
  console.log('Added high-concurrency socket configuration in web_server/server.js');
}

// 3. Add micro-caching to /api/game/state GET in server.js
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

// 4. Add micro-caching and slimming to /api/teams GET in server.js
const oldServerTeams = `      // 10. GET /api/teams (All teams for Leaderboard & Marshal Check-in)
      if (pathname === '/api/teams' && req.method === 'GET') {
        db.ensureUniqueTeamCodes();
        return sendJson(res, 200, {
          success: true,
          teams: db.collections.teams
        });
      }`;

const newServerTeams = `      // 10. GET /api/teams (All teams for Leaderboard & Marshal Check-in - Optimized)
      if (pathname === '/api/teams' && req.method === 'GET') {
        db.ensureUniqueTeamCodes();
        const rawTeams = db.collections.teams || [];
        const slimTeams = rawTeams.map(t => ({
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
        }, 'public, max-age=1, s-maxage=2, stale-while-revalidate=4', req);
      }`;

if (code.includes(oldServerTeams)) {
  code = code.replace(oldServerTeams, newServerTeams);
  console.log('Optimized /api/teams in server.js');
}

// 5. Add micro-caching to /api/clues in server.js
const oldServerClues = `      // 10b. GET /api/clues (All clues for Mission Directives)
      if (pathname === '/api/clues' && req.method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          clues: db.collections.clues
        });
      }`;

const newServerClues = `      // 10b. GET /api/clues (All clues for Mission Directives - Cached)
      if (pathname === '/api/clues' && req.method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          clues: db.collections.clues
        }, 'public, max-age=10, s-maxage=30, stale-while-revalidate=60', req);
      }`;

if (code.includes(oldServerClues)) {
  code = code.replace(oldServerClues, newServerClues);
  console.log('Optimized /api/clues in server.js');
}

fs.writeFileSync('web_server/server.js', code, 'utf8');
console.log('web_server/server.js concurrency enhancements applied!');
