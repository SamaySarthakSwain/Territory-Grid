const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'web_server', 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Update /api/admin/pending and /api/admin/approve
const oldPendingAndApprove = `      // 4. GET /api/admin/pending (List all pending approvals)
      if (pathname === '/api/admin/pending' && req.method === 'GET') {
        db.load();
        const pendingMarshals = db.collections.users.filter(u => !u.isApproved && u.role === 'MEMBER');
        const pendingTeams = db.collections.teams.filter(t => !t.isApproved);

        return sendJson(res, 200, {
          success: true,
          count: pendingMarshals.length + pendingTeams.length,
          users: pendingMarshals,
          teams: pendingTeams
        });
      }

      // 5. POST /api/admin/approve (Approve Team or Marshal)
      if (pathname === '/api/admin/approve' && req.method === 'POST') {
        db.load();
        const body = await parseBody(req);
        const { type, id } = body;
        const isTeam = String(type || '').toUpperCase() === 'TEAM';

        if (isTeam) {
          const team = db.collections.teams.find(t => t._id === id);
          if (team) {
            team.isApproved = true;
            // Also approve all squad users with this teamId or matching callsign
            db.collections.users.forEach(u => {
              if (u.teamId === id || (team.callsign && u.callsign && u.callsign.toLowerCase() === team.callsign.toLowerCase())) {
                u.isApproved = true;
              }
            });
            db.save();
            db.logEvent('APPROVE_TEAM', \`Squad authorized: "\${team.name}" (\${team._id})\`);
            return sendJson(res, 200, { success: true, message: \`Squad "\${team.name}" approved.\` });
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
            db.logEvent('APPROVE_USER', \`Marshal authorized: "\${user.callsign}" (\${user.role})\`);
            return sendJson(res, 200, { success: true, message: \`Operative "\${user.callsign}" approved.\` });
          }
        }

        return sendJson(res, 404, { success: false, error: 'Entity not found.' });
      }`;

const newPendingAndApprove = `      // 4. GET /api/admin/pending (List all pending approvals with auto-heal sync)
      if (pathname === '/api/admin/pending' && req.method === 'GET') {
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
          db.save();
          const logAction = approvedRole === 'MEMBER' ? 'APPROVE_USER' : 'APPROVE_TEAM';
          const logMsg = approvedRole === 'MEMBER'
            ? \`Field Marshal authorized: "\${approvedName}" (\${cleanId})\`
            : \`Squad authorized: "\${approvedName}" (\${cleanId})\`;
          db.logEvent(logAction, logMsg);
          return sendJson(res, 200, { success: true, message: \`\${approvedName} clearance authorized.\`, entityId: cleanId });
        }

        return sendJson(res, 404, { success: false, error: \`Clearance entity "\${cleanId}" not found in database.\` });
      }`;

if (content.includes(oldPendingAndApprove)) {
  content = content.replace(oldPendingAndApprove, newPendingAndApprove);
  console.log('Successfully updated /api/admin/pending and /api/admin/approve in web_server/server.js');
} else {
  console.error('Could not find oldPendingAndApprove in web_server/server.js');
}

// 2. Update /api/auth/status
const oldAuthStatus = `      // 8. GET /api/auth/status (Waiting Hall Live Polling)
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
      }`;

const newAuthStatus = `      // 8. GET /api/auth/status (Waiting Hall Live Polling with Auto-Sync & Persistence)
      if (pathname === '/api/auth/status' && req.method === 'GET') {
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
      }`;

if (content.includes(oldAuthStatus)) {
  content = content.replace(oldAuthStatus, newAuthStatus);
  console.log('Successfully updated /api/auth/status in web_server/server.js');
} else {
  console.error('Could not find oldAuthStatus in web_server/server.js');
}

fs.writeFileSync(serverPath, content, 'utf8');
console.log('web_server/server.js updated successfully!');
