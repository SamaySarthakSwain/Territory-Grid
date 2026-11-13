const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.js');
let content = fs.readFileSync(apiPath, 'utf8');

// Replace /api/admin/pending and /api/admin/approve in api/index.js
const pendingStart = "if (pathname === '/api/admin/pending' && req.method === 'GET') {";
const approveEnd = "return sendJson(res, 404, { success: false, error: 'Entity not found.' });\n    }";

const pIdx = content.indexOf(pendingStart);
const aIdx = content.indexOf(approveEnd, pIdx);

if (pIdx !== -1 && aIdx !== -1) {
  const fullOld = content.substring(pIdx, aIdx + approveEnd.length);
  const replacement = `if (pathname === '/api/admin/pending' && req.method === 'GET') {
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
          $or: [{ _id: cleanId }, { id: cleanId }, { callsign: new RegExp('^' + cleanId + '$', 'i') }, { name: new RegExp('^' + cleanId + '$', 'i') }]
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
          $or: [{ _id: cleanId }, { id: cleanId }, { callsign: new RegExp('^' + cleanId + '$', 'i') }]
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
          memoryStore.logEvent('APPROVE_CLEARANCE', \`Clearance authorized: "\${approvedName}" (\${cleanId})\`);
          return sendJson(res, 200, { success: true, message: \`\${approvedName} approved successfully.\`, entityId: cleanId });
        }

        return sendJson(res, 404, { success: false, error: \`Entity "\${cleanId}" not found in database.\` });
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
        memoryStore.save();
        const logAction = approvedRole === 'MEMBER' ? 'APPROVE_USER' : 'APPROVE_TEAM';
        const logMsg = approvedRole === 'MEMBER'
          ? \`Field Marshal authorized: "\${approvedName}" (\${cleanId})\`
          : \`Squad authorized: "\${approvedName}" (\${cleanId})\`;
        memoryStore.logEvent(logAction, logMsg);
        return sendJson(res, 200, { success: true, message: \`\${approvedName} authorized successfully.\`, entityId: cleanId });
      }

      return sendJson(res, 404, { success: false, error: \`Clearance entity "\${cleanId}" not found in database.\` });
    }`;

  content = content.replace(fullOld, replacement);
  console.log('Successfully updated /api/admin/pending and /api/admin/approve in api/index.js');
} else {
  console.error('Could not locate pending/approve block in api/index.js');
}

// Update /api/auth/status in api/index.js
const authStatusStart = "if (pathname === '/api/auth/status' && req.method === 'GET') {";
const authStatusEnd = "return sendJson(res, 200, {\n        success: true,\n        _id: user._id,\n        callsign: user.callsign,\n        role: user.role,\n        isApproved: user.isApproved,\n        teamId: user.teamId,\n        status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL'\n      });\n    }";

const sIdx = content.indexOf(authStatusStart);
const eIdx = content.indexOf(authStatusEnd, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
  const fullOldAuth = content.substring(sIdx, eIdx + authStatusEnd.length);
  const newAuthBlock = `if (pathname === '/api/auth/status' && req.method === 'GET') {
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
    }`;

  content = content.replace(fullOldAuth, newAuthBlock);
  console.log('Successfully updated /api/auth/status in api/index.js');
} else {
  console.error('Could not locate /api/auth/status block in api/index.js');
}

fs.writeFileSync(apiPath, content, 'utf8');
console.log('Finished updating api/index.js!');
