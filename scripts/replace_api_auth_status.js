const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.js');
let content = fs.readFileSync(apiPath, 'utf8');

const startTarget = "if (pathname === '/api/auth/status' && req.method === 'GET') {";
const endTarget = "if (pathname === '/api/admin/pending' && req.method === 'GET') {";

const sIdx = content.indexOf(startTarget);
const eIdx = content.indexOf(endTarget);

if (sIdx !== -1 && eIdx !== -1) {
  const newBlock = `if (pathname === '/api/auth/status' && req.method === 'GET') {
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
    `;

  content = content.substring(0, sIdx) + newBlock + content.substring(eIdx);
  fs.writeFileSync(apiPath, content, 'utf8');
  console.log('Successfully replaced /api/auth/status in api/index.js');
} else {
  console.error('Could not find start or end targets in api/index.js');
}
