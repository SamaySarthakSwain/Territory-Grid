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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';
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
        durationMinutes: 52,
        durationSeconds: 3120,
        startedAt: null,
        endsAt: null,
        countdownStartAt: null,
        countdownEndsAt: null,
        pausedAt: null,
        totalPausedMs: 0,
        endedAt: null
      },
      system_logs: []
    };
    this.load();
    this.ensureDefaults();
  }

  load() {
    if ((!this.collections.users || this.collections.users.length <= 1) && fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.collections = parsed;
          console.log('[MongoDB Engine] Loaded collections from persistent storage.');
        }
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
    this.syncToCloud().catch(() => {});
  }

  async syncFromCloud(force = false) {
    const now = Date.now();
    if (!this.lastSynced) this.lastSynced = 0;
    if (!force && (now - this.lastSynced < 800) && Array.isArray(this.collections.users) && this.collections.users.length > 0) {
      return this.collections;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/territory_store?key=eq.main_store&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data) {
          this.collections = rows[0].data;
          this.lastSynced = Date.now();
          this.ensureDefaults();
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
          } catch(e){}
          return this.collections;
        }
      }
    } catch(e) {}
    this.load();
    return this.collections;
  }

  async syncToCloud() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      await fetch(`${SUPABASE_URL}/rest/v1/territory_store`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'main_store',
          data: this.collections,
          updated_at: new Date().toISOString()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.lastSynced = Date.now();
    } catch(e){}
  }

  ensureUniqueTeamCodes() {
    if (!Array.isArray(this.collections.teams)) {
      this.collections.teams = [];
      return false;
    }
    const teams = this.collections.teams;
    const usedCodes = new Set();
    let changed = false;

    // Pass 1: Prioritize teams with numeric names/callsigns (e.g. team1 -> 11, team2 -> 12, squad5 -> 15)
    teams.forEach(t => {
      const numMatch = (t.name || t.callsign || '').match(/\d+/);
      if (numMatch && numMatch[0]) {
        const n = parseInt(numMatch[0], 10);
        const code = (n >= 1 && n <= 89) ? (10 + n) : (n >= 11 && n <= 99 ? n : null);
        if (code && !usedCodes.has(code)) {
          if (t.teamCode !== code) changed = true;
          t.teamCode = code;
          usedCodes.add(code);
        }
      }
    });

    // Pass 2: Keep existing teamCode if valid and not conflicting
    teams.forEach(t => {
      if (t.teamCode && t.teamCode >= 11 && t.teamCode <= 99 && !usedCodes.has(t.teamCode)) {
        usedCodes.add(t.teamCode);
      } else if (t.teamCode && usedCodes.has(t.teamCode)) {
        const numMatch = (t.name || t.callsign || '').match(/\d+/);
        const n = (numMatch && numMatch[0]) ? parseInt(numMatch[0], 10) : 0;
        if (t.teamCode !== (10 + n)) {
          delete t.teamCode;
          changed = true;
        }
      }
    });

    // Pass 3: Fill missing teamCodes with next available integer in [11..99]
    let nextCode = 11;
    teams.forEach(t => {
      if (!t.teamCode) {
        while (usedCodes.has(nextCode) && nextCode <= 99) {
          nextCode++;
        }
        t.teamCode = nextCode;
        usedCodes.add(nextCode);
        changed = true;
      }
    });

    if (changed) {
      this.save();
    }
    return changed;
  }

  ensureDefaults() {
    let changed = false;
    if (this.ensureUniqueTeamCodes()) changed = true;

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

    // 2. Ensure Clues Collection Exists (No Automatic Seeding - Admin creates places manually)
    if (!this.collections.clues) {
      this.collections.clues = [];
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

function sendJson(res, statusCode, data, cacheControl = null, req = null) {
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
    const isWrite = req.method !== 'GET' && req.method !== 'HEAD';
    await db.syncFromCloud(isWrite);

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
        await db.syncToCloud();
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
        await db.syncFromCloud(false);
        db.load();
        const userId = parsedUrl.query.id;
        const callsign = parsedUrl.query.callsign;

        let user = db.collections.users.find(u => 
          (userId && (u._id === userId || u.id === userId)) || 
          (callsign && u.callsign && u.callsign.toLowerCase() === callsign.toLowerCase())
        );

        // Fallback: If user not directly found, check if a squad exists by ID or callsign
        if (!user && (userId || callsign)) {
          const team = db.collections.teams.find(t => 
            (userId && (t._id === userId || t.id === userId)) || 
            (callsign && t.callsign && t.callsign.toLowerCase() === callsign.toLowerCase())
          );
          if (team) {
            return sendJson(res, 200, {
              success: true,
              _id: team._id,
              callsign: team.callsign,
              name: team.name,
              role: 'PLAYER',
              isApproved: !!team.isApproved,
              teamId: team._id,
              status: team.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL'
            });
          }
          return sendJson(res, 404, { success: false, error: 'User record not found.' });
        }

        if (!user) {
          return sendJson(res, 400, { success: false, error: 'id or callsign query parameter is required.' });
        }

        // Bi-directional sync with team for players
        if (user.role === 'PLAYER' || user.teamId) {
          const team = db.collections.teams.find(t => 
            (user.teamId && (t._id === user.teamId || t.id === user.teamId)) ||
            (t.callsign && user.callsign && t.callsign.toLowerCase() === user.callsign.toLowerCase())
          );
          if (team) {
            if (team.isApproved !== user.isApproved) {
              const finalStatus = team.isApproved || user.isApproved;
              team.isApproved = finalStatus;
              user.isApproved = finalStatus;
              db.save(); // Persist to disk so refresh never loses it!
            }
          }
        }

        return sendJson(res, 200, {
          success: true,
          _id: user._id,
          callsign: user.callsign,
          name: user.name || user.callsign,
          role: user.role,
          isApproved: !!user.isApproved,
          teamId: user.teamId,
          status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL'
        });
      }

      // 4. GET /api/admin/pending (List all pending approvals with auto-heal sync)
      if (pathname === '/api/admin/pending' && req.method === 'GET') {
        await db.syncFromCloud(true);
        db.load();

        // Bi-directional Auto-Heal: Sync team & user approval status
        let autoHealed = false;
        db.collections.teams.forEach(t => {
          if (t.isApproved) {
            db.collections.users.forEach(u => {
              if ((u.teamId === t._id || (t.callsign && u.callsign && u.callsign.toLowerCase() === t.callsign.toLowerCase())) && !u.isApproved) {
                u.isApproved = true;
                autoHealed = true;
              }
            });
          }
        });
        db.collections.users.forEach(u => {
          if (u.isApproved && u.teamId) {
            db.collections.teams.forEach(t => {
              if ((t._id === u.teamId || (u.callsign && t.callsign && t.callsign.toLowerCase() === u.callsign.toLowerCase())) && !t.isApproved) {
                t.isApproved = true;
                autoHealed = true;
              }
            });
          }
        });
        if (autoHealed) db.save();

        const pendingMarshals = db.collections.users.filter(u => !u.isApproved && u.role === 'MEMBER');
        const pendingTeams = db.collections.teams.filter(t => !t.isApproved);

        return sendJson(res, 200, {
          success: true,
          count: pendingMarshals.length + pendingTeams.length,
          users: pendingMarshals,
          teams: pendingTeams
        });
      }

      // 5. POST /api/admin/approve (Ultra-Resilient Approval for Team or Marshal)
      if (pathname === '/api/admin/approve' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const { type, id } = body;
        const cleanId = String(id || '').trim();
        const cleanType = String(type || '').trim().toUpperCase();

        if (!cleanId) {
          return sendJson(res, 400, { success: false, error: 'ID is required for clearance authorization.' });
        }

        let approvedAny = false;
        let approvedName = cleanId;
        let approvedRole = cleanType === 'MEMBER' ? 'MEMBER' : 'PLAYER';

        // 1. Search Teams by _id, id, callsign, or name
        const matchedTeams = db.collections.teams.filter(t => 
          (t._id && t._id === cleanId) ||
          (t.id && t.id === cleanId) ||
          (t.callsign && t.callsign.toLowerCase() === cleanId.toLowerCase()) ||
          (t.name && t.name.toLowerCase() === cleanId.toLowerCase())
        );

        if (matchedTeams.length > 0) {
          matchedTeams.forEach(team => {
            team.isApproved = true;
            approvedName = team.name || team.callsign;
            approvedAny = true;
            approvedRole = 'PLAYER';

            // Also authorize all users associated with this squad
            db.collections.users.forEach(u => {
              if (
                u.teamId === team._id || 
                (team.id && u.teamId === team.id) || 
                (team.callsign && u.callsign && u.callsign.toLowerCase() === team.callsign.toLowerCase()) ||
                u._id === cleanId
              ) {
                u.isApproved = true;
              }
            });
          });
        }

        // 2. Search Users by _id, id, callsign, or teamId
        const matchedUsers = db.collections.users.filter(u =>
          (u._id && u._id === cleanId) ||
          (u.id && u.id === cleanId) ||
          (u.callsign && u.callsign.toLowerCase() === cleanId.toLowerCase()) ||
          (u.teamId && u.teamId === cleanId)
        );

        if (matchedUsers.length > 0) {
          matchedUsers.forEach(user => {
            user.isApproved = true;
            approvedAny = true;
            if (!approvedName || approvedName === cleanId) approvedName = user.name || user.callsign;
            approvedRole = user.role;

            // If operative is a player with a team, ensure squad record is also approved
            if (user.teamId) {
              db.collections.teams.forEach(t => {
                if (
                  t._id === user.teamId || 
                  t.id === user.teamId || 
                  (t.callsign && user.callsign && t.callsign.toLowerCase() === user.callsign.toLowerCase())
                ) {
                  t.isApproved = true;
                }
              });
            }
          });
        }

        if (approvedAny) {
          await db.syncToCloud();
          const logAction = approvedRole === 'MEMBER' ? 'APPROVE_USER' : 'APPROVE_TEAM';
          const logMsg = approvedRole === 'MEMBER'
            ? `Field Marshal authorized: "${approvedName}" (${cleanId})`
            : `Squad authorized: "${approvedName}" (${cleanId})`;
          db.logEvent(logAction, logMsg);
          return sendJson(res, 200, { success: true, message: `${approvedName} clearance authorized.`, entityId: cleanId });
        }

        return sendJson(res, 404, { success: false, error: `Clearance entity "${cleanId}" not found in database.` });
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

      // 6b. POST /api/admin/teams/reset-points (Reset Team Score & Progress to 0)
      if (pathname === '/api/admin/teams/reset-points' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const teamId = body.teamId || body.id;

        if (!teamId) {
          return sendJson(res, 400, { success: false, error: 'Team ID is required.' });
        }

        const team = db.collections.teams.find(t => t._id === teamId || (t.id && t.id === teamId));
        if (!team) {
          return sendJson(res, 404, { success: false, error: 'Squad not found in database.' });
        }

        const prevScore = team.score || 0;
        team.score = 0;
        team.cards = [];
        team.visitedZones = [];
        team.currentClueIndex = 0;

        // Clean out check-ins for this team
        db.collections.checkins = db.collections.checkins.filter(c => c.teamId !== teamId && c.team !== teamId);

        db.save();
        db.logEvent('RESET_POINTS', `Game Master reset points (was ${prevScore} PTS) and cleared progress for squad: "${team.name}" (${team._id})`);
        return sendJson(res, 200, { success: true, message: `Points and progress reset to 0 for squad "${team.name}".` });
      }

      // 6c. POST /api/admin/teams/remove (Permanently Delete Squad & Associated Accounts)
      if (pathname === '/api/admin/teams/remove' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const teamId = body.teamId || body.id;

        if (!teamId) {
          return sendJson(res, 400, { success: false, error: 'Team ID is required.' });
        }

        const team = db.collections.teams.find(t => t._id === teamId || (t.id && t.id === teamId));
        const teamName = team ? team.name : teamId;

        db.collections.teams = db.collections.teams.filter(t => t._id !== teamId && t.id !== teamId);
        db.collections.users = db.collections.users.filter(u => u.teamId !== teamId && u.callsign !== teamName);
        db.collections.checkins = db.collections.checkins.filter(c => c.teamId !== teamId && c.team !== teamId);

        db.save();
        db.logEvent('REMOVE_TEAM', `Game Master permanently removed squad: "${teamName}" (${teamId}) and purged operative accounts.`);
        return sendJson(res, 200, { success: true, message: `Squad "${teamName}" removed permanently.` });
      }

      // 6d. GET /api/admin/logs (Audit Trail of all Admin & System Events)
      if (pathname === '/api/admin/logs' && req.method === 'GET') {
        db.load();
        const limit = parseInt(parsedUrl.query.limit, 10) || 200;
        const logs = (db.collections.system_logs || []).slice(0, limit);
        return sendJson(res, 200, {
          success: true,
          logs: logs,
          total: (db.collections.system_logs || []).length
        });
      }

      // 6e. POST /api/admin/logs/clear (Purge Audit Trail)
      if (pathname === '/api/admin/logs/clear' && req.method === 'POST') {
        db.load();
        const count = (db.collections.system_logs || []).length;
        db.collections.system_logs = [];
        db.logEvent('PURGE_LOGS', `Game Master purged ${count} system audit log entries.`);
        db.save();
        return sendJson(res, 200, { success: true, message: 'Audit logs cleared successfully.' });
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

      // 9. GET & POST /api/game/state (Synchronized 52-Minute Hunt & 10-Second Countdown Engine)
      if (pathname === '/api/game/state') {
        db.load();
        const now = Date.now();
        const gs = db.collections.gameState || { status: 'LOBBY' };
        if (!gs.durationMinutes) gs.durationMinutes = 52;
        if (!gs.durationSeconds) gs.durationSeconds = gs.durationMinutes * 60;

        // Auto-advance: COUNTDOWN -> PLAYER_PHASE when 10s countdown ends
        if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
          const cdEnd = new Date(gs.countdownEndsAt).getTime();
          if (now >= cdEnd) {
            gs.status = 'PLAYER_PHASE';
            if (!gs.startedAt) gs.startedAt = new Date(cdEnd).toISOString();
            if (!gs.endsAt) gs.endsAt = new Date(cdEnd + gs.durationSeconds * 1000).toISOString();
            db.save();
            db.logEvent('GAME_STATUS', '10s Countdown completed! Game is now LIVE in PLAYER_PHASE (52 Minutes).');
          }
        }

        // Auto-end match when 52-minute duration expires
        if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
          const gameEnd = new Date(gs.endsAt).getTime();
          if (now >= gameEnd) {
            gs.status = 'ENDED';
            if (!gs.endedAt) gs.endedAt = new Date().toISOString();
            db.save();
            db.logEvent('GAME_STATUS', '52-Minute Hunt duration expired. Match concluded.');
          }
        }

        if (req.method === 'GET') {
          let remainingSeconds = gs.durationSeconds || 3120;
          let countdownSeconds = 0;

          if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
            countdownSeconds = Math.max(0, Math.ceil((new Date(gs.countdownEndsAt).getTime() - now) / 1000));
            remainingSeconds = gs.durationSeconds;
          } else if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
            remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - now) / 1000));
          } else if (gs.status === 'ENDED') {
            remainingSeconds = 0;
          } else if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
            remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - new Date(gs.pausedAt).getTime()) / 1000));
          }

          return sendJson(res, 200, {
            success: true,
            state: gs,
            serverTime: new Date(now).toISOString(),
            remainingSeconds: remainingSeconds,
            countdownSeconds: countdownSeconds,
            durationSeconds: gs.durationSeconds,
            durationMinutes: gs.durationMinutes
          });
        }

        if (req.method === 'POST') {
          const body = await parseBody(req);
          const reqStatus = body.status || body.action;

          if (reqStatus === 'START_COUNTDOWN' || reqStatus === 'COUNTDOWN') {
            const cdMs = (parseInt(body.countdownSeconds, 10) || 10) * 1000;
            const durMins = parseInt(body.durationMinutes, 10) || 52;
            const durSecs = durMins * 60;

            gs.status = 'COUNTDOWN';
            gs.durationMinutes = durMins;
            gs.durationSeconds = durSecs;
            gs.countdownStartAt = new Date(now).toISOString();
            gs.countdownEndsAt = new Date(now + cdMs).toISOString();
            gs.startedAt = new Date(now + cdMs).toISOString();
            gs.endsAt = new Date(now + cdMs + durSecs * 1000).toISOString();
            gs.pausedAt = null;
            gs.totalPausedMs = 0;
            gs.endedAt = null;

            db.save();
            db.logEvent('GAME_STATUS', `Game Master initiated 10s countdown for ${durMins}-minute hunt.`);
          } else if (reqStatus === 'START' || reqStatus === 'PLAYER_PHASE') {
            const durMins = parseInt(body.durationMinutes, 10) || 52;
            const durSecs = durMins * 60;

            gs.status = 'PLAYER_PHASE';
            gs.durationMinutes = durMins;
            gs.durationSeconds = durSecs;
            gs.countdownStartAt = null;
            gs.countdownEndsAt = null;
            gs.startedAt = new Date(now).toISOString();
            gs.endsAt = new Date(now + durSecs * 1000).toISOString();
            gs.pausedAt = null;
            gs.totalPausedMs = 0;
            gs.endedAt = null;

            db.save();
            db.logEvent('GAME_STATUS', `Game Master started ${durMins}-minute hunt immediately.`);
          } else if (reqStatus === 'PAUSE' || reqStatus === 'PAUSED') {
            if (gs.status === 'PLAYER_PHASE') {
              gs.status = 'PAUSED';
              gs.pausedAt = new Date(now).toISOString();
              db.save();
              db.logEvent('GAME_STATUS', 'Game Master paused hunt operations.');
            }
          } else if (reqStatus === 'RESUME') {
            if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
              const pauseDuration = now - new Date(gs.pausedAt).getTime();
              gs.totalPausedMs = (gs.totalPausedMs || 0) + pauseDuration;
              gs.endsAt = new Date(new Date(gs.endsAt).getTime() + pauseDuration).toISOString();
              gs.status = 'PLAYER_PHASE';
              gs.pausedAt = null;
              db.save();
              db.logEvent('GAME_STATUS', `Game Master resumed hunt operations (extended by ${Math.round(pauseDuration/1000)}s).`);
            }
          } else if (reqStatus === 'RESET' || reqStatus === 'LOBBY') {
            gs.status = 'LOBBY';
            gs.durationMinutes = 52;
            gs.durationSeconds = 52 * 60;
            gs.startedAt = null;
            gs.endsAt = null;
            gs.countdownStartAt = null;
            gs.countdownEndsAt = null;
            gs.pausedAt = null;
            gs.totalPausedMs = 0;
            gs.endedAt = null;

            db.save();
            db.logEvent('GAME_STATUS', 'Game Master reset game state to LOBBY standby.');
          } else if (reqStatus === 'ENDED') {
            gs.status = 'ENDED';
            gs.endedAt = new Date(now).toISOString();
            db.save();
            db.logEvent('GAME_STATUS', 'Game Master ended the match.');
          }

          let remainingSeconds = gs.durationSeconds || 3120;
          let countdownSeconds = 0;
          if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
            countdownSeconds = Math.max(0, Math.ceil((new Date(gs.countdownEndsAt).getTime() - now) / 1000));
          } else if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
            remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - now) / 1000));
          } else if (gs.status === 'ENDED') {
            remainingSeconds = 0;
          }

          return sendJson(res, 200, {
            success: true,
            state: gs,
            serverTime: new Date(now).toISOString(),
            remainingSeconds: remainingSeconds,
            countdownSeconds: countdownSeconds,
            durationSeconds: gs.durationSeconds,
            durationMinutes: gs.durationMinutes
          });
        }
      }

      // 10. GET /api/teams (All teams for Leaderboard & Marshal Check-in)
      if (pathname === '/api/teams' && req.method === 'GET') {
        db.load();
        db.ensureUniqueTeamCodes();
        return sendJson(res, 200, {
          success: true,
          teams: db.collections.teams
        });
      }

      // 10b. GET /api/clues (Mission Directives & Checkpoint Places)
      // Only returns places where a Field Marshal has registered (unless all=true or role=ADMIN/MEMBER)
      if (pathname === '/api/clues' && req.method === 'GET') {
        db.load();
        const urlObj = new URL(req.url, 'http://localhost');
        const showAll = urlObj.searchParams.get('all') === 'true' || 
                        urlObj.searchParams.get('role') === 'ADMIN' || 
                        urlObj.searchParams.get('role') === 'MEMBER';

        // Find all registered marshals and the zones they are assigned to
        const marshals = (db.collections.users || []).filter(u => u.role === 'MEMBER' && u.zoneId);
        const activeZoneMap = {};
        marshals.forEach(m => {
          const z = (m.zoneId || '').toUpperCase().trim();
          if (!activeZoneMap[z]) activeZoneMap[z] = [];
          activeZoneMap[z].push(m.callsign || m.name);
        });

        const allClues = (db.collections.clues || []).map(c => {
          const z = (c.zoneId || '').toUpperCase().trim();
          const assignedMarshals = activeZoneMap[z] || [];
          return {
            ...c,
            hasMarshal: assignedMarshals.length > 0,
            marshals: assignedMarshals,
            marshalCount: assignedMarshals.length
          };
        });

        if (showAll) {
          return sendJson(res, 200, {
            success: true,
            clues: allClues,
            totalCount: allClues.length,
            activeCount: allClues.filter(c => c.hasMarshal).length
          });
        }

        // For Players: ONLY show places where a marshal has registered!
        const playerClues = allClues.filter(c => c.hasMarshal);
        return sendJson(res, 200, {
          success: true,
          clues: playerClues,
          totalCount: playerClues.length,
          allPlacesCount: allClues.length,
          waitingForMarshals: playerClues.length === 0
        });
      }

      // 10c. POST /api/admin/clues/save (Create or Update Zone Place)
      if (pathname === '/api/admin/clues/save' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const { _id, zoneId, zoneLabel, text } = body;

        if (!zoneId || !zoneLabel || !text) {
          return sendJson(res, 400, { success: false, error: 'Zone ID, Place Name, and Clue Hint are required.' });
        }

        const cleanZoneId = zoneId.trim().toUpperCase();
        const cleanLabel = zoneLabel.trim();
        const cleanText = text.trim();

        if (_id) {
          const existing = db.collections.clues.find(c => c._id === _id);
          if (existing) {
            existing.zoneId = cleanZoneId;
            existing.zoneLabel = cleanLabel;
            existing.text = cleanText;
          }
        } else {
          const newId = 'clue_' + Date.now().toString(36);
          db.collections.clues.push({ _id: newId, zoneId: cleanZoneId, zoneLabel: cleanLabel, text: cleanText });
        }
        db.save();
        db.logEvent('SAVE_PLACE', `Game Master ${_id ? 'updated' : 'added'} checkpoint "${cleanZoneId}": ${cleanLabel}`);
        return sendJson(res, 200, { success: true, message: 'Place saved successfully.', clues: db.collections.clues });
      }

      // 10d. POST /api/admin/clues/delete (Delete Zone Place)
      if (pathname === '/api/admin/clues/delete' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const { _id } = body;

        db.collections.clues = db.collections.clues.filter(c => c._id !== _id);
        db.save();
        db.logEvent('DELETE_PLACE', `Game Master deleted checkpoint: ${_id}`);
        return sendJson(res, 200, { success: true, message: 'Place deleted successfully.', clues: db.collections.clues });
      }

      // 10f. POST /api/admin/clues/clear (Clear all places for clean manual setup)
      if (pathname === '/api/admin/clues/clear' && req.method === 'POST') {
        db.load();
        db.collections.clues = [];
        db.save();
        db.logEvent('CLEAR_PLACES', 'Game Master cleared all campus places.');
        return sendJson(res, 200, { success: true, message: 'All campus places cleared successfully.', clues: [] });
      }

      // 10e. POST /api/admin/clues/reset (Reset or Set Number of Zones)
      if (pathname === '/api/admin/clues/reset' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const targetCount = parseInt(body.count, 10) || 13;

        const default13 = [
          { _id: 'clue_01', text: 'Locate the Yellow Beacon Cone nestled near the library plaza & colonnade arch!', zoneId: 'ZONE_01', zoneLabel: 'Zone 1 - Library Arch' },
          { _id: 'clue_02', text: 'Search the courtyard perimeter behind the ancient bronze solar obelisk.', zoneId: 'ZONE_02', zoneLabel: 'Zone 2 - Solar Obelisk' },
          { _id: 'clue_03', text: 'Ascend the terrace staircase overlooking the historic clocktower.', zoneId: 'ZONE_03', zoneLabel: 'Zone 3 - Clocktower Terrace' },
          { _id: 'clue_04', text: 'Investigate the botanical garden glasshouse south perimeter.', zoneId: 'ZONE_04', zoneLabel: 'Zone 4 - Glasshouse Botanical' },
          { _id: 'clue_05', text: 'Cross the pedestrian skybridge connecting science hall 1 & 2.', zoneId: 'ZONE_05', zoneLabel: 'Zone 5 - Skybridge Concourse' },
          { _id: 'clue_06', text: 'Look beneath the concrete amphitheater canopy seating.', zoneId: 'ZONE_06', zoneLabel: 'Zone 6 - Amphitheater Canopy' },
          { _id: 'clue_07', text: 'Find the water fountain basin near the science auditorium.', zoneId: 'ZONE_07', zoneLabel: 'Zone 7 - Science Basin' },
          { _id: 'clue_08', text: 'Check the shaded colonnade behind student center pavilion.', zoneId: 'ZONE_08', zoneLabel: 'Zone 8 - Student Pavilion' },
          { _id: 'clue_09', text: 'Locate the red telecom antenna pylon on north concourse.', zoneId: 'ZONE_09', zoneLabel: 'Zone 9 - North Telecom Pylon' },
          { _id: 'clue_10', text: 'Scan the perimeter fence surrounding the athletic turf field.', zoneId: 'ZONE_10', zoneLabel: 'Zone 10 - Turf Perimeter' },
          { _id: 'clue_11', text: 'Find the solar energy charging station outside the REC technology workshop.', zoneId: 'ZONE_11', zoneLabel: 'Zone 11 - Energy Innovation Hub' },
          { _id: 'clue_12', text: 'Spot the green beacon marker stationed near the robotics exhibition arena.', zoneId: 'ZONE_12', zoneLabel: 'Zone 12 - Innovation Arena' },
          { _id: 'clue_13', text: 'Reach the central ceremonial flagpole lawn overlooking the grand quadrangle.', zoneId: 'ZONE_13', zoneLabel: 'Zone 13 - Central Concourse' }
        ];

        const newClues = [];
        for (let i = 1; i <= targetCount; i++) {
          const numStr = String(i).padStart(2, '0');
          const defaultMatch = default13[i - 1];
          if (defaultMatch) {
            newClues.push({ ...defaultMatch, _id: 'clue_' + numStr });
          } else {
            newClues.push({
              _id: 'clue_' + numStr,
              zoneId: 'ZONE_' + numStr,
              zoneLabel: 'Zone ' + i + ' - Station ' + numStr,
              text: 'Locate the Beacon Cone stationed at Zone ' + i + ' checkpoint area.'
            });
          }
        }

        db.collections.clues = newClues;
        db.save();
        return sendJson(res, 200, { success: true, message: `Configured ${targetCount} zones successfully.`, clues: newClues });
      }

      // 11. POST /api/checkin (Field Marshal submit)
      if (pathname === '/api/checkin' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        let { teamId, zoneId, cone, cardRank, cardSuit, memberId, allowDuplicate, code, qrPayload } = body;

        // Auto-decode 6-digit code or QR payload if passed
        const rawCode = String(code || qrPayload || '').trim();
        if (rawCode) {
          if (rawCode.startsWith('TG|')) {
            const parts = rawCode.split('|');
            if (!teamId && parts[1]) teamId = parts[1];
            if (!cardRank && parts[3]) cardRank = parseInt(parts[3], 10);
            if (!cardSuit && parts[5]) cardSuit = parts[5];
            if (parts[6] && !code) code = parts[6];
          }
          
          const cleanDigits = (code || rawCode).replace(/\D/g, '');
          if (cleanDigits.length === 6) {
            const tt = parseInt(cleanDigits.slice(0, 2), 10);
            const rr = parseInt(cleanDigits.slice(2, 4), 10);
            const hh = parseInt(cleanDigits.slice(4, 6), 10);

            // Match team strictly by TT from 6-digit cipher code
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
                return sendJson(res, 400, { success: false, error: `Squad code (${tt}) does not match any registered team.` });
              }
            }

            // Derive card rank (21..33 -> 1..13)
            if (!cardRank && rr >= 21 && rr <= 33) {
              cardRank = rr - 20;
            }

            // Derive place/zone & suit (10..61)
            if (hh >= 10 && hh <= 61) {
              const clueIdx = Math.floor((hh - 10) / 4);
              const suitIdx = (hh - 10) % 4;
              const suits = ['♠', '♥', '♦', '♣'];
              if (!cardSuit) cardSuit = suits[suitIdx] || '♠';
              if (!zoneId) zoneId = 'ZONE_' + String(clueIdx + 1).padStart(2, '0');
            }
          }
        }

        const team = db.collections.teams.find(t => 
          t._id === teamId || (t.callsign && t.callsign.toLowerCase() === (teamId || '').toLowerCase())
        );
        if (!team) {
          return sendJson(res, 404, { success: false, error: 'Team not found.' });
        }
        if (!team.isApproved) {
          return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });
        }

        // Check if already checked in at this zone
        if (team.visitedZones && team.visitedZones.includes(zoneId) && !allowDuplicate) {
          return sendJson(res, 400, {
            success: false,
            alreadyVisited: true,
            error: `Squad "${team.name}" has already cleared ${zoneId}! Current objective is Checkpoint #${(team.currentClueIndex || 0) + 1}.`
          });
        }

        // Formula: Card Rank (Ace=1..King=13) + Cone (Red=10, Yellow=12, Green=15)
        const coneValues = { RED: 10, YELLOW: 12, GREEN: 15 };
        const conePts = coneValues[cone] || 12;
        const rankPts = parseInt(cardRank, 10) || 13;
        const totalPoints = conePts + rankPts;

        const checkinId = `${team._id}_${zoneId}_${Date.now()}`;
        const checkinRecord = {
          _id: checkinId,
          teamId: team._id,
          zoneId,
          memberId: memberId || 'marshal_station',
          cone: cone || 'YELLOW',
          cardRank: rankPts,
          cardSuit: cardSuit || '♠',
          points: totalPoints,
          timestamp: new Date().toISOString()
        };

        db.collections.checkins = db.collections.checkins || [];
        db.collections.checkins.push(checkinRecord);

        // Update team score and inventory
        team.score = (team.score || 0) + totalPoints;
        team.cards = team.cards || [];
        team.cards.push({ rank: rankPts, suit: cardSuit || '♠', zoneId, awardedAt: new Date().toISOString() });
        team.visitedZones = team.visitedZones || [];
        if (!team.visitedZones.includes(zoneId)) team.visitedZones.push(zoneId);
        team.currentClueIndex = (team.currentClueIndex || 0) + 1;
        team.updatedAt = new Date().toISOString();

        await db.syncToCloud();
        db.logEvent('CHECKIN', `Team "${team.name}" awarded +${totalPoints} PTS at ${zoneId} (Total: ${team.score} PTS)`);

        return sendJson(res, 200, {
          success: true,
          pointsAwarded: totalPoints,
          teamScore: team.score,
          teamName: team.name || team.callsign,
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

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.maxRequestsPerSocket = 0;

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(` TERRITORY GRID // MONGODB REAL-TIME ENGINE ACTIVE `);
  console.log(` Port: ${PORT} (http://localhost:${PORT})`);
  console.log(` Local Network Access: Ready for Club Fest Competitors`);
  console.log('====================================================');
});
