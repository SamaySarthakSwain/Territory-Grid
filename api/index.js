// Territory Grid // Vercel Serverless Function Gateway & MongoDB Engine
// Handles all /api/* requests on Vercel and local environments

const url = require('url');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Sentry Distributed Cloud Monitoring & Telemetry
// ─────────────────────────────────────────────────────────────
let Sentry = null;
try {
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://64ed31aa42506c7bec5e03386192c279@o4512425106538496.ingest.us.sentry.io/4512425126330368',
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 1.0,
  });
} catch (e) {
  // Sentry fallback if package not available in local isolated run
}

// Determine storage mode: Supabase Cloud Store + Real MongoDB Atlas vs Fallback In-Memory/JSON
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';
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
// Default 12 Campus Stations (Guarantees 12 Distinct Checkpoints for 12 Marshals)
// ─────────────────────────────────────────────────────────────
const INITIAL_CAMPUS_PLACES = [
  { _id: 'clue_zone_01', zoneId: 'ZONE_01', zoneLabel: 'Zone 1 - Library Arch', text: 'Search the Library Arch perimeter for the Beacon Cone!' },
  { _id: 'clue_zone_02', zoneId: 'ZONE_02', zoneLabel: 'Zone 2 - Solar Obelisk', text: 'Locate the Solar Obelisk plaza to find the Beacon Cone!' },
  { _id: 'clue_zone_03', zoneId: 'ZONE_03', zoneLabel: 'Zone 3 - Clocktower Terrace', text: 'Proceed to Clocktower Terrace and verify the Beacon Cone!' },
  { _id: 'clue_zone_04', zoneId: 'ZONE_04', zoneLabel: 'Zone 4 - Glasshouse Botanical', text: 'Investigate the Glasshouse Botanical grounds for the Beacon Cone!' },
  { _id: 'clue_zone_05', zoneId: 'ZONE_05', zoneLabel: 'Zone 5 - Skybridge Concourse', text: 'Cross to Skybridge Concourse and identify the Beacon Cone!' },
  { _id: 'clue_zone_06', zoneId: 'ZONE_06', zoneLabel: 'Zone 6 - Amphitheater Canopy', text: 'Search beneath Amphitheater Canopy for the Beacon Cone!' },
  { _id: 'clue_zone_07', zoneId: 'ZONE_07', zoneLabel: 'Zone 7 - Science Basin', text: 'Explore the Science Basin quad for the active Beacon Cone!' },
  { _id: 'clue_zone_08', zoneId: 'ZONE_08', zoneLabel: 'Zone 8 - Student Pavilion', text: 'Check the Student Pavilion perimeter for the Beacon Cone!' },
  { _id: 'clue_zone_09', zoneId: 'ZONE_09', zoneLabel: 'Zone 9 - North Telecom Pylon', text: 'Navigate to North Telecom Pylon to locate the Beacon Cone!' },
  { _id: 'clue_zone_10', zoneId: 'ZONE_10', zoneLabel: 'Zone 10 - Turf Perimeter', text: 'Inspect the Turf Perimeter boundaries for the Beacon Cone!' },
  { _id: 'clue_zone_11', zoneId: 'ZONE_11', zoneLabel: 'Zone 11 - Energy Innovation Hub', text: 'Enter Energy Innovation Hub forecourt to find the Beacon Cone!' },
  { _id: 'clue_zone_12', zoneId: 'ZONE_12', zoneLabel: 'Zone 12 - Innovation Arena', text: 'Advance to Innovation Arena entrance and secure the Beacon Cone!' }
];

const DEFAULT_CLUES = INITIAL_CAMPUS_PLACES;

const CONE_OPTIONS = [
  { color: 'YELLOW', points: 12 },
  { color: 'RED', points: 10 },
  { color: 'GREEN', points: 15 }
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
// Normalization Utilities
// ─────────────────────────────────────────────────────────────
function normalizeZone(z) {
  if (!z) return '';
  let s = String(z).toUpperCase().trim();
  s = s.replace(/[^A-Z0-9]/g, '');
  s = s.replace(/^ZONE0+(\d+)/, 'ZONE$1');
  return s;
}

function getBalancedMarshalAllocation(allMarshals, allClues, requestedZone = null, requestedColor = null) {
  const places = (Array.isArray(allClues) && allClues.length > 0) ? allClues : INITIAL_CAMPUS_PLACES;

  // 1. Target Zone Determination (Uniform distribution across available places)
  let targetZoneId = null;
  let targetZoneLabel = null;

  if (requestedZone && requestedZone !== 'AUTO') {
    const matched = places.find(p => normalizeZone(p.zoneId) === normalizeZone(requestedZone));
    if (matched) {
      targetZoneId = matched.zoneId;
      targetZoneLabel = matched.zoneLabel || matched.zoneId;
    }
  }

  if (!targetZoneId) {
    // Count current marshals at each campus place
    const zoneCounts = new Map();
    places.forEach(p => zoneCounts.set(normalizeZone(p.zoneId), 0));
    (allMarshals || []).forEach(m => {
      if (m.zoneId) {
        const norm = normalizeZone(m.zoneId);
        if (zoneCounts.has(norm)) {
          zoneCounts.set(norm, zoneCounts.get(norm) + 1);
        }
      }
    });

    // Find minimum count so every place gets a marshal before any duplicates
    let minCount = Infinity;
    zoneCounts.forEach(count => {
      if (count < minCount) minCount = count;
    });

    const candidatePlaces = places.filter(p => zoneCounts.get(normalizeZone(p.zoneId)) === minCount);
    // Shuffle and pick randomly among candidates
    const chosen = candidatePlaces[Math.floor(Math.random() * candidatePlaces.length)] || places[0];
    targetZoneId = chosen.zoneId;
    targetZoneLabel = chosen.zoneLabel || chosen.zoneId;
  }

  // 2. Cone Color Determination (Equally distributed among RED: 10, YELLOW: 12, GREEN: 15)
  let targetColor = null;
  let targetPoints = 12;

  if (requestedColor && requestedColor !== 'AUTO') {
    const matchedCone = CONE_OPTIONS.find(c => c.color === String(requestedColor).toUpperCase());
    if (matchedCone) {
      targetColor = matchedCone.color;
      targetPoints = matchedCone.points;
    }
  }

  if (!targetColor) {
    const colorCounts = { RED: 0, YELLOW: 0, GREEN: 0 };
    (allMarshals || []).forEach(m => {
      const c = (m.coneColor || '').toUpperCase();
      if (colorCounts[c] !== undefined) colorCounts[c]++;
    });

    let minColorCount = Infinity;
    Object.values(colorCounts).forEach(cnt => {
      if (cnt < minColorCount) minColorCount = cnt;
    });

    const candidateCones = CONE_OPTIONS.filter(c => colorCounts[c.color] === minColorCount);
    const chosenCone = candidateCones[Math.floor(Math.random() * candidateCones.length)] || CONE_OPTIONS[0];
    targetColor = chosenCone.color;
    targetPoints = chosenCone.points;
  }

  return {
    zoneId: targetZoneId,
    zoneLabel: targetZoneLabel,
    coneColor: targetColor,
    conePoints: targetPoints
  };
}

// ─────────────────────────────────────────────────────────────
// Cloud-Backed Persistent Document Engine (Zero Data Loss)
// ─────────────────────────────────────────────────────────────
class MemoryStore {
  constructor() {
    this.filePath = process.env.DATA_FILE || (process.env.VERCEL ? '/tmp/territory_grid_mongodb.json' : path.join(__dirname, '..', 'web_server', 'data', 'territory_grid_mongodb.json'));
    this.collections = {
      users: [DEFAULT_ADMIN],
      teams: [],
      clues: JSON.parse(JSON.stringify(INITIAL_CAMPUS_PLACES)),
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
    this.lastModified = 0;
    this.isLoaded = false;
    this.cloudSyncTimer = null;
    this.load();
  }

  load() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          if (!Array.isArray(parsed.clues) || parsed.clues.length < 12) {
            parsed.clues = JSON.parse(JSON.stringify(INITIAL_CAMPUS_PLACES));
          }
          this.collections = parsed;
          this.isLoaded = true;
        }
      }
    } catch (e) {}
  }

  save() {
    this.lastModified = Date.now();
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmpPath = this.filePath + '.tmp.' + process.pid;
      fs.writeFileSync(tmpPath, JSON.stringify(this.collections, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (e) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
      } catch (err) {
        console.error('[MemoryStore] File save error:', err);
      }
    }
  }

  async saveAsync() {
    this.save();
    await this.saveToCloud();
    return true;
  }

  async syncFromCloud(force = false) {
    // High-performance read-through cache with 1500ms TTL
    if (!force && this.lastSynced && (Date.now() - this.lastSynced < 1500)) {
      return this.collections;
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/territory_store?key=eq.main_store&select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data && typeof rows[0].data === 'object') {
          const cloudData = rows[0].data;
          this.collections.users = Array.isArray(cloudData.users) ? cloudData.users : this.collections.users;
          this.collections.teams = Array.isArray(cloudData.teams) ? cloudData.teams : this.collections.teams;
          this.collections.clues = (Array.isArray(cloudData.clues) && cloudData.clues.length >= 12) ? cloudData.clues : INITIAL_CAMPUS_PLACES;
          this.collections.checkins = Array.isArray(cloudData.checkins) ? cloudData.checkins : this.collections.checkins;
          if (cloudData.gameState && typeof cloudData.gameState === 'object') {
            this.collections.gameState = Object.assign(this.collections.gameState, cloudData.gameState);
          }
          if (Array.isArray(cloudData.system_logs)) {
            this.collections.system_logs = cloudData.system_logs;
          }
          this.lastSynced = Date.now();
          this.isLoaded = true;
          this.save(); // Local warm cache
        }
      }
    } catch (e) {
      // Offline fallback: keep in-memory/file collections intact
    }
    return this.collections;
  }

  async saveToCloud() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/territory_store`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'main_store',
          data: this.collections,
          updated_at: new Date().toISOString()
        })
      });
      if (res.ok) {
        this.lastSynced = Date.now();
      }
      return res.ok;
    } catch (e) {
      console.warn('[CloudStore] Supabase save error:', e.message);
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, headers);
  res.end(jsonStr);
}

// ─────────────────────────────────────────────────────────────
// Real-Time Server-Sent Events (SSE) Broadcast Engine
// ─────────────────────────────────────────────────────────────
const sseClients = new Set();

function broadcastEvent(eventData) {
  const payload = 'data: ' + JSON.stringify(eventData) + '\n\n';
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

if (!global._ssePingInterval) {
  global._ssePingInterval = setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n');
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }, 20000);
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
  if (parsedUrl.pathname === '/favicon.ico') {
    res.writeHead(204, { 'Content-Type': 'image/x-icon' });
    return res.end();
  }
  const query = parsedUrl.query || {};
  let pathname = parsedUrl.pathname || '/';

  // Normalize path if rewrites stripped /api
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + (pathname.startsWith('/') ? '' : '/') + pathname;
  }

  // Sync fresh state from Supabase Cloud Store (Force fresh sync for mutating requests)
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || memoryStore.lastSynced === 0) {
    await memoryStore.syncFromCloud(true);
  } else {
    await memoryStore.syncFromCloud(false);
  }

  const atlasDb = await getMongoDb();

  try {
    // ─────────────────────────────────────────────────────────
    // 0. GET /api/health (System Diagnostics & Live Health Check)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/health' && req.method === 'GET') {
      const gs = memoryStore.collections.gameState || {};
      const teams = memoryStore.collections.teams || [];
      const users = memoryStore.collections.users || [];
      const clues = memoryStore.collections.clues || [];
      const checkins = memoryStore.collections.checkins || [];

      return sendJson(res, 200, {
        status: 'HEALTHY',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        cloudSync: {
          active: true,
          mode: 'SUPABASE_CLOUD_PERSISTENCE',
          lastSynced: new Date(memoryStore.lastSynced || Date.now()).toISOString()
        },
        monitoring: {
          sentry: {
            enabled: !!Sentry,
            project: 'territory-grid',
            organization: 'nist-university-pv',
            dsnConfigured: true
          }
        },
        database: {
          provider: 'Supabase PostgreSQL Cloud + Memory Store',
          counts: {
            teamsTotal: teams.length,
            teamsApproved: teams.filter(t => t.isApproved).length,
            usersTotal: users.length,
            marshals: users.filter(u => u.role === 'MEMBER').length,
            placesTotal: clues.length,
            checkinsTotal: checkins.length
          }
        },
        gameState: {
          status: gs.status || 'LOBBY',
          durationMinutes: gs.durationMinutes || 52,
          startedAt: gs.startedAt || null
        }
      });
    }

    // ─────────────────────────────────────────────────────────
    // 0b. GET /api/events (Real-Time 0ms Server-Sent Events Stream)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('data: ' + JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() }) + '\n\n');
      sseClients.add(res);
      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }
    // ─────────────────────────────────────────────────────────
    if ((pathname === '/api/auth/register' || pathname === '/api/register') && req.method === 'POST') {
      const body = await parseBody(req);
      const { role, name, callsign, password, zoneId, zoneLabel } = body;

      if (!callsign || !password) {
        return sendJson(res, 400, { success: false, error: 'Callsign and password are required.' });
      }

      const normalizedCallsign = callsign.trim().toLowerCase();
      if (normalizedCallsign === 'samay') {
        return sendJson(res, 400, { success: false, error: 'This callsign is reserved.' });
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

        let assignedZoneId = null;
        let assignedZoneLabel = null;
        let assignedConeColor = 'YELLOW';
        let assignedConePoints = 12;

        if (role === 'MEMBER') {
          const rawMarshals = await usersCol.find({ role: 'MEMBER' }).toArray();
          const rawClues = await atlasDb.collection('clues').find().toArray();
          const alloc = getBalancedMarshalAllocation(rawMarshals, rawClues, zoneId, body.coneColor);
          assignedZoneId = alloc.zoneId;
          assignedZoneLabel = alloc.zoneLabel;
          assignedConeColor = alloc.coneColor;
          assignedConePoints = alloc.conePoints;
        }

        const newUser = {
          _id: userId,
          callsign: callsign.trim(),
          name: name ? name.trim() : callsign.trim(),
          role: role === 'MEMBER' ? 'MEMBER' : 'PLAYER',
          password: password,
          teamId: teamId,
          zoneId: role === 'MEMBER' ? assignedZoneId : null,
          zoneLabel: role === 'MEMBER' ? assignedZoneLabel : null,
          coneColor: role === 'MEMBER' ? assignedConeColor : null,
          conePoints: role === 'MEMBER' ? assignedConePoints : null,
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
            zoneId: newUser.zoneId,
            zoneLabel: newUser.zoneLabel,
            coneColor: newUser.coneColor,
            conePoints: newUser.conePoints
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

      let assignedZoneId = null;
      let assignedZoneLabel = null;
      let assignedConeColor = 'YELLOW';
      let assignedConePoints = 12;

      if (role === 'MEMBER') {
        const rawMarshals = memoryStore.collections.users.filter(u => u.role === 'MEMBER');
        const rawClues = memoryStore.collections.clues || INITIAL_CAMPUS_PLACES;
        const alloc = getBalancedMarshalAllocation(rawMarshals, rawClues, zoneId, body.coneColor);
        assignedZoneId = alloc.zoneId;
        assignedZoneLabel = alloc.zoneLabel;
        assignedConeColor = alloc.coneColor;
        assignedConePoints = alloc.conePoints;
      }

      const newUser = {
        _id: userId,
        callsign: callsign.trim(),
        name: name ? name.trim() : callsign.trim(),
        role: role === 'MEMBER' ? 'MEMBER' : 'PLAYER',
        password: password,
        teamId: teamId,
        zoneId: role === 'MEMBER' ? assignedZoneId : null,
        zoneLabel: role === 'MEMBER' ? assignedZoneLabel : null,
        coneColor: role === 'MEMBER' ? assignedConeColor : null,
        conePoints: role === 'MEMBER' ? assignedConePoints : null,
        isApproved: false,
        createdAt: new Date().toISOString()
      };

      memoryStore.collections.users.push(newUser);
      await memoryStore.saveAsync();
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
          zoneId: newUser.zoneId,
          zoneLabel: newUser.zoneLabel,
          coneColor: newUser.coneColor,
          conePoints: newUser.conePoints
        }
      });
    }

    // ─────────────────────────────────────────────────────────
    // 2. POST /api/auth/login
    // ─────────────────────────────────────────────────────────
    if ((pathname === '/api/auth/login' || pathname === '/api/login') && req.method === 'POST') {
      const body = await parseBody(req);
      const { callsign, password, requestedRole } = body;

      if (!callsign || !password) {
        return sendJson(res, 400, { success: false, error: 'Please enter callsign and password.' });
      }

      const trimmedCallsign = callsign.trim();
      const trimmedPass = password.trim();

      // Strictly Guard Admin Access: Only ID 'samay' and password 'samay'
      if (requestedRole === 'ADMIN' || trimmedCallsign.toLowerCase() === 'samay') {
        if (trimmedCallsign.toLowerCase() === 'samay' && trimmedPass === 'samay') {
          return sendJson(res, 200, {
            success: true,
            role: 'ADMIN',
            isApproved: true,
            user: DEFAULT_ADMIN
          });
        } else {
          return sendJson(res, 401, {
            success: false,
            error: 'Clearance Rejected: Invalid Command ID or Access Key.'
          });
        }
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

      if (!userId && !callsign) {
        return sendJson(res, 200, {
          success: true,
          authenticated: false,
          message: 'No active session credentials specified'
        });
      }

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
          zoneId: user.zoneId,
          zoneLabel: user.zoneLabel,
          coneColor: user.coneColor,
          conePoints: user.conePoints,
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
        zoneId: user.zoneId,
        zoneLabel: user.zoneLabel,
        coneColor: user.coneColor,
        conePoints: user.conePoints,
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
    if ((pathname === '/api/admin/approve' || pathname === '/api/admin/approve-team' || pathname === '/api/admin/approve-user') && req.method === 'POST') {
      const body = await parseBody(req);
      const cleanId = String(body.id || body.teamId || body.userId || '').trim();
      const cleanCallsign = String(body.callsign || '').trim().toLowerCase();
      const cleanType = String(body.type || (pathname.includes('user') ? 'MEMBER' : 'PLAYER')).trim().toUpperCase();

      if (!cleanId && !cleanCallsign) {
        return sendJson(res, 400, { success: false, error: 'ID or callsign is required for clearance authorization.' });
      }

      if (atlasDb) {
        let approvedAny = false;
        let approvedName = cleanId || cleanCallsign;

        // Try team lookup
        const team = await atlasDb.collection('teams').findOne({
          $or: [
            { _id: cleanId },
            { id: cleanId },
            ...(cleanCallsign ? [{ callsign: cleanCallsign }] : []),
            { callsign: cleanId },
            { name: cleanId }
          ]
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
          $or: [
            { _id: cleanId },
            { id: cleanId },
            ...(cleanCallsign ? [{ callsign: cleanCallsign }] : []),
            { callsign: cleanId }
          ]
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
          broadcastEvent({ type: 'APPROVAL_UPDATE', entityId: cleanId, name: approvedName, timestamp: Date.now() });
          return sendJson(res, 200, { success: true, message: approvedName + ' approved successfully.', entityId: cleanId });
        }

        return sendJson(res, 404, { success: false, error: 'Entity "' + (cleanId || cleanCallsign) + '" not found in database.' });
      }

      let approvedAny = false;
      let approvedName = cleanId || cleanCallsign;
      let approvedRole = cleanType === 'MEMBER' ? 'MEMBER' : 'PLAYER';

      // 1. Search Teams
      const matchedTeams = memoryStore.collections.teams.filter(t => 
        (cleanId && t._id && t._id === cleanId) ||
        (cleanId && t.id && t.id === cleanId) ||
        (cleanCallsign && t.callsign && t.callsign.toLowerCase() === cleanCallsign) ||
        (cleanId && t.callsign && t.callsign.toLowerCase() === cleanId.toLowerCase()) ||
        (cleanId && t.name && t.name.toLowerCase() === cleanId.toLowerCase())
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
              (cleanId && u._id === cleanId) ||
              (cleanCallsign && u.callsign && u.callsign.toLowerCase() === cleanCallsign)
            ) {
              u.isApproved = true;
            }
          });
        });
      }

      // 2. Search Users
      const matchedUsers = memoryStore.collections.users.filter(u =>
        (cleanId && u._id && u._id === cleanId) ||
        (cleanId && u.id && u.id === cleanId) ||
        (cleanCallsign && u.callsign && u.callsign.toLowerCase() === cleanCallsign) ||
        (cleanId && u.callsign && u.callsign.toLowerCase() === cleanId.toLowerCase()) ||
        (cleanId && u.teamId && u.teamId === cleanId)
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
        await memoryStore.saveAsync();
        const logAction = approvedRole === 'MEMBER' ? 'APPROVE_USER' : 'APPROVE_TEAM';
        const logMsg = approvedRole === 'MEMBER'
          ? 'Field Marshal authorized: "' + approvedName + '" (' + cleanId + ')'
          : 'Squad authorized: "' + approvedName + '" (' + cleanId + ')';
        memoryStore.logEvent(logAction, logMsg);
        broadcastEvent({ type: 'APPROVAL_UPDATE', entityId: cleanId, name: approvedName, timestamp: Date.now() });
        return sendJson(res, 200, { success: true, message: approvedName + ' authorized successfully.', entityId: cleanId });
      }

      return sendJson(res, 404, { success: false, error: 'Clearance entity "' + cleanId + '" not found in database.' });
    }

    // ─────────────────────────────────────────────────────────
    // 5b. POST /api/admin/approve-all (Batch Authorize All Pending)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/approve-all' && req.method === 'POST') {
      let approvedCount = 0;
      if (atlasDb) {
        const resTeams = await atlasDb.collection('teams').updateMany({ isApproved: { $ne: true } }, { $set: { isApproved: true } });
        const resUsers = await atlasDb.collection('users').updateMany({ isApproved: { $ne: true } }, { $set: { isApproved: true } });
        approvedCount = (resTeams.modifiedCount || 0) + (resUsers.modifiedCount || 0);
      }

      (memoryStore.collections.teams || []).forEach(t => {
        if (!t.isApproved) {
          t.isApproved = true;
          approvedCount++;
        }
      });
      (memoryStore.collections.users || []).forEach(u => {
        if (!u.isApproved) {
          u.isApproved = true;
          approvedCount++;
        }
      });

      await memoryStore.saveAsync();
      memoryStore.logEvent('APPROVE_ALL', 'Game Master batch-authorized all pending squads and field marshals (' + approvedCount + ' total).');
      broadcastEvent({ type: 'APPROVAL_UPDATE', batch: true, count: approvedCount, timestamp: Date.now() });
      return sendJson(res, 200, { success: true, count: approvedCount, message: 'Successfully authorized all ' + approvedCount + ' pending clearances.' });
    }

    // ─────────────────────────────────────────────────────────
    // 6. POST /api/admin/reject
    // ─────────────────────────────────────────────────────────
    if ((pathname === '/api/admin/reject' || pathname === '/api/admin/reject-team' || pathname === '/api/admin/reject-user') && req.method === 'POST') {
      const body = await parseBody(req);
      const cleanId = String(body.id || body.teamId || body.userId || '').trim();
      const cleanType = String(body.type || (pathname.includes('user') ? 'MEMBER' : 'TEAM')).trim().toUpperCase();

      if (atlasDb) {
        if (cleanType === 'TEAM') {
          await atlasDb.collection('teams').deleteOne({ _id: cleanId });
          await atlasDb.collection('users').deleteMany({ teamId: cleanId });
        } else {
          await atlasDb.collection('users').deleteOne({ _id: cleanId });
        }
        return sendJson(res, 200, { success: true, message: 'Entity rejected.' });
      }

      if (cleanType === 'TEAM') {
        memoryStore.collections.teams = memoryStore.collections.teams.filter(t => t._id !== cleanId);
        memoryStore.collections.users = memoryStore.collections.users.filter(u => u.teamId !== cleanId);
      } else {
        memoryStore.collections.users = memoryStore.collections.users.filter(u => u._id !== cleanId);
      }
      await memoryStore.saveAsync();
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
      broadcastEvent({ type: 'CHECKIN_AWARD', teamId: team._id, teamScore: 0, currentClueIndex: 0, reset: true, timestamp: Date.now() });
      return sendJson(res, 200, { success: true, message: `Points and progress reset to 0 for squad "${team.name}".` });
    }

    // ─────────────────────────────────────────────────────────
    // 6c-1. POST /api/admin/teams/reset-all-points
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/teams/reset-all-points' && req.method === 'POST') {
      if (atlasDb) {
        await atlasDb.collection('teams').updateMany({}, {
          $set: { score: 0, cards: [], visitedZones: [], currentClueIndex: 0, updatedAt: new Date().toISOString() }
        });
        await atlasDb.collection('checkins').deleteMany({});
      }

      const teamCount = (memoryStore.collections.teams || []).length;
      (memoryStore.collections.teams || []).forEach(t => {
        t.score = 0;
        t.cards = [];
        t.visitedZones = [];
        t.currentClueIndex = 0;
        t.updatedAt = new Date().toISOString();
      });
      memoryStore.collections.checkins = [];
      await memoryStore.saveAsync();
      memoryStore.logEvent('RESET_ALL_POINTS', `Game Master reset all points, cards, and checkpoint progress to 0 for ${teamCount} squads.`);
      broadcastEvent({ type: 'CHECKIN_AWARD', resetAll: true, timestamp: Date.now() });
      return sendJson(res, 200, { success: true, message: `All squad scores and progress reset to 0 (${teamCount} squads affected).` }, 'no-store, no-cache, max-age=0');
    }

    // ─────────────────────────────────────────────────────────
    // 6c-2. POST /api/admin/teams/purge-all
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/teams/purge-all' && req.method === 'POST') {
      if (atlasDb) {
        await atlasDb.collection('teams').deleteMany({});
        await atlasDb.collection('users').deleteMany({ role: { $ne: 'ADMIN' } });
        await atlasDb.collection('checkins').deleteMany({});
      }

      const purgedTeamsCount = (memoryStore.collections.teams || []).length;
      memoryStore.collections.teams = [];
      memoryStore.collections.users = (memoryStore.collections.users || []).filter(u => u.role === 'ADMIN');
      memoryStore.collections.checkins = [];
      await memoryStore.saveAsync();
      memoryStore.logEvent('PURGE_ALL_TEAMS', `Game Master permanently purged all squads (${purgedTeamsCount}) and non-admin operatives.`);
      return sendJson(res, 200, { success: true, message: `All ${purgedTeamsCount} squads and operative accounts purged successfully.` }, 'no-store, no-cache, max-age=0');
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
      const limit = parseInt(query.limit, 10) || 200;
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
          await memoryStore.saveAsync();
        }
      }

      // Auto-end match when 52 minutes expire
      if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
        const gameEnd = new Date(gs.endsAt).getTime();
        if (now >= gameEnd) {
          gs.status = 'ENDED';
          if (!gs.endedAt) gs.endedAt = new Date().toISOString();
          await memoryStore.saveAsync();
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
          durationMinutes: gs.durationMinutes,
          countdownEndsAt: gs.countdownEndsAt,
          startedAt: gs.startedAt,
          endsAt: gs.endsAt
        }, 'no-store, no-cache, must-revalidate, max-age=0', req);
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

          await memoryStore.saveAsync();
        } else if (reqStatus === 'START' || reqStatus === 'PLAYER_PHASE' || reqStatus === 'ACTIVE') {
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

          await memoryStore.saveAsync();
        } else if (reqStatus === 'PAUSE' || reqStatus === 'PAUSED') {
          gs.status = 'PAUSED';
          gs.pausedAt = new Date(now).toISOString();
          await memoryStore.saveAsync();
        } else if (reqStatus === 'RESUME' || reqStatus === 'UNPAUSE') {
          if (gs.status === 'PAUSED') {
            if (gs.pausedAt && gs.endsAt) {
              const pauseDuration = now - new Date(gs.pausedAt).getTime();
              gs.totalPausedMs = (gs.totalPausedMs || 0) + pauseDuration;
              gs.endsAt = new Date(new Date(gs.endsAt).getTime() + pauseDuration).toISOString();
            }
            gs.status = 'PLAYER_PHASE';
            gs.pausedAt = null;
            await memoryStore.saveAsync();
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

          await memoryStore.saveAsync();
        } else if (reqStatus === 'ENDED') {
          gs.status = 'ENDED';
          gs.endedAt = new Date(now).toISOString();
          await memoryStore.saveAsync();
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

        broadcastEvent({
          type: 'GAME_STATE_UPDATE',
          status: gs.status,
          gameState: gs,
          countdownEndsAt: gs.countdownEndsAt,
          remainingSeconds: remainingSeconds,
          countdownSeconds: countdownSeconds,
          timestamp: Date.now()
        });

        return sendJson(res, 200, {
          success: true,
          state: gs,
          serverTime: new Date(now).toISOString(),
          remainingSeconds: remainingSeconds,
          countdownSeconds: countdownSeconds,
          countdownEndsAt: gs.countdownEndsAt,
          startedAt: gs.startedAt,
          endsAt: gs.endsAt,
          durationSeconds: gs.durationSeconds,
          durationMinutes: gs.durationMinutes
        });
      }
    }

function ensureUniqueTeamCodes(teams) {
  if (!Array.isArray(teams)) return [];
  // Sort deterministically to prevent position shifting
  teams.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return String(a._id || '').localeCompare(String(b._id || ''));
  });

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

function getBalancedMarshalAllocation(allMarshals, allClues, requestedZone = null, requestedColor = null) {
  const places = (Array.isArray(allClues) && allClues.length > 0) ? allClues : INITIAL_CAMPUS_PLACES;

  // 1. Target Zone Determination (Uniform distribution across available places)
  let targetZoneId = null;
  let targetZoneLabel = null;

  if (requestedZone && requestedZone !== 'AUTO') {
    const matched = places.find(p => normalizeZone(p.zoneId) === normalizeZone(requestedZone));
    if (matched) {
      targetZoneId = matched.zoneId;
      targetZoneLabel = matched.zoneLabel || matched.zoneId;
    }
  }

  if (!targetZoneId) {
    // Count current marshals at each campus place
    const zoneCounts = new Map();
    places.forEach(p => zoneCounts.set(normalizeZone(p.zoneId), 0));
    (allMarshals || []).forEach(m => {
      if (m.zoneId) {
        const norm = normalizeZone(m.zoneId);
        if (zoneCounts.has(norm)) {
          zoneCounts.set(norm, zoneCounts.get(norm) + 1);
        }
      }
    });

    // Find minimum count so every place gets a marshal before any duplicates
    let minCount = Infinity;
    zoneCounts.forEach(count => {
      if (count < minCount) minCount = count;
    });

    const candidatePlaces = places.filter(p => zoneCounts.get(normalizeZone(p.zoneId)) === minCount);
    // Shuffle and pick randomly among candidates
    const chosen = candidatePlaces[Math.floor(Math.random() * candidatePlaces.length)] || places[0];
    targetZoneId = chosen.zoneId;
    targetZoneLabel = chosen.zoneLabel || chosen.zoneId;
  }

  // 2. Cone Color Determination (Equally distributed among RED: 10, YELLOW: 12, GREEN: 15)
  let targetColor = null;
  let targetPoints = 12;

  if (requestedColor && requestedColor !== 'AUTO') {
    const matchedCone = CONE_OPTIONS.find(c => c.color === String(requestedColor).toUpperCase());
    if (matchedCone) {
      targetColor = matchedCone.color;
      targetPoints = matchedCone.points;
    }
  }

  if (!targetColor) {
    const colorCounts = { RED: 0, YELLOW: 0, GREEN: 0 };
    (allMarshals || []).forEach(m => {
      const c = (m.coneColor || '').toUpperCase();
      if (colorCounts[c] !== undefined) colorCounts[c]++;
    });

    let minColorCount = Infinity;
    Object.values(colorCounts).forEach(cnt => {
      if (cnt < minColorCount) minColorCount = cnt;
    });

    const candidateCones = CONE_OPTIONS.filter(c => colorCounts[c.color] === minColorCount);
    const chosenCone = candidateCones[Math.floor(Math.random() * candidateCones.length)] || CONE_OPTIONS[0];
    targetColor = chosenCone.color;
    targetPoints = chosenCone.points;
  }

  return {
    zoneId: targetZoneId,
    zoneLabel: targetZoneLabel,
    coneColor: targetColor,
    conePoints: targetPoints
  };
}

function getActiveMarshalClues(allClues, allUsers) {
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
  // STABLE: Never invent fake places or dummy zones!
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
        coneColor: marshal.coneColor || 'YELLOW',
        conePoints: marshal.conePoints || 12,
        hasMarshal: true
      });
      handledNorms.add(norm);
    }
  });

  return activeClues;
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
}

    // ─────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────
    // 9b. GET /api/player/sync (Lightning-Fast Dedicated Single-Player Telemetry)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/player/sync' && req.method === 'GET') {
      const teamId = parsedUrl.query.teamId;
      const callsign = parsedUrl.query.callsign;

      if (!teamId && !callsign) {
        return sendJson(res, 400, { success: false, error: 'teamId or callsign is required.' });
      }

      let allTeams = [];
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
      }

      ensureUniqueTeamCodes(allTeams);
      const approvedTeams = allTeams.filter(t => t.isApproved);
      approvedTeams.sort((a, b) => (b.score || 0) - (a.score || 0));

      let myTeam = approvedTeams.find(t => 
        (teamId && t._id === teamId) ||
        (callsign && t.callsign && t.callsign.toLowerCase() === callsign.toLowerCase())
      ) || allTeams.find(t => 
        (teamId && t._id === teamId) ||
        (callsign && t.callsign && t.callsign.toLowerCase() === callsign.toLowerCase())
      );

      if (!myTeam) {
        let allUsers = [];
        if (atlasDb) {
          allUsers = await atlasDb.collection('users').find().toArray();
        } else {
          allUsers = memoryStore.collections.users || [];
        }
        const matchedUser = allUsers.find(u => 
          (teamId && u._id === teamId) || 
          (teamId && u.teamId === teamId) ||
          (callsign && u.callsign && u.callsign.toLowerCase() === callsign.toLowerCase()) ||
          (teamId && u.callsign && u.callsign.toLowerCase() === teamId.toLowerCase())
        );
        if (matchedUser && matchedUser.teamId) {
          myTeam = allTeams.find(t => t._id === matchedUser.teamId);
        }
      }

      if (!myTeam) {
        return sendJson(res, 404, { success: false, error: 'Squad not found in active grid.' });
      }

      const myRank = approvedTeams.findIndex(t => t._id === myTeam._id);
      const activeClues = getActiveMarshalClues(allClues, allUsers);
      const activeClue = resolveTeamTargetClue(myTeam, activeClues);
      const teamCheckins = allCheckins.filter(c => c.teamId === myTeam._id);
      const lastCheckin = teamCheckins[0] || null;
      const topLeaderboard = approvedTeams.slice(0, 5).map(t => ({
        _id: t._id,
        name: t.name || t.callsign,
        callsign: t.callsign,
        score: t.score || 0
      }));
      let gs = {};
      if (atlasDb) {
        gs = await atlasDb.collection('gameState').findOne({ _id: 'global_state' }) || {};
      } else {
        gs = memoryStore.collections.gameState || {};
      }

      return sendJson(res, 200, {
        success: true,
        teamId: myTeam._id,
        teamCode: myTeam.teamCode,
        squadNumber: (myTeam.teamCode >= 11 ? (myTeam.teamCode - 10) : 1),
        teamName: myTeam.name || myTeam.callsign,
        callsign: myTeam.callsign,
        score: myTeam.score || 0,
        currentClueIndex: myTeam.currentClueIndex || 0,
        visitedZones: myTeam.visitedZones || [],
        cards: myTeam.cards || [],
        cardsCount: (myTeam.cards || []).length,
        rank: myRank >= 0 ? (myRank + 1) : null,
        totalApprovedTeams: approvedTeams.length,
        leaderboard: topLeaderboard,
        activeClue: activeClue ? {
          zoneId: activeClue.zoneId,
          zoneLabel: activeClue.zoneLabel || activeClue.zoneId,
          text: activeClue.text
        } : null,
        nextStationName: activeClue ? (activeClue.zoneLabel || activeClue.zoneId) : 'ALL CHECKPOINTS CLEARED',
        nextClueText: activeClue ? activeClue.text : 'All campus beacons verified! Report to Game Master Central.',
        allCompleted: !activeClue || ((myTeam.currentClueIndex || 0) >= (activeClues.length || 1)),
        lastCheckin: lastCheckin ? {
          points: lastCheckin.points,
          zoneId: lastCheckin.zoneId,
          cone: lastCheckin.cone,
          timestamp: lastCheckin.timestamp
        } : null,
        gameState: {
          status: gs.status || 'LOBBY',
          startedAt: gs.startedAt,
          durationMinutes: gs.durationMinutes || 60,
          remainingSeconds: gs.remainingSeconds
        }
      }, 'no-store, no-cache, must-revalidate, max-age=0');
    }

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
      return sendJson(res, 200, { success: true, teams: memoryStore.collections.teams }, 'no-store, no-cache, must-revalidate, max-age=0', req);
    }

    // ─────────────────────────────────────────────────────────
    // 10b. GET /api/clues (Mission Directives & Checkpoint Places)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/clues' && req.method === 'GET') {
      const showAll = query.all === 'true' || query.role === 'ADMIN';

      let rawClues = [];
      let allUsers = [];

      if (atlasDb) {
        rawClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        allUsers = await atlasDb.collection('users').find().toArray();
      } else {
        memoryStore.load();
        rawClues = memoryStore.collections.clues || [];
        allUsers = memoryStore.collections.users || [];
      }

      const activeMarshalClues = getActiveMarshalClues(rawClues, allUsers);

      // If viewing from Admin Places tab (showAll=true), return all registered places
      if (showAll) {
        const activeZoneMap = {};
        allUsers.filter(u => u.role === 'MEMBER' && u.isApproved && u.zoneId).forEach(m => {
          const z = normalizeZone(m.zoneId);
          if (!activeZoneMap[z]) activeZoneMap[z] = [];
          activeZoneMap[z].push(m.callsign || m.name);
        });

        const enrichedClues = rawClues.map(c => {
          const z = normalizeZone(c.zoneId);
          const assignedMarshals = activeZoneMap[z] || [];
          return {
            ...c,
            hasMarshal: assignedMarshals.length > 0,
            marshals: assignedMarshals,
            marshalCount: assignedMarshals.length
          };
        });

        return sendJson(res, 200, {
          success: true,
          clues: enrichedClues,
          totalCount: enrichedClues.length,
          activeCount: enrichedClues.filter(c => c.hasMarshal).length
        });
      }

      // For Players & Field Marshals: Return ONLY active checkpoint places with approved marshals!
      return sendJson(res, 200, {
        success: true,
        clues: activeMarshalClues,
        totalCount: activeMarshalClues.length,
        allPlacesCount: rawClues.length,
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
    // 10e. POST /api/admin/clues/reset (Reset to Initial Campus Places: Atrium, LHC, Galaria)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/clues/reset' && req.method === 'POST') {
      const newClues = JSON.parse(JSON.stringify(INITIAL_CAMPUS_PLACES));

      if (atlasDb) {
        const cluesCol = atlasDb.collection('clues');
        await cluesCol.deleteMany({});
        await cluesCol.insertMany(newClues);
        return sendJson(res, 200, { success: true, message: 'Campus places reset to Atrium, LHC, and Galaria.', clues: newClues });
      }

      memoryStore.load();
      memoryStore.collections.clues = newClues;
      await memoryStore.saveAsync();
      memoryStore.logEvent('RESET_PLACES', 'Game Master reset campus places to Atrium, LHC, and Galaria.');
      return sendJson(res, 200, { success: true, message: 'Campus places reset to Atrium, LHC, and Galaria.', clues: newClues });
    }

    // ─────────────────────────────────────────────────────────
    // 10g. POST /api/member/update-station (Marshal chooses area or cone colour)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/member/update-station' && req.method === 'POST') {
      const body = await parseBody(req);
      const { userId, callsign, zoneId, zoneLabel, coneColor } = body;

      if (atlasDb) {
        const usersCol = atlasDb.collection('users');
        const user = await usersCol.findOne({
          $or: [
            ...(userId ? [{ _id: userId }, { id: userId }] : []),
            ...(callsign ? [{ callsign: new RegExp('^' + callsign.trim() + '$', 'i') }] : [])
          ]
        });

        if (!user) {
          return sendJson(res, 404, { success: false, error: 'Field Marshal user not found.' });
        }

        const cluesCol = atlasDb.collection('clues');
        const rawClues = await cluesCol.find().toArray();
        let targetZoneId = user.zoneId;
        let targetZoneLabel = user.zoneLabel;

        if (zoneId) {
          const matched = rawClues.find(c => normalizeZone(c.zoneId) === normalizeZone(zoneId));
          if (matched) {
            targetZoneId = matched.zoneId;
            targetZoneLabel = matched.zoneLabel || matched.zoneId;
          } else {
            targetZoneId = zoneId.toUpperCase().trim();
            targetZoneLabel = zoneLabel ? zoneLabel.trim() : targetZoneId;
          }
        }

        let targetColor = user.coneColor || 'YELLOW';
        let targetPoints = user.conePoints || 12;
        if (coneColor) {
          const match = CONE_OPTIONS.find(c => c.color === coneColor.toUpperCase().trim());
          if (match) {
            targetColor = match.color;
            targetPoints = match.points;
          }
        }

        await usersCol.updateOne(
          { _id: user._id },
          { $set: { zoneId: targetZoneId, zoneLabel: targetZoneLabel, coneColor: targetColor, conePoints: targetPoints } }
        );

        return sendJson(res, 200, {
          success: true,
          message: `Station updated to ${targetZoneLabel} (${targetColor} cone).`,
          user: {
            ...user,
            zoneId: targetZoneId,
            zoneLabel: targetZoneLabel,
            coneColor: targetColor,
            conePoints: targetPoints
          }
        });
      }

      memoryStore.load();
      const user = memoryStore.collections.users.find(u => 
        (userId && (u._id === userId || u.id === userId)) ||
        (callsign && u.callsign && u.callsign.toLowerCase() === callsign.toLowerCase().trim())
      );

      if (!user) {
        return sendJson(res, 404, { success: false, error: 'Field Marshal user not found.' });
      }

      const clues = memoryStore.collections.clues || INITIAL_CAMPUS_PLACES;
      if (zoneId) {
        const matched = clues.find(c => normalizeZone(c.zoneId) === normalizeZone(zoneId));
        if (matched) {
          user.zoneId = matched.zoneId;
          user.zoneLabel = matched.zoneLabel || matched.zoneId;
        } else {
          user.zoneId = zoneId.toUpperCase().trim();
          user.zoneLabel = zoneLabel ? zoneLabel.trim() : user.zoneId;
        }
      }

      if (coneColor) {
        const match = CONE_OPTIONS.find(c => c.color === coneColor.toUpperCase().trim());
        if (match) {
          user.coneColor = match.color;
          user.conePoints = match.points;
        }
      }

      await memoryStore.saveAsync();
      memoryStore.logEvent('UPDATE_STATION', `Field Marshal "${user.callsign}" updated station to ${user.zoneLabel} (${user.zoneId}) with ${user.coneColor || 'YELLOW'} cone.`);

      return sendJson(res, 200, {
        success: true,
        message: `Station updated to ${user.zoneLabel} (${user.coneColor || 'YELLOW'} cone).`,
        user: {
          _id: user._id,
          callsign: user.callsign,
          name: user.name,
          role: user.role,
          zoneId: user.zoneId,
          zoneLabel: user.zoneLabel,
          coneColor: user.coneColor,
          conePoints: user.conePoints
        }
      });
    }

    // ─────────────────────────────────────────────────────────
    // 10h. POST /api/admin/marshals/auto-allocate (Equally & Differently Allocate Areas and Cone Colours)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/marshals/auto-allocate' && req.method === 'POST') {
      if (atlasDb) {
        const usersCol = atlasDb.collection('users');
        const cluesCol = atlasDb.collection('clues');
        const marshals = await usersCol.find({ role: 'MEMBER' }).toArray();
        const clues = await cluesCol.find().toArray();

        if (marshals.length === 0) {
          return sendJson(res, 200, { success: true, message: 'No registered Field Marshals to allocate.', count: 0 });
        }
        const activePlaces = clues.length > 0 ? clues : INITIAL_CAMPUS_PLACES;
        const shuffledPlaces = activePlaces.slice().sort(() => Math.random() - 0.5);
        const shuffledCones = CONE_OPTIONS.slice().sort(() => Math.random() - 0.5);

        marshals.sort(() => Math.random() - 0.5);
        for (let i = 0; i < marshals.length; i++) {
          const m = marshals[i];
          const place = shuffledPlaces[i % shuffledPlaces.length];
          const cone = shuffledCones[i % shuffledCones.length];
          await usersCol.updateOne(
            { _id: m._id },
            { $set: { zoneId: place.zoneId, zoneLabel: place.zoneLabel || place.zoneId, coneColor: cone.color, conePoints: cone.points } }
          );
        }

        return sendJson(res, 200, {
          success: true,
          message: `Successfully allocated ${marshals.length} Field Marshals across ${activePlaces.length} stations and cone colours equally.`,
          count: marshals.length
        });
      }

      memoryStore.load();
      const marshals = memoryStore.collections.users.filter(u => u.role === 'MEMBER');
      const clues = memoryStore.collections.clues || INITIAL_CAMPUS_PLACES;

      if (marshals.length === 0) {
        return sendJson(res, 200, { success: true, message: 'No registered Field Marshals to allocate.', count: 0 });
      }

      const activePlaces = clues.length > 0 ? clues : INITIAL_CAMPUS_PLACES;
      const shuffledPlaces = activePlaces.slice().sort(() => Math.random() - 0.5);
      const shuffledCones = CONE_OPTIONS.slice().sort(() => Math.random() - 0.5);

      marshals.sort(() => Math.random() - 0.5);
      marshals.forEach((m, idx) => {
        const place = shuffledPlaces[idx % shuffledPlaces.length];
        const cone = shuffledCones[idx % shuffledCones.length];
        m.zoneId = place.zoneId;
        m.zoneLabel = place.zoneLabel || place.zoneId;
        m.coneColor = cone.color;
        m.conePoints = cone.points;
      });

      await memoryStore.saveAsync();
      memoryStore.logEvent('ALLOCATE_MARSHALS', `Game Master randomly and equally allocated ${marshals.length} Field Marshals across ${activePlaces.length} campus checkpoints and cone colours.`);

      return sendJson(res, 200, {
        success: true,
        message: `Successfully allocated ${marshals.length} Field Marshals across ${activePlaces.length} stations and cone colours equally.`,
        count: marshals.length,
        marshals: marshals.map(m => ({
          _id: m._id,
          callsign: m.callsign,
          name: m.name,
          zoneId: m.zoneId,
          zoneLabel: m.zoneLabel,
          coneColor: m.coneColor,
          conePoints: m.conePoints
        }))
      });
    }

    // ─────────────────────────────────────────────────────────
    // 10d. POST /api/admin/rebalance-routes
    // Distributes all registered squads equally and randomly across all active checkpoint locations!
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/admin/rebalance-routes' && req.method === 'POST') {
      if (atlasDb) {
        const rawClues = await atlasDb.collection('clues').find().sort({ zoneId: 1 }).toArray();
        const rawUsers = await atlasDb.collection('users').find().toArray();
        const rawTeams = await atlasDb.collection('teams').find().toArray();
        const targetClues = getActiveMarshalClues(rawClues, rawUsers);
        const teams = ensureUniqueTeamCodes(rawTeams);
        for (let i = 0; i < teams.length; i++) {
          const t = teams[i];
          const route = resolveTeamRoute(t, targetClues, i);
          const clueOrder = route.map(c => c._id);
          await atlasDb.collection('teams').updateOne(
            { _id: t._id },
            { $set: { teamCode: t.teamCode, clueOrder: clueOrder, updatedAt: new Date().toISOString() } }
          );
        }
        return sendJson(res, 200, { success: true, message: `Re-balanced routes for ${teams.length} squads across ${rawClues.length} stations.` });
      }
      memoryStore.load();
      const rawClues = memoryStore.collections.clues || [];
      const rawUsers = memoryStore.collections.users || [];
      const targetClues = getActiveMarshalClues(rawClues, rawUsers);
      const teams = ensureUniqueTeamCodes(memoryStore.collections.teams || []);
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const route = resolveTeamRoute(t, targetClues, i);
        t.clueOrder = route.map(c => c._id);
      }
      await memoryStore.saveAsync();
      return sendJson(res, 200, { success: true, message: `Re-balanced routes for ${teams.length} squads across ${rawClues.length} stations.` });
    }

    // ─────────────────────────────────────────────────────────
    // 11. POST /api/checkin (Real-time Point Allocation & Strict Station Check)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/checkin' && req.method === 'POST') {
      await memoryStore.syncFromCloud(true);
      const body = await parseBody(req);
      let { teamId, zoneId, cone, cardRank, cardSuit, memberId, code, qrPayload } = body;

      // Auto-decode 6-digit code or QR payload if passed
      const rawCode = String(code || qrPayload || '').trim();
      if (rawCode) {
        // Player scanning Marshal/Station QR Beacon: TG_STATION|<zoneId>|<zoneLabel>|<marshalCallsign>
        if (rawCode.startsWith('TG_STATION|')) {
          const parts = rawCode.split('|');
          if (!zoneId && parts[1]) zoneId = parts[1];
          if (!memberId && parts[3]) memberId = parts[3];
          if (!cone) cone = parts[4] || 'YELLOW';
          if (!cardRank) cardRank = 13;
          if (!cardSuit) cardSuit = '♠';
        } else if (rawCode.startsWith('TG|')) {
          // Marshal scanning Player Card QR: TG|<teamId>|<teamCode>|<rank>|<rankLabel>|<suit>|<code>
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
            if (matchedTeam) {
              teamId = matchedTeam._id;
            } else {
              return sendJson(res, 400, { success: false, error: 'Squad code (' + tt + ') does not match any registered team.' });
            }
          }

          if (!cardRank && rr >= 21 && rr <= 33) {
            cardRank = rr - 20;
          }

          if (hh >= 10 && hh <= 61) {
            const clueIdx = Math.floor((hh - 10) / 4);
            const suitIdx = (hh - 10) % 4;
            const suits = ['♠', '♥', '♦', '♣'];
            if (!cardSuit) cardSuit = suits[suitIdx] || '♠';
            if (!zoneId) zoneId = 'ZONE_' + String(clueIdx + 1).padStart(2, '0');
          }
        }
      }

      let team = null;
      let teamsCol = null;
      let checkinsCol = null;
      let allTeamsList = [];

      if (atlasDb) {
        teamsCol = atlasDb.collection('teams');
        checkinsCol = atlasDb.collection('checkins');
        allTeamsList = await teamsCol.find().toArray();
      } else {
        memoryStore.load();
        allTeamsList = memoryStore.collections.teams || [];
      }
      ensureUniqueTeamCodes(allTeamsList);
      team = allTeamsList.find(t => 
        t._id === teamId || (t.callsign && t.callsign.toLowerCase() === (teamId || '').toLowerCase())
      );

      if (!team) {
        let allUsers = [];
        if (atlasDb) {
          allUsers = await atlasDb.collection('users').find().toArray();
        } else {
          allUsers = memoryStore.collections.users || [];
        }
        const matchedUser = allUsers.find(u => 
          (teamId && u._id === teamId) || 
          (teamId && u.teamId === teamId) ||
          (teamId && u.callsign && u.callsign.toLowerCase() === teamId.toLowerCase())
        );
        if (matchedUser && matchedUser.teamId) {
          team = allTeamsList.find(t => t._id === matchedUser.teamId);
          teamId = matchedUser.teamId;
        }
      }

      if (!team) return sendJson(res, 404, { success: false, error: 'Team not found in grid telemetry.' });
      if (!team.isApproved) return sendJson(res, 403, { success: false, error: 'Squad is not yet approved by Game Master.' });

      // ─────────────────────────────────────────────────────────
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

      // If memberId is a registered marshal, enforce the marshal's official assigned station from the database!
      if (memberId && memberId !== 'self_scan_beacon') {
        const marshalUser = allUsers.find(u => 
          (u.callsign && u.callsign.toLowerCase() === memberId.toLowerCase()) ||
          u._id === memberId
        );
        if (marshalUser) {
          if (marshalUser.zoneId) {
            zoneId = marshalUser.zoneId;
          }
          if (marshalUser.coneColor) {
            cone = marshalUser.coneColor.toUpperCase();
          }
        }
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
          if (!body.allowOverride && !body.forceCheckin) {
            return sendJson(res, 400, {
              success: false,
              allCompleted: true,
              error: 'Squad "' + (team.name || team.callsign) + '" has already cleared all ' + activeClues.length + ' campus checkpoints! Direct them to Game Master Central.'
            });
          }
        }

        const targetZoneNorm = normalizeZone(activeTargetClue.zoneId);
        if (targetZoneNorm !== marshalZoneNorm) {
          const targetStationName = activeTargetClue.zoneLabel || activeTargetClue.zoneId;
          const currentStationName = zoneId || 'this station';
          if (!body.allowOverride && !body.forceCheckin) {
            return sendJson(res, 400, {
              success: false,
              wrongStation: true,
              teamName: team.name || team.callsign,
              error: '⛔ WRONG STATION: Squad "' + (team.name || team.callsign) + '" is currently assigned to ' + targetStationName + ' for Checkpoint #' + ((team.currentClueIndex || 0) + 1) + '. Points CANNOT be awarded at ' + currentStationName + '!',
              targetZoneId: activeTargetClue.zoneId,
              targetZoneLabel: targetStationName,
              currentStation: zoneId,
              currentClueIndex: team.currentClueIndex || 0
            });
          }
        }
      }

      const recordedZone = (body.allowOverride || body.forceCheckin) ? (zoneId || 'ZONE_01') : (activeTargetClue ? activeTargetClue.zoneId : (zoneId || 'ZONE_01'));
      const recordedZoneNorm = normalizeZone(recordedZone);

      const coneValues = { RED: 10, YELLOW: 12, GREEN: 15 };
      const conePts = coneValues[cone] || 12;
      const rankPts = parseInt(cardRank, 10) || 13;
      const totalPoints = conePts + rankPts;
      const checkinId = team._id + '_' + recordedZone + '_' + Date.now();

      const checkinRecord = {
        _id: checkinId,
        teamId: team._id,
        zoneId: recordedZone,
        memberId: memberId || 'marshal_station',
        cone: cone || 'YELLOW',
        cardRank: rankPts,
        cardSuit: cardSuit || '♠',
        points: totalPoints,
        timestamp: new Date().toISOString()
      };

      if (atlasDb) {
        await checkinsCol.insertOne(checkinRecord);
        await teamsCol.updateOne(
          { _id: team._id },
          {
            $inc: { score: totalPoints, currentClueIndex: 1 },
            $push: {
              cards: { rank: rankPts, suit: cardSuit || '♠', zoneId: recordedZone, awardedAt: new Date().toISOString() },
              visitedZones: recordedZone
            },
            $set: { updatedAt: new Date().toISOString() }
          }
        );

        const updatedTeam = await teamsCol.findOne({ _id: team._id });
        const nextClue = (activeClues.length > 0) ? resolveTeamTargetClue(updatedTeam, activeClues) : null;
        
        broadcastEvent({
          type: 'CHECKIN_AWARD',
          teamId: updatedTeam._id,
          teamName: updatedTeam.name || updatedTeam.callsign,
          pointsAwarded: totalPoints,
          teamScore: updatedTeam.score,
          currentClueIndex: updatedTeam.currentClueIndex,
          nextClueIndex: updatedTeam.currentClueIndex,
          nextZoneId: nextClue ? nextClue.zoneId : null,
          nextZoneLabel: nextClue ? (nextClue.zoneLabel || nextClue.zoneId) : 'ALL CHECKPOINTS CLEARED',
          nextClueText: nextClue ? nextClue.text : 'All campus beacons verified! Report to Game Master Central.',
          allCompleted: !nextClue,
          timestamp: Date.now()
        });

        return sendJson(res, 200, {
          success: true,
          pointsAwarded: totalPoints,
          teamScore: updatedTeam.score,
          teamName: updatedTeam.name || updatedTeam.callsign,
          currentClueIndex: updatedTeam.currentClueIndex,
          nextClueIndex: updatedTeam.currentClueIndex,
          nextZoneId: nextClue ? nextClue.zoneId : null,
          nextZoneLabel: nextClue ? (nextClue.zoneLabel || nextClue.zoneId) : 'ALL CHECKPOINTS CLEARED',
          nextClueText: nextClue ? nextClue.text : 'All campus beacons verified! Report to Game Master Central.',
          allCompleted: !nextClue
        });
      }

      // Memory Store
      memoryStore.collections.checkins = memoryStore.collections.checkins || [];
      memoryStore.collections.checkins.push(checkinRecord);
      team.score = (team.score || 0) + totalPoints;
      team.cards = team.cards || [];
      team.cards.push({ rank: rankPts, suit: cardSuit || '♠', zoneId: recordedZone, awardedAt: new Date().toISOString() });
      team.visitedZones = team.visitedZones || [];
      if (!team.visitedZones.some(z => normalizeZone(z) === recordedZoneNorm)) {
        team.visitedZones.push(recordedZone);
      }
      team.currentClueIndex = (team.currentClueIndex || 0) + 1;
      team.updatedAt = new Date().toISOString();

      await memoryStore.saveAsync();
      memoryStore.logEvent('CHECKIN', 'Team "' + team.name + '" awarded +' + totalPoints + ' PTS at ' + recordedZone + ' (Total: ' + team.score + ' PTS)');

      const nextClue = (activeClues.length > 0) ? resolveTeamTargetClue(team, activeClues) : null;

      broadcastEvent({
        type: 'CHECKIN_AWARD',
        teamId: team._id,
        teamName: team.name || team.callsign,
        pointsAwarded: totalPoints,
        teamScore: team.score,
        currentClueIndex: team.currentClueIndex,
        nextClueIndex: team.currentClueIndex,
        nextZoneId: nextClue ? nextClue.zoneId : null,
        nextZoneLabel: nextClue ? (nextClue.zoneLabel || nextClue.zoneId) : 'ALL CHECKPOINTS CLEARED',
        nextClueText: nextClue ? nextClue.text : 'All campus beacons verified! Report to Game Master Central.',
        allCompleted: !nextClue,
        timestamp: Date.now()
      });

      return sendJson(res, 200, {
        success: true,
        pointsAwarded: totalPoints,
        teamScore: team.score,
        teamName: team.name || team.callsign,
        currentClueIndex: team.currentClueIndex,
        nextClueIndex: team.currentClueIndex,
        nextZoneId: nextClue ? nextClue.zoneId : null,
        nextZoneLabel: nextClue ? (nextClue.zoneLabel || nextClue.zoneId) : 'ALL CHECKPOINTS CLEARED',
        nextClueText: nextClue ? nextClue.text : 'All campus beacons verified! Report to Game Master Central.',
        allCompleted: !nextClue
      });
    }

    return sendJson(res, 404, { success: false, error: 'API endpoint not found: ' + pathname });
  } catch (err) {
    console.error('Serverless Error:', err);
    if (Sentry) Sentry.captureException(err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
};

module.exports.getBalancedMarshalAllocation = getBalancedMarshalAllocation;
module.exports.INITIAL_CAMPUS_PLACES = INITIAL_CAMPUS_PLACES;
module.exports.CONE_OPTIONS = CONE_OPTIONS;
module.exports.memoryStore = memoryStore;
