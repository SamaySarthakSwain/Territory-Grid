const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'web_server', 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

const targetStart = "if (pathname === '/api/auth/status' && req.method === 'GET') {";
const targetIdx = content.indexOf(targetStart);

if (targetIdx !== -1) {
  const blockEnd = "return sendJson(res, 200, {\n          success: true,\n          _id: user._id,\n          callsign: user.callsign,\n          role: user.role,\n          isApproved: !!user.isApproved,\n          teamId: user.teamId,\n          status: user.isApproved ? 'AUTHORIZED' : 'WAITING_APPROVAL'\n        });\n      }";
  const endIdx = content.indexOf(blockEnd, targetIdx);
  if (endIdx !== -1) {
    const fullOldBlock = content.substring(targetIdx, endIdx + blockEnd.length);
    const newBlock = `if (pathname === '/api/auth/status' && req.method === 'GET') {
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

    content = content.replace(fullOldBlock, newBlock);
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('Successfully updated /api/auth/status in web_server/server.js');
  } else {
    console.error('Could not find blockEnd');
  }
} else {
  console.error('Could not find targetStart');
}
