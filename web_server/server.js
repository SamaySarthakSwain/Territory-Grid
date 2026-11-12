// Territory Grid // Tactical Real-Time Scavenger Hunt
// MongoDB Document Server & API Gateway
// Port: 8088 (or PORT env var)

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8088;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'territory_grid_mongodb.json');
const STATIC_DIR = path.join(__dirname, '..', 'design_refs', 'html');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// MongoDB Collection Engine (Persistent Document Store)
// ─────────────────────────────────────────────────────────────
class MongoDatabase {
  constructor() {
    this.collections = {
      users: [],
      teams: [],
      clues: [],
      checkins: [],
      gameState: {
        status: 'LOBBY',
        startedAt: null,
        endedAt: null,
        pausedAt: null,
        totalPausedMs: 0
      },
      system_logs: []
    };
    this.load();
    this.ensureDefaults();
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.collections = JSON.parse(raw);
        console.log('[MongoDB Engine] Loaded collections from persistent storage.');
      } catch (e) {
        console.error('[MongoDB Engine] Failed to parse DB file, initializing clean state.', e);
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {
      console.error('[MongoDB Engine] Failed to save DB file:', e);
    }
  }

  ensureDefaults() {
    let changed = false;

    // 1. Ensure Fixed Game Master Admin (samay / samay)
    const adminExists = this.collections.users.some(u => u.callsign === 'samay' || u.role === 'ADMIN');
    if (!adminExists) {
      this.collections.users.push({
        _id: 'user_admin_samay',
        callsign: 'samay',
        name: 'Game Master Samay',
        role: 'ADMIN',
        password: 'samay',
        isApproved: true,
        createdAt: new Date().toISOString()
      });
      changed = true;
    }

    // 2. Ensure Initial Tactical Clues (10 Zones for the Club Fest)
    if (!this.collections.clues || this.collections.clues.length === 0) {
      this.collections.clues = [
        { _id: 'clue_01', text: 'Locate the Yellow Beacon Cone nestled near the library plaza & colonnade arch!', zoneId: 'ZONE_01', zoneLabel: 'Sector A: Library Arch' },
        { _id: 'clue_02', text: 'Search the courtyard perimeter behind the ancient bronze solar obelisk.', zoneId: 'ZONE_02', zoneLabel: 'Sector B: Solar Obelisk' },
        { _id: 'clue_03', text: 'Ascend the terrace staircase overlooking the historic clocktower.', zoneId: 'ZONE_03', zoneLabel: 'Sector C: Clocktower Terrace' },
        { _id: 'clue_04', text: 'Investigate the botanical garden glasshouse south perimeter.', zoneId: 'ZONE_04', zoneLabel: 'Sector D: Glasshouse Botanical' },
        { _id: 'clue_05', text: 'Cross the pedestrian skybridge connecting science hall 1 & 2.', zoneId: 'ZONE_05', zoneLabel: 'Sector E: Skybridge Concourse' },
        { _id: 'clue_06', text: 'Look beneath the concrete amphitheater canopy seating.', zoneId: 'ZONE_06', zoneLabel: 'Sector F: Amphitheater' },
        { _id: 'clue_07', text: 'Find the water fountain basin near the science auditorium.', zoneId: 'ZONE_07', zoneLabel: 'Sector G: Science Basin' },
        { _id: 'clue_08', text: 'Check the shaded colonnade behind student center pavilion.', zoneId: 'ZONE_08', zoneLabel: 'Sector H: Student Pavilion' },
        { _id: 'clue_09', text: 'Locate the red telecom antenna pylon on north concourse.', zoneId: 'ZONE_09', zoneLabel: 'Sector I: North Telecom Pylon' },
        { _id: 'clue_10', text: 'Scan the perimeter fence surrounding the athletic turf field.', zoneId: 'ZONE_10', zoneLabel: 'Sector J: Turf Perimeter' }
      ];
      changed = true;
    }

    if (changed) this.save();
  }

  logEvent(action, details) {
    this.collections.system_logs.unshift({
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (this.collections.system_logs.length > 200) {
      this.collections.system_logs.pop();
    }
    this.save();
  }
}

const db = new MongoDatabase();

// ─────────────────────────────────────────────────────────────
// MIME Types Map
// ─────────────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ─────────────────────────────────────────────────────────────
// Request Body Reader
// ─────────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

// ─────────────────────────────────────────────────────────────
// HTTP Server Router
// ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }

  // ── REST API ROUTES ───────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    try {
      // 1. POST /api/auth/register (Player Team or Field Marshal)
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await parseBody(req);
        const { role, name, callsign, password, zoneId, zoneLabel } = body;

        if (!callsign || !password) {
          return sendJson(res, 400, { success: false, error: 'Callsign and password are required.' });
        }

        const normalizedCallsign = callsign.trim().toLowerCase();
        if (normalizedCallsign === 'samay') {
          return sendJson(res, 400, { success: false, error: 'Callsign "samay" is reserved for Game Master Admin.' });
        }

        const userExists = db.collections.users.some(u => u.callsign.toLowerCase() === normalizedCallsign);
        if (userExists) {
          return sendJson(res, 400, { success: false, error: `Callsign "${callsign}" is already registered. Please sign in or choose another.` });
        }

        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        let teamId = null;

        if (role === 'PLAYER') {
          // Create Team record
          teamId = 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          const clueOrder = db.collections.clues.map(c => c._id).sort(() => Math.random() - 0.5);
          
          db.collections.teams.push({
            _id: teamId,
            name: name || callsign,
            callsign: callsign,
            score: 0,
            cards: [],
            clueOrder: clueOrder,
            currentClueIndex: 0,
            visitedZones: [],
            isApproved: false, // Rule 3: Must be approved by Admin
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        const newUser = {
          _id: userId,
          callsign: callsign.trim(),
          name: name ? name.trim() : callsign.trim(),
          role: role === 'MEMBER' ? 'MEMBER' : 'PLAYER',
          password: password,
          teamId: teamId,
          zoneId: role === 'MEMBER' ? (zoneId || 'ZONE_01') : null,
          zoneLabel: role === 'MEMBER' ? (zoneLabel || 'Sector A') : null,
          isApproved: false, // Rule 3: Must be approved by Admin
          createdAt: new Date().toISOString()
        };

        db.collections.users.push(newUser);
        db.save();
        db.logEvent('REGISTER', `${newUser.role} registered: "${newUser.callsign}" (Pending Approval)`);

        return sendJson(res, 201, {
          success: true,
          status: 'WAITING_APPROVAL',
          user: {
            _id: newUser._id,
            callsign: newUser.callsign,
            name: newUser.name,
            role: newUser.role,
            isApproved: false,
            teamId: newUser.teamId,
            zoneId: newUser.zoneId
          }
        });
      }

      // 2. POST /api/auth/login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const { callsign, password, requestedRole } = body;

        if (!callsign || !password) {
          return sendJson(res, 400, { success: false, error: 'Please enter callsign and password.' });
        }

        const trimmedCallsign = callsign.trim();
        const trimmedPass = password.trim();

        // Admin Fixed Credentials: samay / samay
        if (trimmedCallsign.toLowerCase() === 'samay' && trimmedPass === 'samay') {
          db.logEvent('ADMIN_LOGIN', 'Game Master Samay authenticated.');
          return sendJson(res, 200, {
            success: true,
            role: 'ADMIN',
            isApproved: true,
            user: {
              _id: 'user_admin_samay',
              callsign: 'samay',
              name: 'Game Master Samay',
              role: 'ADMIN',
              isApproved: true
            }
          });
        }

        // Non-admin login
        const user = db.collections.users.find(u => 
          u.callsign.toLowerCase() === trimmedCallsign.toLowerCase() && u.password === trimmedPass
        );

        if (!user) {
          return sendJson(res, 401, { success: false, error: 'Clearance Rejected: Invalid callsign or access key.' });
        }

        // Strict Role Check: Players cannot login into Marshal or Admin; Marshals cannot login into Admin
        if (requestedRole && user.role !== requestedRole && user.role !== 'ADMIN') {
          return sendJson(res, 403, { 
            success: false, 
            error: `Clearance Mismatch: Account is registered as ${user.role}, but you are accessing ${requestedRole} portal.` 
          });
        }

        // Team status sync
        let team = null;
        if (user.teamId) {
          team = db.collections.teams.find(t => t._id === user.teamId);
          if (team && team.isApproved !== user.isApproved) {
            user.isApproved = team.isApproved;
            db.save();
          }
        }

        db.logEvent('LOGIN', `${user.role} "${user.callsign}" signed in (Approved: ${user.isApproved})`);

        return sendJson(res, 200, {
          success: true,
          role: user.role,
          isApproved: !!user.isApproved,
          status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL',
          user: {
            _id: user._id,
            callsign: user.callsign,
            name: user.name,
            role: user.role,
            isApproved: !!user.isApproved,
            teamId: user.teamId,
            zoneId: user.zoneId
          }
        });
      }

      // 3. GET /api/auth/status (Waiting Hall Live Polling)
      if (pathname === '/api/auth/status' && req.method === 'GET') {
        const userId = parsedUrl.query.id;
        const callsign = parsedUrl.query.callsign;

        const user = db.collections.users.find(u => 
          (userId && u._id === userId) || (callsign && u.callsign.toLowerCase() === callsign.toLowerCase())
        );

        if (!user) {
          return sendJson(res, 404, { success: false, error: 'User record not found.' });
        }

        // Sync with team if player
        if (user.teamId) {
          const team = db.collections.teams.find(t => t._id === user.teamId);
          if (team) {
            user.isApproved = team.isApproved;
          }
        }

        return sendJson(res, 200, {
          success: true,
          _id: user._id,
          callsign: user.callsign,
          role: user.role,
          isApproved: !!user.isApproved,
          teamId: user.teamId,
          status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL'
        });
      }

      // 4. GET /api/admin/pending (List all pending approvals)
      if (pathname === '/api/admin/pending' && req.method === 'GET') {
        const pendingUsers = db.collections.users.filter(u => !u.isApproved && u.role !== 'ADMIN');
        const pendingTeams = db.collections.teams.filter(t => !t.isApproved);

        return sendJson(res, 200, {
          success: true,
          count: pendingUsers.length + pendingTeams.length,
          users: pendingUsers,
          teams: pendingTeams
        });
      }

      // 5. POST /api/admin/approve (Approve Team or Marshal)
      if (pathname === '/api/admin/approve' && req.method === 'POST') {
        const body = await parseBody(req);
        const { type, id } = body; // type: 'USER' or 'TEAM'

        if (type === 'TEAM') {
          const team = db.collections.teams.find(t => t._id === id);
          if (team) {
            team.isApproved = true;
            // Also approve user with this teamId
            db.collections.users.forEach(u => {
              if (u.teamId === id) u.isApproved = true;
            });
            db.save();
            db.logEvent('APPROVE_TEAM', `Squad authorized: "${team.name}" (${team._id})`);
            return sendJson(res, 200, { success: true, message: `Squad "${team.name}" approved.` });
          }
        } else {
          const user = db.collections.users.find(u => u._id === id);
          if (user) {
            user.isApproved = true;
            if (user.teamId) {
              const team = db.collections.teams.find(t => t._id === user.teamId);
              if (team) team.isApproved = true;
            }
            db.save();
            db.logEvent('APPROVE_USER', `Operative authorized: "${user.callsign}" (${user.role})`);
            return sendJson(res, 200, { success: true, message: `Operative "${user.callsign}" approved.` });
          }
        }

        return sendJson(res, 404, { success: false, error: 'Entity not found.' });
      }

      // 6. POST /api/admin/reject (Reject Team or Marshal)
      if (pathname === '/api/admin/reject' && req.method === 'POST') {
        const body = await parseBody(req);
        const { type, id } = body;

        if (type === 'TEAM') {
          db.collections.teams = db.collections.teams.filter(t => t._id !== id);
          db.collections.users = db.collections.users.filter(u => u.teamId !== id);
          db.save();
          db.logEvent('REJECT_TEAM', `Squad rejected and removed: ${id}`);
          return sendJson(res, 200, { success: true, message: 'Squad removed.' });
        } else {
          db.collections.users = db.collections.users.filter(u => u._id !== id);
          db.save();
          db.logEvent('REJECT_USER', `Operative rejected and removed: ${id}`);
          return sendJson(res, 200, { success: true, message: 'Operative removed.' });
        }
      }

      // 7. GET /api/database/all (MongoDB live collections viewer)
      if (pathname === '/api/database/all' && req.method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          database: 'territory_grid',
          engine: 'MongoDB Document Storage Engine v6.0',
          connected: true,
          host: 'mongodb://localhost:27017/territory_grid (Local Persistent Node)',
          stats: {
            usersCount: db.collections.users.length,
            teamsCount: db.collections.teams.length,
            cluesCount: db.collections.clues.length,
            checkinsCount: db.collections.checkins.length,
            logsCount: db.collections.system_logs.length,
            storageSizeKb: Math.round(fs.statSync(DB_FILE).size / 1024)
          },
          collections: {
            users: db.collections.users,
            teams: db.collections.teams,
            clues: db.collections.clues,
            checkins: db.collections.checkins,
            gameState: db.collections.gameState,
            system_logs: db.collections.system_logs
          }
        });
      }

      // 8. GET /api/database/export (Download JSON dump)
      if (pathname === '/api/database/export' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="territory_grid_mongodb_backup.json"'
        });
        return res.end(JSON.stringify(db.collections, null, 2));
      }

      // 9. GET & POST /api/game/state
      if (pathname === '/api/game/state') {
        if (req.method === 'GET') {
          return sendJson(res, 200, { success: true, state: db.collections.gameState });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          if (body.status) {
            db.collections.gameState.status = body.status;
            if (body.status === 'PLAYER_PHASE' && !db.collections.gameState.startedAt) {
              db.collections.gameState.startedAt = new Date().toISOString();
            }
            if (body.status === 'ENDED') {
              db.collections.gameState.endedAt = new Date().toISOString();
            }
            db.save();
            db.logEvent('GAME_STATUS', `Game status changed to ${body.status}`);
          }
          return sendJson(res, 200, { success: true, state: db.collections.gameState });
        }
      }

      // 10. GET /api/teams (All teams for Leaderboard & Marshal Check-in)
      if (pathname === '/api/teams' && req.method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          teams: db.collections.teams
        });
      }

      // 10b. GET /api/clues (All clues for Mission Directives)
      if (pathname === '/api/clues' && req.method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          clues: db.collections.clues
        });
      }

      // 11. POST /api/checkin (Field Marshal submit)
      if (pathname === '/api/checkin' && req.method === 'POST') {
        const body = await parseBody(req);
        const { teamId, zoneId, cone, cardRank, cardSuit, memberId } = body;

        const team = db.collections.teams.find(t => t._id === teamId);
        if (!team) {
          return sendJson(res, 404, { success: false, error: 'Team not found.' });
        }
        if (!team.isApproved) {
          return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });
        }

        // Check if already checked in at this zone
        if (team.visitedZones && team.visitedZones.includes(zoneId)) {
          return sendJson(res, 400, { success: false, error: 'Team has already completed checkpoint for this zone.' });
        }

        // Formula: Card Rank (Ace=1..King=13) + Cone (Red=10, Yellow=12, Green=15)
        const coneValues = { RED: 10, YELLOW: 12, GREEN: 15 };
        const conePts = coneValues[cone] || 10;
        const rankPts = parseInt(cardRank, 10) || 1;
        const totalPoints = conePts + rankPts;

        const checkinId = `${teamId}_${zoneId}`;
        const checkinRecord = {
          _id: checkinId,
          teamId,
          zoneId,
          memberId: memberId || 'marshal_station',
          cone,
          cardRank: rankPts,
          cardSuit: cardSuit || '♠',
          points: totalPoints,
          timestamp: new Date().toISOString()
        };

        db.collections.checkins.push(checkinRecord);

        // Update team score and inventory
        team.score = (team.score || 0) + totalPoints;
        team.cards = team.cards || [];
        team.cards.push({ rank: rankPts, suit: cardSuit || '♠', zoneId });
        team.visitedZones = team.visitedZones || [];
        team.visitedZones.push(zoneId);
        team.currentClueIndex = (team.currentClueIndex || 0) + 1;
        team.updatedAt = new Date().toISOString();

        db.save();
        db.logEvent('CHECKIN', `Team "${team.name}" awarded ${totalPoints} PTS at ${zoneId} (${cone}+${rankPts})`);

        return sendJson(res, 200, {
          success: true,
          pointsAwarded: totalPoints,
          teamScore: team.score,
          nextClueIndex: team.currentClueIndex
        });
      }

      // Default unknown API
      return sendJson(res, 404, { success: false, error: 'API endpoint not found' });
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      return sendJson(res, 500, { success: false, error: apiErr.message });
    }
  }

  // ── STATIC FILE SERVING ───────────────────────────────────────
  let safePath = pathname === '/' ? '/login.html' : pathname;
  // Prevent directory traversal
  const resolvedPath = path.normalize(path.join(STATIC_DIR, safePath));

  if (!resolvedPath.startsWith(STATIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html or 404
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end('<h1>404 - Not Found</h1><p><a href="/login.html">Return to Territory Grid Gateway</a></p>');
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(` TERRITORY GRID // MONGODB REAL-TIME ENGINE ACTIVE `);
  console.log(` Port: ${PORT} (http://localhost:${PORT})`);
  console.log(` Local Network Access: Ready for Club Fest Competitors`);
  console.log('====================================================');
});
