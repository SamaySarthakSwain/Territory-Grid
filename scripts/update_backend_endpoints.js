const fs = require('fs');
const path = require('path');

// 1. Update web_server/server.js
const serverPath = path.join(__dirname, '..', 'web_server', 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

const targetServerReject = `        if (type === 'TEAM') {
          db.collections.teams = db.collections.teams.filter(t => t._id !== id);
          db.collections.users = db.collections.users.filter(u => u.teamId !== id);
          db.save();
          db.logEvent('REJECT_TEAM', \`Squad rejected and removed: \${id}\`);
          return sendJson(res, 200, { success: true, message: 'Squad removed.' });
        } else {
          db.collections.users = db.collections.users.filter(u => u._id !== id);
          db.save();
          db.logEvent('REJECT_USER', \`Operative rejected and removed: \${id}\`);
          return sendJson(res, 200, { success: true, message: 'Operative removed.' });
        }
      }`;

const additionServer = `        if (type === 'TEAM') {
          db.collections.teams = db.collections.teams.filter(t => t._id !== id);
          db.collections.users = db.collections.users.filter(u => u.teamId !== id);
          db.save();
          db.logEvent('REJECT_TEAM', \`Squad rejected and removed: \${id}\`);
          return sendJson(res, 200, { success: true, message: 'Squad removed.' });
        } else {
          db.collections.users = db.collections.users.filter(u => u._id !== id);
          db.save();
          db.logEvent('REJECT_USER', \`Operative rejected and removed: \${id}\`);
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
        db.logEvent('RESET_POINTS', \`Game Master reset points (was \${prevScore} PTS) and cleared progress for squad: "\${team.name}" (\${team._id})\`);
        return sendJson(res, 200, { success: true, message: \`Points and progress reset to 0 for squad "\${team.name}".\` });
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
        db.logEvent('REMOVE_TEAM', \`Game Master permanently removed squad: "\${teamName}" (\${teamId}) and purged operative accounts.\`);
        return sendJson(res, 200, { success: true, message: \`Squad "\${teamName}" removed permanently.\` });
      }

      // 6d. GET /api/admin/logs (Audit Trail of all Admin & System Events)
      if (pathname === '/api/admin/logs' && req.method === 'GET') {
        db.load();
        const limit = parseInt(urlObj.searchParams.get('limit'), 10) || 200;
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
        db.logEvent('PURGE_LOGS', \`Game Master purged \${count} system audit log entries.\`);
        db.save();
        return sendJson(res, 200, { success: true, message: 'Audit logs cleared successfully.' });
      }`;

if (serverContent.includes(targetServerReject) && !serverContent.includes('/api/admin/teams/reset-points')) {
  serverContent = serverContent.replace(targetServerReject, additionServer);
  console.log('Added team reset/remove and log endpoints to web_server/server.js');
}

// Add SAVE_PLACE and DELETE_PLACE logging in server.js
const targetSavePlace = `        db.save();
        return sendJson(res, 200, { success: true, message: 'Place saved successfully.', clues: db.collections.clues });`;
const replaceSavePlace = `        db.save();
        db.logEvent('SAVE_PLACE', \`Game Master \${_id ? 'updated' : 'added'} checkpoint "\${cleanZoneId}": \${cleanLabel}\`);
        return sendJson(res, 200, { success: true, message: 'Place saved successfully.', clues: db.collections.clues });`;

if (serverContent.includes(targetSavePlace)) {
  serverContent = serverContent.replace(targetSavePlace, replaceSavePlace);
  console.log('Added SAVE_PLACE logging to server.js');
}

const targetDeletePlace = `        db.collections.clues = db.collections.clues.filter(c => c._id !== _id);
        db.save();
        return sendJson(res, 200, { success: true, message: 'Place deleted successfully.', clues: db.collections.clues });`;
const replaceDeletePlace = `        db.collections.clues = db.collections.clues.filter(c => c._id !== _id);
        db.save();
        db.logEvent('DELETE_PLACE', \`Game Master deleted checkpoint: \${_id}\`);
        return sendJson(res, 200, { success: true, message: 'Place deleted successfully.', clues: db.collections.clues });`;

if (serverContent.includes(targetDeletePlace)) {
  serverContent = serverContent.replace(targetDeletePlace, replaceDeletePlace);
  console.log('Added DELETE_PLACE logging to server.js');
}

fs.writeFileSync(serverPath, serverContent, 'utf8');

// 2. Update api/index.js
const apiPath = path.join(__dirname, '..', 'api', 'index.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

const targetApiReject = `      if (type === 'TEAM') {
        memoryStore.collections.teams = memoryStore.collections.teams.filter(t => t._id !== id);
        memoryStore.collections.users = memoryStore.collections.users.filter(u => u.teamId !== id);
      } else {
        memoryStore.collections.users = memoryStore.collections.users.filter(u => u._id !== id);
      }
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: 'Entity removed.' });
    }`;

const additionApi = `      if (type === 'TEAM') {
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

        memoryStore.logEvent('RESET_POINTS', \`Game Master reset points (was \${prevScore} PTS) and cleared progress for squad: "\${team.name}" (\${team._id})\`);
        try {
          await atlasDb.collection('system_logs').insertOne({
            _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            action: 'RESET_POINTS',
            details: \`Game Master reset points (was \${prevScore} PTS) for squad: "\${team.name}"\`,
            timestamp: new Date().toISOString()
          });
        } catch(e){}

        return sendJson(res, 200, { success: true, message: \`Points and progress reset to 0 for squad "\${team.name}".\` });
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
      memoryStore.logEvent('RESET_POINTS', \`Game Master reset points (was \${prevScore} PTS) and progress for squad: "\${team.name}" (\${team._id})\`);
      return sendJson(res, 200, { success: true, message: \`Points and progress reset to 0 for squad "\${team.name}".\` });
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

        memoryStore.logEvent('REMOVE_TEAM', \`Game Master permanently removed squad: "\${teamName}" (\${teamId})\`);
        try {
          await atlasDb.collection('system_logs').insertOne({
            _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            action: 'REMOVE_TEAM',
            details: \`Game Master permanently removed squad: "\${teamName}"\`,
            timestamp: new Date().toISOString()
          });
        } catch(e){}

        return sendJson(res, 200, { success: true, message: \`Squad "\${teamName}" removed permanently.\` });
      }

      const team = memoryStore.collections.teams.find(t => t._id === teamId || (t.id && t.id === teamId));
      const teamName = team ? team.name : teamId;

      memoryStore.collections.teams = memoryStore.collections.teams.filter(t => t._id !== teamId && t.id !== teamId);
      memoryStore.collections.users = memoryStore.collections.users.filter(u => u.teamId !== teamId && u.callsign !== teamName);
      memoryStore.collections.checkins = (memoryStore.collections.checkins || []).filter(c => c.teamId !== teamId && c.team !== teamId);
      memoryStore.save();
      memoryStore.logEvent('REMOVE_TEAM', \`Game Master permanently removed squad: "\${teamName}" (\${teamId})\`);
      return sendJson(res, 200, { success: true, message: \`Squad "\${teamName}" removed permanently.\` });
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
      memoryStore.logEvent('PURGE_LOGS', \`Game Master purged \${count} system audit log entries.\`);
      memoryStore.save();
      return sendJson(res, 200, { success: true, message: 'Audit logs cleared successfully.' });
    }`;

if (apiContent.includes(targetApiReject) && !apiContent.includes('/api/admin/teams/reset-points')) {
  apiContent = apiContent.replace(targetApiReject, additionApi);
  console.log('Added team reset/remove and log endpoints to api/index.js');
}

fs.writeFileSync(apiPath, apiContent, 'utf8');
console.log('Backend endpoints updated successfully!');
