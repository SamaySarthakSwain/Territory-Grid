const fs = require('fs');
const path = require('path');

console.log('=== APPLYING MATCH START & TEAMS PURGE/RESET FIXES ===');

// ============================================================================
// 1. UPDATE api/index.js
// ============================================================================
let api = fs.readFileSync('api/index.js', 'utf8');

// 1a. Fix MemoryStore.load()
const oldLoad = `  load() {
    try {
      if ((!this.collections.users || this.collections.users.length <= 1) && fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.collections = parsed;
        }
      }
    } catch (e) {}
  }`;

const newLoad = `  load() {
    try {
      if (this.lastSynced === 0 && fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.collections = parsed;
        }
      }
    } catch (e) {}
  }`;

if (api.includes(oldLoad)) {
  api = api.replace(oldLoad, newLoad);
  console.log('[+] api/index.js: MemoryStore.load() patched to prevent overwriting cloud sync.');
}

// 1b. Add POST /api/admin/teams/reset-all-points & POST /api/admin/teams/purge-all
const resetAllRoute = `    // ─────────────────────────────────────────────────────────
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
      await memoryStore.syncToCloud();
      memoryStore.logEvent('RESET_ALL_POINTS', \`Game Master reset all points, cards, and checkpoint progress to 0 for \${teamCount} squads.\`);
      return sendJson(res, 200, { success: true, message: \`All squad scores and progress reset to 0 (\${teamCount} squads affected).\` }, 'no-store, no-cache, max-age=0');
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
      await memoryStore.syncToCloud();
      memoryStore.logEvent('PURGE_ALL_TEAMS', \`Game Master permanently purged all squads (\${purgedTeamsCount}) and non-admin operatives.\`);
      return sendJson(res, 200, { success: true, message: \`All \${purgedTeamsCount} squads and operative accounts purged successfully.\` }, 'no-store, no-cache, max-age=0');
    }

    // ─────────────────────────────────────────────────────────
    // 6c. POST /api/admin/teams/remove`;

if (!api.includes('/api/admin/teams/purge-all')) {
  api = api.replace("    // ─────────────────────────────────────────────────────────\n    // 6c. POST /api/admin/teams/remove", resetAllRoute);
  console.log('[+] api/index.js: reset-all-points and purge-all endpoints added.');
}

// 1c. Ensure POST /api/game/state awaits syncToCloud and returns fresh state
const oldPostCountdown = `          gs.status = 'COUNTDOWN';
          gs.durationMinutes = durMins;
          gs.durationSeconds = durSecs;
          gs.countdownStartAt = new Date(now).toISOString();
          gs.countdownEndsAt = new Date(now + cdMs).toISOString();
          gs.startedAt = new Date(now + cdMs).toISOString();
          gs.endsAt = new Date(now + cdMs + durSecs * 1000).toISOString();
          gs.pausedAt = null;
          gs.totalPausedMs = 0;
          gs.endedAt = null;

          memoryStore.save();`;

const newPostCountdown = `          gs.status = 'COUNTDOWN';
          gs.durationMinutes = durMins;
          gs.durationSeconds = durSecs;
          gs.countdownStartAt = new Date(now).toISOString();
          gs.countdownEndsAt = new Date(now + cdMs).toISOString();
          gs.startedAt = new Date(now + cdMs).toISOString();
          gs.endsAt = new Date(now + cdMs + durSecs * 1000).toISOString();
          gs.pausedAt = null;
          gs.totalPausedMs = 0;
          gs.endedAt = null;

          await memoryStore.syncToCloud();`;

if (api.includes(oldPostCountdown)) {
  api = api.replace(oldPostCountdown, newPostCountdown);
  console.log('[+] api/index.js: COUNTDOWN start awaits syncToCloud.');
}

// 1d. Fix Cache-Control in GET /api/game/state to no-store
api = api.replace(
  "durationMinutes: gs.durationMinutes\n        }, 'public, max-age=1, s-maxage=1, stale-while-revalidate=2', req);",
  "durationMinutes: gs.durationMinutes,\n          countdownEndsAt: gs.countdownEndsAt,\n          startedAt: gs.startedAt,\n          endsAt: gs.endsAt\n        }, 'no-store, no-cache, must-revalidate, max-age=0', req);"
);

// 1e. Fix Cache-Control in GET /api/teams to no-store
api = api.replace(
  "return sendJson(res, 200, { success: true, teams: memoryStore.collections.teams }, 'public, max-age=1, s-maxage=1, stale-while-revalidate=1', req);",
  "return sendJson(res, 200, { success: true, teams: memoryStore.collections.teams }, 'no-store, no-cache, must-revalidate, max-age=0', req);"
);

fs.writeFileSync('api/index.js', api, 'utf8');

// ============================================================================
// 2. UPDATE web_server/server.js
// ============================================================================
let srv = fs.readFileSync('web_server/server.js', 'utf8');

const srvResetAllRoute = `      // 6c-1. POST /api/admin/teams/reset-all-points
      if (pathname === '/api/admin/teams/reset-all-points' && req.method === 'POST') {
        const teamCount = (db.collections.teams || []).length;
        (db.collections.teams || []).forEach(t => {
          t.score = 0;
          t.cards = [];
          t.visitedZones = [];
          t.currentClueIndex = 0;
          t.updatedAt = new Date().toISOString();
        });
        db.collections.checkins = [];
        await db.syncToCloud();
        db.logEvent('RESET_ALL_POINTS', \`Game Master reset all points, cards, and checkpoint progress to 0 for \${teamCount} squads.\`);
        return sendJson(res, 200, { success: true, message: \`All squad scores and progress reset to 0 (\${teamCount} squads affected).\` }, 'no-store, no-cache, max-age=0');
      }

      // 6c-2. POST /api/admin/teams/purge-all
      if (pathname === '/api/admin/teams/purge-all' && req.method === 'POST') {
        const purgedTeamsCount = (db.collections.teams || []).length;
        db.collections.teams = [];
        db.collections.users = (db.collections.users || []).filter(u => u.role === 'ADMIN');
        db.collections.checkins = [];
        await db.syncToCloud();
        db.logEvent('PURGE_ALL_TEAMS', \`Game Master permanently purged all squads (\${purgedTeamsCount}) and non-admin operatives.\`);
        return sendJson(res, 200, { success: true, message: \`All \${purgedTeamsCount} squads and operative accounts purged successfully.\` }, 'no-store, no-cache, max-age=0');
      }

      // 6c. POST /api/admin/teams/remove`;

if (!srv.includes('/api/admin/teams/purge-all')) {
  srv = srv.replace("      // 6c. POST /api/admin/teams/remove", srvResetAllRoute);
  console.log('[+] web_server/server.js: reset-all-points and purge-all endpoints added.');
}

fs.writeFileSync('web_server/server.js', srv, 'utf8');

console.log('=== API GATEWAY REFINEMENTS COMPLETED ===');
