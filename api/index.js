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
// In-Memory / File-based Document Engine (Fallback Mode)
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
        startedAt: null,
        endedAt: null,
        pausedAt: null,
        totalPausedMs: 0
      },
      system_logs: [
        {
          _id: 'log_init',
          action: 'SYSTEM_INIT',
          details: 'Territory Grid Vercel Engine active.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.collections = JSON.parse(raw);
      }
    } catch (e) {
      // keep defaults
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {
      // ignore in read-only environments
    }
  }

  logEvent(action, details) {
    this.collections.system_logs.unshift({
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (this.collections.system_logs.length > 200) this.collections.system_logs.pop();
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
    const cluesCol = mongoDbInstance.collection('clues');
    const clueCount = await cluesCol.countDocuments();
    if (clueCount === 0) {
      await cluesCol.insertMany(DEFAULT_CLUES);
    }

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
      memoryStore.save();
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
      const userId = parsedUrl.query.id;
      const callsign = parsedUrl.query.callsign;

      if (atlasDb) {
        const query = userId ? { _id: userId } : { callsign: new RegExp('^' + callsign + '$', 'i') };
        const user = await atlasDb.collection('users').findOne(query);
        if (!user) return sendJson(res, 404, { success: false, error: 'User not found.' });
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

      const user = memoryStore.collections.users.find(u => 
        (userId && u._id === userId) || (callsign && u.callsign.toLowerCase() === callsign.toLowerCase())
      );
      if (!user) return sendJson(res, 404, { success: false, error: 'User not found.' });

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

    // ─────────────────────────────────────────────────────────
    // 4. GET /api/admin/pending
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/pending' && req.method === 'GET') {
      if (atlasDb) {
        const users = await atlasDb.collection('users').find({ isApproved: false, role: { $ne: 'ADMIN' } }).toArray();
        const teams = await atlasDb.collection('teams').find({ isApproved: false }).toArray();
        return sendJson(res, 200, {
          success: true,
          count: users.length + teams.length,
          users: users,
          teams: teams
        });
      }

      const users = memoryStore.collections.users.filter(u => !u.isApproved && u.role !== 'ADMIN');
      const teams = memoryStore.collections.teams.filter(t => !t.isApproved);
      return sendJson(res, 200, {
        success: true,
        count: users.length + teams.length,
        users,
        teams
      });
    }

    // ─────────────────────────────────────────────────────────
    // 5. POST /api/admin/approve
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/approve' && req.method === 'POST') {
      const body = await parseBody(req);
      const { type, id } = body;

      if (atlasDb) {
        if (type === 'TEAM') {
          await atlasDb.collection('teams').updateOne({ _id: id }, { $set: { isApproved: true } });
          await atlasDb.collection('users').updateMany({ teamId: id }, { $set: { isApproved: true } });
        } else {
          const user = await atlasDb.collection('users').findOne({ _id: id });
          if (user) {
            await atlasDb.collection('users').updateOne({ _id: id }, { $set: { isApproved: true } });
            if (user.teamId) {
              await atlasDb.collection('teams').updateOne({ _id: user.teamId }, { $set: { isApproved: true } });
            }
          }
        }
        return sendJson(res, 200, { success: true, message: 'Entity approved successfully.' });
      }

      if (type === 'TEAM') {
        const team = memoryStore.collections.teams.find(t => t._id === id);
        if (team) {
          team.isApproved = true;
          memoryStore.collections.users.forEach(u => {
            if (u.teamId === id) u.isApproved = true;
          });
          memoryStore.save();
          return sendJson(res, 200, { success: true, message: `Squad "${team.name}" approved.` });
        }
      } else {
        const user = memoryStore.collections.users.find(u => u._id === id);
        if (user) {
          user.isApproved = true;
          if (user.teamId) {
            const team = memoryStore.collections.teams.find(t => t._id === user.teamId);
            if (team) team.isApproved = true;
          }
          memoryStore.save();
          return sendJson(res, 200, { success: true, message: `Operative "${user.callsign}" approved.` });
        }
      }

      return sendJson(res, 404, { success: false, error: 'Entity not found.' });
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
    // 9. GET & POST /api/game/state
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/game/state') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, state: memoryStore.collections.gameState });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (body.status) {
          memoryStore.collections.gameState.status = body.status;
          if (body.status === 'PLAYER_PHASE' && !memoryStore.collections.gameState.startedAt) {
            memoryStore.collections.gameState.startedAt = new Date().toISOString();
          }
          if (body.status === 'ENDED') {
            memoryStore.collections.gameState.endedAt = new Date().toISOString();
          }
          memoryStore.save();
        }
        return sendJson(res, 200, { success: true, state: memoryStore.collections.gameState });
      }
    }

    // ─────────────────────────────────────────────────────────
    // 10. GET /api/teams
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/teams' && req.method === 'GET') {
      if (atlasDb) {
        const teams = await atlasDb.collection('teams').find().toArray();
        return sendJson(res, 200, { success: true, teams });
      }
      return sendJson(res, 200, { success: true, teams: memoryStore.collections.teams });
    }

    // ─────────────────────────────────────────────────────────
    // 10b. GET /api/clues
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/clues' && req.method === 'GET') {
      if (atlasDb) {
        const clues = await atlasDb.collection('clues').find().toArray();
        return sendJson(res, 200, { success: true, clues });
      }
      return sendJson(res, 200, { success: true, clues: memoryStore.collections.clues });
    }

    // ─────────────────────────────────────────────────────────
    // 11. POST /api/checkin
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/checkin' && req.method === 'POST') {
      const body = await parseBody(req);
      const { teamId, zoneId, cone, cardRank, cardSuit, memberId } = body;

      const coneValues = { RED: 10, YELLOW: 12, GREEN: 15 };
      const conePts = coneValues[cone] || 10;
      const rankPts = parseInt(cardRank, 10) || 1;
      const totalPoints = conePts + rankPts;
      const checkinId = `${teamId}_${zoneId}`;

      if (atlasDb) {
        const teamsCol = atlasDb.collection('teams');
        const checkinsCol = atlasDb.collection('checkins');

        const team = await teamsCol.findOne({ _id: teamId });
        if (!team) return sendJson(res, 404, { success: false, error: 'Team not found.' });
        if (!team.isApproved) return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });
        if (team.visitedZones && team.visitedZones.includes(zoneId)) {
          return sendJson(res, 400, { success: false, error: 'Team has already completed checkpoint for this zone.' });
        }

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

        await checkinsCol.insertOne(checkinRecord);
        await teamsCol.updateOne(
          { _id: teamId },
          {
            $inc: { score: totalPoints, currentClueIndex: 1 },
            $push: {
              cards: { rank: rankPts, suit: cardSuit || '♠', zoneId },
              visitedZones: zoneId
            },
            $set: { updatedAt: new Date().toISOString() }
          }
        );

        const updatedTeam = await teamsCol.findOne({ _id: teamId });
        return sendJson(res, 200, {
          success: true,
          pointsAwarded: totalPoints,
          teamScore: updatedTeam.score,
          nextClueIndex: updatedTeam.currentClueIndex
        });
      }

      // Memory Store
      const team = memoryStore.collections.teams.find(t => t._id === teamId);
      if (!team) return sendJson(res, 404, { success: false, error: 'Team not found.' });
      if (!team.isApproved) return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });
      if (team.visitedZones && team.visitedZones.includes(zoneId)) {
        return sendJson(res, 400, { success: false, error: 'Team has already completed checkpoint for this zone.' });
      }

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

      memoryStore.collections.checkins.push(checkinRecord);
      team.score = (team.score || 0) + totalPoints;
      team.cards = team.cards || [];
      team.cards.push({ rank: rankPts, suit: cardSuit || '♠', zoneId });
      team.visitedZones = team.visitedZones || [];
      team.visitedZones.push(zoneId);
      team.currentClueIndex = (team.currentClueIndex || 0) + 1;
      team.updatedAt = new Date().toISOString();

      memoryStore.save();
      memoryStore.logEvent('CHECKIN', `Team "${team.name}" awarded ${totalPoints} PTS at ${zoneId}`);

      return sendJson(res, 200, {
        success: true,
        pointsAwarded: totalPoints,
        teamScore: team.score,
        nextClueIndex: team.currentClueIndex
      });
    }

    return sendJson(res, 404, { success: false, error: 'API endpoint not found: ' + pathname });
  } catch (err) {
    console.error('Serverless Error:', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
};
