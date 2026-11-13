// Territory Grid // Vercel Serverless Function Gateway & MongoDB Engine
// Handles all /api/* requests on Vercel and local environments

const url = require('url');
const fs = require('fs');
const path = require('path');

// Determine storage mode: Real MongoDB Atlas vs Fallback In-Memory/JSON
const MONGODB_URI = process.env.MONGODB_URI;
let MongoClient = null;
let mongoClientInstance = null;
let mongoDbInstance = null;

try {
  MongoClient = require('mongodb').MongoClient;
} catch (e) {
  // MongoDB driver optional if running without it
}

// ─────────────────────────────────────────────────────────────
// Default Data Set
// ─────────────────────────────────────────────────────────────
const DEFAULT_CLUES = [
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

const DEFAULT_ADMIN = {
  _id: 'user_admin_samay',
  callsign: 'samay',
  name: 'Game Master Samay',
  role: 'ADMIN',
  password: 'samay',
  isApproved: true,
  createdAt: new Date().toISOString()
};

// ─────────────────────────────────────────────────────────────
// Supabase Real-Time Cloud Store Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';

// ─────────────────────────────────────────────────────────────
// Cloud-Backed Persistent Document Engine (Zero Data Loss)
// ─────────────────────────────────────────────────────────────
class MemoryStore {
  constructor() {
    this.filePath = process.env.VERCEL ? '/tmp/territory_grid_mongodb.json' : path.join(__dirname, '..', 'web_server', 'data', 'territory_grid_mongodb.json');
    this.collections = {
      users: [DEFAULT_ADMIN],
      teams: [],
      clues: DEFAULT_CLUES,
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
      system_logs: [
        {
          _id: 'log_init',
          action: 'SYSTEM_INIT',
          details: 'Territory Grid Cloud Engine active.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    this.lastSynced = 0;
    this.load();
  }

  load() {
    try {
      if ((!this.collections.users || this.collections.users.length <= 1) && fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.collections = parsed;
        }
      }
    } catch (e) {}
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {
      // ignore in read-only environments
    }
    // Asynchronously push to Supabase cloud store
    this.syncToCloud().catch(err => console.warn('[CloudStore background save warning]:', err.message));
  }

  async syncFromCloud(force = false) {
    const now = Date.now();
    // Use fast in-memory cache for GET polls within 600ms
    if (!force && (now - this.lastSynced < 600) && Array.isArray(this.collections.users) && this.collections.users.length > 0) {
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
          // Write to local cache
          try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
          } catch(e){}
          return this.collections;
        }
      }
    } catch (e) {
      console.warn('[CloudStore syncFromCloud]:', e.message);
    }
    this.load();
    return this.collections;
  }

  async syncToCloud() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/territory_store`, {
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
      return res.ok;
    } catch (e) {
      console.warn('[CloudStore syncToCloud]:', e.message);
      return false;
    }
  }

  logEvent(action, details) {
    if (!Array.isArray(this.collections.system_logs)) {
      this.collections.system_logs = [];
    }
    this.collections.system_logs.unshift({
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (this.collections.system_logs.length > 300) this.collections.system_logs.pop();
    this.save();
  }
}

const memoryStore = new MemoryStore();

// ─────────────────────────────────────────────────────────────
// MongoDB Atlas Connection Manager (When MONGODB_URI is provided)
// ─────────────────────────────────────────────────────────────
async function getMongoDb() {
  if (!MONGODB_URI || !MongoClient) return null;
  if (mongoDbInstance) return mongoDbInstance;

  try {
    if (!mongoClientInstance) {
      mongoClientInstance = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      await mongoClientInstance.connect();
    }
    mongoDbInstance = mongoClientInstance.db('territory_grid');
    
    // Ensure default collections and admin
    const usersCol = mongoDbInstance.collection('users');
    const adminUser = await usersCol.findOne({ callsign: 'samay' });
    if (!adminUser) {
      await usersCol.insertOne(DEFAULT_ADMIN);
    }
    // Ensure clues collection exists without auto-seeding dummy places (Game Master adds places manually)
    return mongoDbInstance;
  } catch (err) {
    console.error('[MongoDB Atlas Connection Error, falling back to memory store]:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────────────────
function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
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
// Serverless Handler
// ─────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname || '/';

  // Normalize path if rewrites stripped /api
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + (pathname.startsWith('/') ? '' : '/') + pathname;
  }

  // Sync fresh state from Supabase Cloud Store
  const isWrite = req.method !== 'GET' && req.method !== 'HEAD';
  await memoryStore.syncFromCloud(isWrite);

  const atlasDb = await getMongoDb();

  try {
    // ─────────────────────────────────────────────────────────
    // 1. POST /api/auth/register
    // ─────────────────────────────────────────────────────────
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

      if (atlasDb) {
        const usersCol = atlasDb.collection('users');
        const teamsCol = atlasDb.collection('teams');
        const existing = await usersCol.findOne({ callsign: new RegExp('^' + normalizedCallsign + '$', 'i') });
        if (existing) {
          return sendJson(res, 400, { success: false, error: `Callsign "${callsign}" is already registered.` });
        }

        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        let teamId = null;

        if (role === 'PLAYER') {
          teamId = 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          const clues = await atlasDb.collection('clues').find().toArray();
          const clueOrder = clues.map(c => c._id).sort(() => Math.random() - 0.5);
          await teamsCol.insertOne({
            _id: teamId,
            name: name || callsign,
            callsign: callsign,
            score: 0,
            cards: [],
            clueOrder: clueOrder,
            currentClueIndex: 0,
            visitedZones: [],
            isApproved: false,
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
          isApproved: false,
          createdAt: new Date().toISOString()
        };

        await usersCol.insertOne(newUser);
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

      // Memory Store Fallback
      const userExists = memoryStore.collections.users.some(u => u.callsign.toLowerCase() === normalizedCallsign);
      if (userExists) {
        return sendJson(res, 400, { success: false, error: `Callsign "${callsign}" is already registered.` });
      }

      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      let teamId = null;

      if (role === 'PLAYER') {
        teamId = 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const clueOrder = memoryStore.collections.clues.map(c => c._id).sort(() => Math.random() - 0.5);
        memoryStore.collections.teams.push({
          _id: teamId,
          name: name || callsign,
          callsign: callsign,
          score: 0,
          cards: [],
          clueOrder: clueOrder,
          currentClueIndex: 0,
          visitedZones: [],
          isApproved: false,
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
        isApproved: false,
        createdAt: new Date().toISOString()
      };

      memoryStore.collections.users.push(newUser);
      await memoryStore.syncToCloud();
      memoryStore.logEvent('REGISTER', `${newUser.role} "${newUser.callsign}" registered.`);

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

    // ─────────────────────────────────────────────────────────
    // 2. POST /api/auth/login
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { callsign, password, requestedRole } = body;

      if (!callsign || !password) {
        return sendJson(res, 400, { success: false, error: 'Please enter callsign and password.' });
      }

      const trimmedCallsign = callsign.trim();
      const trimmedPass = password.trim();

      // Admin Samay (Fixed Account)
      if (trimmedCallsign.toLowerCase() === 'samay' && trimmedPass === 'samay') {
        return sendJson(res, 200, {
          success: true,
          role: 'ADMIN',
          isApproved: true,
          user: DEFAULT_ADMIN
        });
      }

      if (atlasDb) {
        const user = await atlasDb.collection('users').findOne({
          callsign: new RegExp('^' + trimmedCallsign + '$', 'i'),
          password: trimmedPass
        });
        if (!user) {
          return sendJson(res, 401, { success: false, error: 'Clearance Rejected: Invalid callsign or access key.' });
        }
        if (requestedRole && user.role !== requestedRole && user.role !== 'ADMIN') {
          return sendJson(res, 403, { success: false, error: `Clearance Mismatch: Account is ${user.role}, but accessing ${requestedRole} portal.` });
        }
        return sendJson(res, 200, {
          success: true,
          role: user.role,
          isApproved: !!user.isApproved,
          status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL',
          user: user
        });
      }

      // Memory Store
      const user = memoryStore.collections.users.find(u => 
        u.callsign.toLowerCase() === trimmedCallsign.toLowerCase() && u.password === trimmedPass
      );
      if (!user) {
        return sendJson(res, 401, { success: false, error: 'Clearance Rejected: Invalid callsign or access key.' });
      }
      if (requestedRole && user.role !== requestedRole && user.role !== 'ADMIN') {
        return sendJson(res, 403, { success: false, error: `Clearance Mismatch: Account is ${user.role}, but accessing ${requestedRole} portal.` });
      }

      return sendJson(res, 200, {
        success: true,
        role: user.role,
        isApproved: !!user.isApproved,
        status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL',
        user: user
      });
    }

    // ─────────────────────────────────────────────────────────
    // 3. GET /api/auth/status
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/auth/status' && req.method === 'GET') {
      await memoryStore.syncFromCloud(false);
      const userId = parsedUrl.query.id;
      const callsign = parsedUrl.query.callsign;

      if (atlasDb) {
        const query = userId 
          ? { $or: [{ _id: userId }, { id: userId }] } 
          : { callsign: new RegExp('^' + callsign + '$', 'i') };
        
        let user = await atlasDb.collection('users').findOne(query);

        if (!user && (userId || callsign)) {
          const team = await atlasDb.collection('teams').findOne(query);
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

        if (!user) return sendJson(res, 400, { success: false, error: 'id or callsign query parameter required.' });

        let isApproved = !!user.isApproved;
        if (user.teamId || user.role === 'PLAYER') {
          const team = await atlasDb.collection('teams').findOne({
            $or: [{ _id: user.teamId }, { callsign: user.callsign }]
          });
          if (team) {
            if (team.isApproved !== isApproved) {
              const finalStatus = team.isApproved || isApproved;
              isApproved = finalStatus;
              await atlasDb.collection('users').updateOne({ _id: user._id }, { $set: { isApproved: finalStatus } });
              await atlasDb.collection('teams').updateOne({ _id: team._id }, { $set: { isApproved: finalStatus } });
            }
          }
        }

        return sendJson(res, 200, {
          success: true,
          _id: user._id,
          callsign: user.callsign,
          name: user.name || user.callsign,
          role: user.role,
          isApproved: isApproved,
          teamId: user.teamId,
          status: isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL'
        });
      }

      memoryStore.load();
      let user = memoryStore.collections.users.find(u => 
        (userId && (u._id === userId || u.id === userId)) || 
        (callsign && u.callsign && u.callsign.toLowerCase() === callsign.toLowerCase())
      );

      if (!user && (userId || callsign)) {
        const team = memoryStore.collections.teams.find(t => 
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

      // Bi-directional sync
      if (user.role === 'PLAYER' || user.teamId) {
        const team = memoryStore.collections.teams.find(t => 
          (user.teamId && (t._id === user.teamId || t.id === user.teamId)) ||
          (t.callsign && user.callsign && t.callsign.toLowerCase() === user.callsign.toLowerCase())
        );
        if (team) {
          if (team.isApproved !== user.isApproved) {
            const finalStatus = team.isApproved || user.isApproved;
            team.isApproved = finalStatus;
            user.isApproved = finalStatus;
            memoryStore.save();
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

    // ─────────────────────────────────────────────────────────
    // 4. GET /api/admin/pending
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/pending' && req.method === 'GET') {
      await memoryStore.syncFromCloud(true);
      if (atlasDb) {
        // Auto-heal approval status in Atlas
        try {
          const approvedTeams = await atlasDb.collection('teams').find({ isApproved: true }).toArray();
          for (const t of approvedTeams) {
            await atlasDb.collection('users').updateMany(
              { $or: [{ teamId: t._id }, { callsign: t.callsign }], isApproved: { $ne: true } },
              { $set: { isApproved: true } }
            );
          }
          const approvedUsers = await atlasDb.collection('users').find({ isApproved: true, teamId: { $ne: null } }).toArray();
          for (const u of approvedUsers) {
            await atlasDb.collection('teams').updateMany(
              { $or: [{ _id: u.teamId }, { callsign: u.callsign }], isApproved: { $ne: true } },
              { $set: { isApproved: true } }
            );
          }
        } catch(e){}

        const marshals = await atlasDb.collection('users').find({ isApproved: false, role: 'MEMBER' }).toArray();
        const teams = await atlasDb.collection('teams').find({ isApproved: false }).toArray();
        return sendJson(res, 200, {
          success: true,
          count: marshals.length + teams.length,
          users: marshals,
          teams: teams
        });
      }

      memoryStore.load();
      // Auto-heal approval status in memoryStore
      let autoHealed = false;
      memoryStore.collections.teams.forEach(t => {
        if (t.isApproved) {
          memoryStore.collections.users.forEach(u => {
            if ((u.teamId === t._id || (t.callsign && u.callsign && u.callsign.toLowerCase() === t.callsign.toLowerCase())) && !u.isApproved) {
              u.isApproved = true;
              autoHealed = true;
            }
          });
        }
      });
      memoryStore.collections.users.forEach(u => {
        if (u.isApproved && u.teamId) {
          memoryStore.collections.teams.forEach(t => {
            if ((t._id === u.teamId || (u.callsign && t.callsign && t.callsign.toLowerCase() === u.callsign.toLowerCase())) && !t.isApproved) {
              t.isApproved = true;
              autoHealed = true;
            }
          });
        }
      });
      if (autoHealed) memoryStore.save();

      const marshals = memoryStore.collections.users.filter(u => !u.isApproved && u.role === 'MEMBER');
      const teams = memoryStore.collections.teams.filter(t => !t.isApproved);
      return sendJson(res, 200, {
        success: true,
        count: marshals.length + teams.length,
        users: marshals,
        teams: teams
      });
    }

    // ─────────────────────────────────────────────────────────
    // 5. POST /api/admin/approve (Ultra-Resilient Approval)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/approve' && req.method === 'POST') {
      const body = await parseBody(req);
      const { type, id } = body;
      const cleanId = String(id || '').trim();
      const cleanType = String(type || '').trim().toUpperCase();

      if (!cleanId) {
        return sendJson(res, 400, { success: false, error: 'ID is required for clearance authorization.' });
      }

      if (atlasDb) {
        let approvedAny = false;
        let approvedName = cleanId;

        // Try team lookup
        const team = await atlasDb.collection('teams').findOne({
          $or: [{ _id: cleanId }, { id: cleanId }, { callsign: cleanId }, { name: cleanId }]
        });

        if (team) {
          approvedAny = true;
          approvedName = team.name || team.callsign;
          await atlasDb.collection('teams').updateOne({ _id: team._id }, { $set: { isApproved: true } });
          await atlasDb.collection('users').updateMany(
            { $or: [{ teamId: team._id }, { callsign: team.callsign }] },
            { $set: { isApproved: true } }
          );
        }

        // Try user lookup
        const user = await atlasDb.collection('users').findOne({
          $or: [{ _id: cleanId }, { id: cleanId }, { callsign: cleanId }]
        });

        if (user) {
          approvedAny = true;
          if (!approvedName || approvedName === cleanId) approvedName = user.name || user.callsign;
          await atlasDb.collection('users').updateOne({ _id: user._id }, { $set: { isApproved: true } });
          if (user.teamId) {
            await atlasDb.collection('teams').updateMany(
              { $or: [{ _id: user.teamId }, { callsign: user.callsign }] },
              { $set: { isApproved: true } }
            );
          }
        }

        if (approvedAny) {
          memoryStore.logEvent('APPROVE_CLEARANCE', 'Clearance authorized: ' + approvedName + ' (' + cleanId + ')');
          return sendJson(res, 200, { success: true, message: approvedName + ' approved successfully.', entityId: cleanId });
        }

        return sendJson(res, 404, { success: false, error: 'Entity "' + cleanId + '" not found in database.' });
      }

      memoryStore.load();
      let approvedAny = false;
      let approvedName = cleanId;
      let approvedRole = cleanType === 'MEMBER' ? 'MEMBER' : 'PLAYER';

      // 1. Search Teams
      const matchedTeams = memoryStore.collections.teams.filter(t => 
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

          memoryStore.collections.users.forEach(u => {
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

      // 2. Search Users
      const matchedUsers = memoryStore.collections.users.filter(u =>
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

          if (user.teamId) {
            memoryStore.collections.teams.forEach(t => {
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
        await memoryStore.syncToCloud();
        const logAction = approvedRole === 'MEMBER' ? 'APPROVE_USER' : 'APPROVE_TEAM';
        const logMsg = approvedRole === 'MEMBER'
          ? 'Field Marshal authorized: "' + approvedName + '" (' + cleanId + ')'
          : 'Squad authorized: "' + approvedName + '" (' + cleanId + ')';
        memoryStore.logEvent(logAction, logMsg);
        return sendJson(res, 200, { success: true, message: approvedName + ' authorized successfully.', entityId: cleanId });
      }

      return sendJson(res, 404, { success: false, error: 'Clearance entity "' + cleanId + '" not found in database.' });
    }

    // ─────────────────────────────────────────────────────────
    // 6. POST /api/admin/reject
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/reject' && req.method === 'POST') {
      const body = await parseBody(req);
      const { type, id } = body;

      if (atlasDb) {
        if (type === 'TEAM') {
          await atlasDb.collection('teams').deleteOne({ _id: id });
          await atlasDb.collection('users').deleteMany({ teamId: id });
        } else {
          await atlasDb.collection('users').deleteOne({ _id: id });
        }
        return sendJson(res, 200, { success: true, message: 'Entity rejected.' });
      }

      if (type === 'TEAM') {
        memoryStore.collections.teams = memoryStore.collections.teams.filter(t => t._id !== id);
        memoryStore.collections.users = memoryStore.collections.users.filter(u => u.teamId !== id);
      } else {
        memoryStore.collections.users = memoryStore.collections.users.filter(u => u._id !== id);
      }
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: 'Entity removed.' });
    }

    // ─────────────────────────────────────────────────────────
    // 6b. POST /api/admin/teams/reset-points
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/teams/reset-points' && req.method === 'POST') {
      const body = await parseBody(req);
      const teamId = body.teamId || body.id;

      if (!teamId) {
        return sendJson(res, 400, { success: false, error: 'Team ID is required.' });
      }

      if (atlasDb) {
        const team = await atlasDb.collection('teams').findOne({ $or: [{ _id: teamId }, { id: teamId }] });
        if (!team) return sendJson(res, 404, { success: false, error: 'Squad not found in database.' });

        const prevScore = team.score || 0;
        await atlasDb.collection('teams').updateOne(
          { _id: team._id },
          { $set: { score: 0, cards: [], visitedZones: [], currentClueIndex: 0 } }
        );
        await atlasDb.collection('checkins').deleteMany({ $or: [{ teamId: teamId }, { team: teamId }] });

        memoryStore.logEvent('RESET_POINTS', `Game Master reset points (was ${prevScore} PTS) and cleared progress for squad: "${team.name}" (${team._id})`);
        try {
          await atlasDb.collection('system_logs').insertOne({
            _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            action: 'RESET_POINTS',
            details: `Game Master reset points (was ${prevScore} PTS) for squad: "${team.name}"`,
            timestamp: new Date().toISOString()
          });
        } catch(e){}

        return sendJson(res, 200, { success: true, message: `Points and progress reset to 0 for squad "${team.name}".` });
      }

      const team = memoryStore.collections.teams.find(t => t._id === teamId || (t.id && t.id === teamId));
      if (!team) return sendJson(res, 404, { success: false, error: 'Squad not found in database.' });

      const prevScore = team.score || 0;
      team.score = 0;
      team.cards = [];
      team.visitedZones = [];
      team.currentClueIndex = 0;
      memoryStore.collections.checkins = (memoryStore.collections.checkins || []).filter(c => c.teamId !== teamId && c.team !== teamId);
      memoryStore.save();
      memoryStore.logEvent('RESET_POINTS', `Game Master reset points (was ${prevScore} PTS) and progress for squad: "${team.name}" (${team._id})`);
      return sendJson(res, 200, { success: true, message: `Points and progress reset to 0 for squad "${team.name}".` });
    }

    // ─────────────────────────────────────────────────────────
    // 6c. POST /api/admin/teams/remove
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/teams/remove' && req.method === 'POST') {
      const body = await parseBody(req);
      const teamId = body.teamId || body.id;

      if (!teamId) {
        return sendJson(res, 400, { success: false, error: 'Team ID is required.' });
      }

      if (atlasDb) {
        const team = await atlasDb.collection('teams').findOne({ $or: [{ _id: teamId }, { id: teamId }] });
        const teamName = team ? team.name : teamId;

        await atlasDb.collection('teams').deleteOne({ $or: [{ _id: teamId }, { id: teamId }] });
        await atlasDb.collection('users').deleteMany({ $or: [{ teamId: teamId }, { callsign: teamName }] });
        await atlasDb.collection('checkins').deleteMany({ $or: [{ teamId: teamId }, { team: teamId }] });

        memoryStore.logEvent('REMOVE_TEAM', `Game Master permanently removed squad: "${teamName}" (${teamId})`);
        try {
          await atlasDb.collection('system_logs').insertOne({
            _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            action: 'REMOVE_TEAM',
            details: `Game Master permanently removed squad: "${teamName}"`,
            timestamp: new Date().toISOString()
          });
        } catch(e){}

        return sendJson(res, 200, { success: true, message: `Squad "${teamName}" removed permanently.` });
      }

      const team = memoryStore.collections.teams.find(t => t._id === teamId || (t.id && t.id === teamId));
      const teamName = team ? team.name : teamId;

      memoryStore.collections.teams = memoryStore.collections.teams.filter(t => t._id !== teamId && t.id !== teamId);
      memoryStore.collections.users = memoryStore.collections.users.filter(u => u.teamId !== teamId && u.callsign !== teamName);
      memoryStore.collections.checkins = (memoryStore.collections.checkins || []).filter(c => c.teamId !== teamId && c.team !== teamId);
      memoryStore.save();
      memoryStore.logEvent('REMOVE_TEAM', `Game Master permanently removed squad: "${teamName}" (${teamId})`);
      return sendJson(res, 200, { success: true, message: `Squad "${teamName}" removed permanently.` });
    }

    // ─────────────────────────────────────────────────────────
    // 6d. GET /api/admin/logs
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/logs' && req.method === 'GET') {
      const limit = parseInt(urlObj.searchParams.get('limit'), 10) || 200;
      if (atlasDb) {
        const logs = await atlasDb.collection('system_logs').find().sort({ timestamp: -1 }).limit(limit).toArray();
        return sendJson(res, 200, { success: true, logs: logs, total: logs.length });
      }
      const logs = (memoryStore.collections.system_logs || []).slice(0, limit);
      return sendJson(res, 200, { success: true, logs: logs, total: (memoryStore.collections.system_logs || []).length });
    }

    // ─────────────────────────────────────────────────────────
    // 6e. POST /api/admin/logs/clear
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/logs/clear' && req.method === 'POST') {
      if (atlasDb) {
        await atlasDb.collection('system_logs').deleteMany({});
        await atlasDb.collection('system_logs').insertOne({
          _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          action: 'PURGE_LOGS',
          details: 'Game Master purged system audit logs.',
          timestamp: new Date().toISOString()
        });
        return sendJson(res, 200, { success: true, message: 'Audit logs cleared successfully.' });
      }
      const count = (memoryStore.collections.system_logs || []).length;
      memoryStore.collections.system_logs = [];
      memoryStore.logEvent('PURGE_LOGS', `Game Master purged ${count} system audit log entries.`);
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: 'Audit logs cleared successfully.' });
    }

    // ─────────────────────────────────────────────────────────
    // 7. GET /api/database/all
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/database/all' && req.method === 'GET') {
      if (atlasDb) {
        const users = await atlasDb.collection('users').find().toArray();
        const teams = await atlasDb.collection('teams').find().toArray();
        const clues = await atlasDb.collection('clues').find().toArray();
        const checkins = await atlasDb.collection('checkins').find().toArray();
        const logs = await atlasDb.collection('system_logs').find().limit(100).toArray();

        return sendJson(res, 200, {
          success: true,
          database: 'territory_grid',
          engine: 'MongoDB Atlas Cloud Cluster',
          connected: true,
          host: MONGODB_URI ? 'mongodb+srv://[Atlas Cluster]' : 'Local Memory Engine',
          stats: {
            usersCount: users.length,
            teamsCount: teams.length,
            cluesCount: clues.length,
            checkinsCount: checkins.length,
            logsCount: logs.length,
            storageSizeKb: Math.round((JSON.stringify({ users, teams, clues, checkins }).length) / 1024)
          },
          collections: {
            users,
            teams,
            clues,
            checkins,
            gameState: memoryStore.collections.gameState,
            system_logs: logs
          }
        });
      }

      return sendJson(res, 200, {
        success: true,
        database: 'territory_grid',
        engine: 'MongoDB Document Engine (Vercel Node)',
        connected: true,
        host: 'Vercel Serverless Engine',
        stats: {
          usersCount: memoryStore.collections.users.length,
          teamsCount: memoryStore.collections.teams.length,
          cluesCount: memoryStore.collections.clues.length,
          checkinsCount: memoryStore.collections.checkins.length,
          logsCount: memoryStore.collections.system_logs.length,
          storageSizeKb: 14
        },
        collections: memoryStore.collections
      });
    }

    // ─────────────────────────────────────────────────────────
    // 8. GET /api/database/export
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/database/export' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="territory_grid_mongodb_backup.json"'
      });
      return res.end(JSON.stringify(memoryStore.collections, null, 2));
    }

    // ─────────────────────────────────────────────────────────
    // 9. GET & POST /api/game/state (Synchronized 52-Minute Hunt & 10-Second Countdown Engine)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/game/state') {
      memoryStore.load();
      const now = Date.now();
      const gs = memoryStore.collections.gameState || { status: 'LOBBY' };
      if (!gs.durationMinutes) gs.durationMinutes = 52;
      if (!gs.durationSeconds) gs.durationSeconds = gs.durationMinutes * 60;

      // Auto-advance COUNTDOWN -> PLAYER_PHASE
      if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
        const cdEnd = new Date(gs.countdownEndsAt).getTime();
        if (now >= cdEnd) {
          gs.status = 'PLAYER_PHASE';
          if (!gs.startedAt) gs.startedAt = new Date(cdEnd).toISOString();
          if (!gs.endsAt) gs.endsAt = new Date(cdEnd + gs.durationSeconds * 1000).toISOString();
          memoryStore.save();
        }
      }

      // Auto-end match when 52 minutes expire
      if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
        const gameEnd = new Date(gs.endsAt).getTime();
        if (now >= gameEnd) {
          gs.status = 'ENDED';
          if (!gs.endedAt) gs.endedAt = new Date().toISOString();
          memoryStore.save();
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
        }, 'public, max-age=1, s-maxage=1, stale-while-revalidate=2', req);
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

          memoryStore.save();
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

          memoryStore.save();
        } else if (reqStatus === 'PAUSE' || reqStatus === 'PAUSED') {
          if (gs.status === 'PLAYER_PHASE') {
            gs.status = 'PAUSED';
            gs.pausedAt = new Date(now).toISOString();
            memoryStore.save();
          }
        } else if (reqStatus === 'RESUME') {
          if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
            const pauseDuration = now - new Date(gs.pausedAt).getTime();
            gs.totalPausedMs = (gs.totalPausedMs || 0) + pauseDuration;
            gs.endsAt = new Date(new Date(gs.endsAt).getTime() + pauseDuration).toISOString();
            gs.status = 'PLAYER_PHASE';
            gs.pausedAt = null;
            memoryStore.save();
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

          memoryStore.save();
        } else if (reqStatus === 'ENDED') {
          gs.status = 'ENDED';
          gs.endedAt = new Date(now).toISOString();
          memoryStore.save();
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

function ensureUniqueTeamCodes(teams) {
  if (!Array.isArray(teams)) return [];
  const usedCodes = new Set();

  // Pass 1: Prioritize teams with numeric names/callsigns (e.g. team1 -> 11, team2 -> 12)
  teams.forEach(t => {
    const numMatch = (t.name || t.callsign || '').match(/\d+/);
    if (numMatch && numMatch[0]) {
      const n = parseInt(numMatch[0], 10);
      const code = (n >= 1 && n <= 89) ? (10 + n) : (n >= 11 && n <= 99 ? n : null);
      if (code && !usedCodes.has(code)) {
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
    }
  });
  return teams;
}

    // ─────────────────────────────────────────────────────────
    // 10. GET /api/teams
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/teams' && req.method === 'GET') {
      if (atlasDb) {
        const rawTeams = await atlasDb.collection('teams').find().toArray();
        const teams = ensureUniqueTeamCodes(rawTeams);
        return sendJson(res, 200, { success: true, teams }, 'public, max-age=1, s-maxage=1, stale-while-revalidate=1', req);
      }
      memoryStore.load();
      ensureUniqueTeamCodes(memoryStore.collections.teams);
      return sendJson(res, 200, { success: true, teams: memoryStore.collections.teams }, 'public, max-age=1, s-maxage=1, stale-while-revalidate=1', req);
    }

    // ─────────────────────────────────────────────────────────
    // 10b. GET /api/clues (Mission Directives & Checkpoint Places)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/clues' && req.method === 'GET') {
      const showAll = query.all === 'true' || query.role === 'ADMIN' || query.role === 'MEMBER';

      if (atlasDb) {
        const rawClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        const marshals = await atlasDb.collection('users').find({ role: 'MEMBER', zoneId: { $ne: null } }).toArray();
        const activeZoneMap = {};
        marshals.forEach(m => {
          const z = (m.zoneId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (!activeZoneMap[z]) activeZoneMap[z] = [];
          activeZoneMap[z].push(m.callsign || m.name);
        });

        const allClues = rawClues.map(c => {
          const z = (c.zoneId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          const assignedMarshals = activeZoneMap[z] || [];
          return {
            ...c,
            hasMarshal: assignedMarshals.length > 0,
            marshals: assignedMarshals,
            marshalCount: assignedMarshals.length
          };
        });

        if (showAll || allClues.filter(c => c.hasMarshal).length === 0) {
          return sendJson(res, 200, {
            success: true,
            clues: allClues,
            totalCount: allClues.length,
            activeCount: allClues.filter(c => c.hasMarshal).length
          });
        }

        const playerClues = allClues.filter(c => c.hasMarshal);
        return sendJson(res, 200, {
          success: true,
          clues: playerClues.length > 0 ? playerClues : allClues,
          totalCount: playerClues.length,
          allPlacesCount: allClues.length,
          waitingForMarshals: false
        });
      }

      memoryStore.load();
      const marshals = (memoryStore.collections.users || []).filter(u => u.role === 'MEMBER' && u.zoneId);
      const activeZoneMap = {};
      marshals.forEach(m => {
        const z = (m.zoneId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!activeZoneMap[z]) activeZoneMap[z] = [];
        activeZoneMap[z].push(m.callsign || m.name);
      });

      const allClues = (memoryStore.collections.clues || []).map(c => {
        const z = (c.zoneId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const assignedMarshals = activeZoneMap[z] || [];
        return {
          ...c,
          hasMarshal: assignedMarshals.length > 0,
          marshals: assignedMarshals,
          marshalCount: assignedMarshals.length
        };
      });

      if (showAll || allClues.filter(c => c.hasMarshal).length === 0) {
        return sendJson(res, 200, {
          success: true,
          clues: allClues,
          totalCount: allClues.length,
          activeCount: allClues.filter(c => c.hasMarshal).length
        });
      }

      const playerClues = allClues.filter(c => c.hasMarshal);
      return sendJson(res, 200, {
        success: true,
        clues: playerClues.length > 0 ? playerClues : allClues,
        totalCount: playerClues.length,
        allPlacesCount: allClues.length,
        waitingForMarshals: false
      });
    }

    // ─────────────────────────────────────────────────────────
    // 10c. POST /api/admin/clues/save (Create or Update Zone Place)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/clues/save' && req.method === 'POST') {
      const body = await parseBody(req);
      const { _id, zoneId, zoneLabel, text } = body;

      if (!zoneId || !zoneLabel || !text) {
        return sendJson(res, 400, { success: false, error: 'Zone ID, Place Name, and Clue Hint are required.' });
      }

      const cleanZoneId = zoneId.trim().toUpperCase();
      const cleanLabel = zoneLabel.trim();
      const cleanText = text.trim();

      if (atlasDb) {
        const cluesCol = atlasDb.collection('clues');
        if (_id) {
          await cluesCol.updateOne({ _id: _id }, { $set: { zoneId: cleanZoneId, zoneLabel: cleanLabel, text: cleanText } });
        } else {
          const newId = 'clue_' + Date.now().toString(36);
          await cluesCol.insertOne({ _id: newId, zoneId: cleanZoneId, zoneLabel: cleanLabel, text: cleanText });
        }
        const updatedClues = await cluesCol.find().sort({ zoneId: 1 }).toArray();
        return sendJson(res, 200, { success: true, message: 'Place saved successfully.', clues: updatedClues });
      }

      memoryStore.load();
      if (_id) {
        const existing = memoryStore.collections.clues.find(c => c._id === _id);
        if (existing) {
          existing.zoneId = cleanZoneId;
          existing.zoneLabel = cleanLabel;
          existing.text = cleanText;
        }
      } else {
        const newId = 'clue_' + Date.now().toString(36);
        memoryStore.collections.clues.push({ _id: newId, zoneId: cleanZoneId, zoneLabel: cleanLabel, text: cleanText });
      }
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: 'Place saved successfully.', clues: memoryStore.collections.clues });
    }

    // ─────────────────────────────────────────────────────────
    // 10d. POST /api/admin/clues/delete (Delete Zone Place)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/clues/delete' && req.method === 'POST') {
      const body = await parseBody(req);
      const { _id } = body;

      if (atlasDb) {
        await atlasDb.collection('clues').deleteOne({ _id: _id });
        const updatedClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        return sendJson(res, 200, { success: true, message: 'Place deleted successfully.', clues: updatedClues });
      }

      memoryStore.load();
      memoryStore.collections.clues = memoryStore.collections.clues.filter(c => c._id !== _id);
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: 'Place deleted successfully.', clues: memoryStore.collections.clues });
    }

    // ─────────────────────────────────────────────────────────
    // 10f. POST /api/admin/clues/clear (Clear all places for clean manual setup)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/clues/clear' && req.method === 'POST') {
      if (atlasDb) {
        await atlasDb.collection('clues').deleteMany({});
        return sendJson(res, 200, { success: true, message: 'All campus places cleared successfully.', clues: [] });
      }

      memoryStore.load();
      memoryStore.collections.clues = [];
      memoryStore.save();
      memoryStore.logEvent('CLEAR_PLACES', 'Game Master cleared all campus places.');
      return sendJson(res, 200, { success: true, message: 'All campus places cleared successfully.', clues: [] });
    }

    // ─────────────────────────────────────────────────────────
    // 10e. POST /api/admin/clues/reset (Reset or Set Number of Zones)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/clues/reset' && req.method === 'POST') {
      const body = await parseBody(req);
      const targetCount = parseInt(body.count, 10) || 13;

      const newClues = [];
      for (let i = 1; i <= targetCount; i++) {
        const numStr = String(i).padStart(2, '0');
        const defaultMatch = DEFAULT_CLUES[i - 1];
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

      if (atlasDb) {
        const cluesCol = atlasDb.collection('clues');
        await cluesCol.deleteMany({});
        await cluesCol.insertMany(newClues);
        return sendJson(res, 200, { success: true, message: `Configured ${targetCount} zones successfully.`, clues: newClues });
      }

      memoryStore.load();
      memoryStore.collections.clues = newClues;
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: `Configured ${targetCount} zones successfully.`, clues: newClues });
    }

    // ─────────────────────────────────────────────────────────
    // 11. POST /api/checkin (Real-time Point Allocation & Hint Advancement)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/checkin' && req.method === 'POST') {
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
            return sendJson(res, 400, { success: false, error: `Squad code (${tt}) does not match any registered team.` });
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

      const coneValues = { RED: 10, YELLOW: 12, GREEN: 15 };
      const conePts = coneValues[cone] || 12;
      const rankPts = parseInt(cardRank, 10) || 13;
      const totalPoints = conePts + rankPts;
      const checkinId = `${teamId}_${zoneId}_${Date.now()}`;

      if (atlasDb) {
        const teamsCol = atlasDb.collection('teams');
        const checkinsCol = atlasDb.collection('checkins');

        const team = await teamsCol.findOne({ $or: [{ _id: teamId }, { callsign: new RegExp('^' + teamId + '$', 'i') }] });
        if (!team) return sendJson(res, 404, { success: false, error: 'Team not found.' });
        if (!team.isApproved) return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });
        
        if (team.visitedZones && team.visitedZones.includes(zoneId) && !allowDuplicate) {
          return sendJson(res, 400, {
            success: false,
            alreadyVisited: true,
            error: `Squad "${team.name}" has already cleared ${zoneId}! Current objective is Checkpoint #${(team.currentClueIndex || 0) + 1}.`
          });
        }

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

        await checkinsCol.insertOne(checkinRecord);
        await teamsCol.updateOne(
          { _id: team._id },
          {
            $inc: { score: totalPoints, currentClueIndex: 1 },
            $push: {
              cards: { rank: rankPts, suit: cardSuit || '♠', zoneId, awardedAt: new Date().toISOString() },
              visitedZones: zoneId
            },
            $set: { updatedAt: new Date().toISOString() }
          }
        );

        const updatedTeam = await teamsCol.findOne({ _id: team._id });
        return sendJson(res, 200, {
          success: true,
          pointsAwarded: totalPoints,
          teamScore: updatedTeam.score,
          teamName: updatedTeam.name || updatedTeam.callsign,
          nextClueIndex: updatedTeam.currentClueIndex
        });
      }

      // Memory Store
      memoryStore.load();
      const team = memoryStore.collections.teams.find(t => 
        t._id === teamId || (t.callsign && t.callsign.toLowerCase() === (teamId || '').toLowerCase())
      );
      if (!team) return sendJson(res, 404, { success: false, error: 'Team not found.' });
      if (!team.isApproved) return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });
      
      if (team.visitedZones && team.visitedZones.includes(zoneId) && !allowDuplicate) {
        return sendJson(res, 400, {
          success: false,
          alreadyVisited: true,
          error: `Squad "${team.name}" has already cleared ${zoneId}! Current objective is Checkpoint #${(team.currentClueIndex || 0) + 1}.`
        });
      }

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

      memoryStore.collections.checkins = memoryStore.collections.checkins || [];
      memoryStore.collections.checkins.push(checkinRecord);
      team.score = (team.score || 0) + totalPoints;
      team.cards = team.cards || [];
      team.cards.push({ rank: rankPts, suit: cardSuit || '♠', zoneId, awardedAt: new Date().toISOString() });
      team.visitedZones = team.visitedZones || [];
      if (!team.visitedZones.includes(zoneId)) team.visitedZones.push(zoneId);
      team.currentClueIndex = (team.currentClueIndex || 0) + 1;
      team.updatedAt = new Date().toISOString();

      await memoryStore.syncToCloud();
      memoryStore.logEvent('CHECKIN', `Team "${team.name}" awarded +${totalPoints} PTS at ${zoneId} (Total: ${team.score} PTS)`);

      return sendJson(res, 200, {
        success: true,
        pointsAwarded: totalPoints,
        teamScore: team.score,
        teamName: team.name || team.callsign,
        nextClueIndex: team.currentClueIndex
      });
    }

    return sendJson(res, 404, { success: false, error: 'API endpoint not found: ' + pathname });
  } catch (err) {
    console.error('Serverless Error:', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
};
