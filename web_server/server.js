// Territory Grid // Tactical Real-Time Scavenger Hunt
// MongoDB Document Server & API Gateway
// Port: 8088 (or PORT env var)

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const apiHandler = require('../api/index.js');

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
  // Sentry fallback
}

const PORT = process.env.PORT || 8088;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'territory_grid_mongodb.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const STATIC_DIR = fs.existsSync(PUBLIC_DIR) ? PUBLIC_DIR : path.join(__dirname, '..', 'design_refs', 'html');

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
    teams.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      if (ta !== tb) return ta - tb;
      return String(a._id || '').localeCompare(String(b._id || ''));
    });
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

function normalizeZone(z) {
  if (!z) return '';
  let s = String(z).toUpperCase().trim();
  s = s.replace(/[^A-Z0-9]/g, '');
  s = s.replace(/^ZONE0+(\d+)/, 'ZONE$1');
  return s;
}

function resolveTeamRoute(team, allClues, teamIndex = 0) {
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
    return null;
  }
  return route[currentIdx];
}

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

  // ── REST API ROUTES (Unified Gateway -> api/index.js) ───────────
  if (pathname.startsWith('/api/') || pathname === '/api') {
    return apiHandler(req, res);
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
