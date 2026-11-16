const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// =====================================================================
// 1. PATCH api/index.js
// =====================================================================
const apiPath = path.join(rootDir, 'api', 'index.js');
let apiCode = fs.readFileSync(apiPath, 'utf8');

// A. In GET /api/player/sync: Return top 5 leaderboard teams in payload
const oldSyncLeaderboard = `      const myRank = approvedTeams.findIndex(t => t._id === myTeam._id);
      const activeClues = getActiveMarshalClues(allClues, allUsers);
      const activeClue = resolveTeamTargetClue(myTeam, activeClues);
      const teamCheckins = allCheckins.filter(c => c.teamId === myTeam._id);
      const lastCheckin = teamCheckins[0] || null;
      let gs = {};
      if (atlasDb) {
        gs = await atlasDb.collection('gameState').findOne({ _id: 'global_state' }) || {};
      } else {
        gs = memoryStore.collections.gameState || {};
      }

      return sendJson(res, 200, {
        success: true,
        teamId: myTeam._id,
        teamName: myTeam.name || myTeam.callsign,
        callsign: myTeam.callsign,
        score: myTeam.score || 0,
        currentClueIndex: myTeam.currentClueIndex || 0,
        visitedZones: myTeam.visitedZones || [],
        cards: myTeam.cards || [],
        cardsCount: (myTeam.cards || []).length,
        rank: myRank >= 0 ? (myRank + 1) : null,
        totalApprovedTeams: approvedTeams.length,`;

const newSyncLeaderboard = `      const myRank = approvedTeams.findIndex(t => t._id === myTeam._id);
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
        teamName: myTeam.name || myTeam.callsign,
        callsign: myTeam.callsign,
        score: myTeam.score || 0,
        currentClueIndex: myTeam.currentClueIndex || 0,
        visitedZones: myTeam.visitedZones || [],
        cards: myTeam.cards || [],
        cardsCount: (myTeam.cards || []).length,
        rank: myRank >= 0 ? (myRank + 1) : null,
        totalApprovedTeams: approvedTeams.length,
        leaderboard: topLeaderboard,`;

apiCode = apiCode.replace(oldSyncLeaderboard.replace(/\r\n/g, '\n'), newSyncLeaderboard);
apiCode = apiCode.replace(oldSyncLeaderboard, newSyncLeaderboard);
console.log('✅ Updated GET /api/player/sync with topLeaderboard');

// B. In GET /api/clues: strictly return getActiveMarshalClues when showAll is false
const oldGetClues = `    if (pathname === '/api/clues' && req.method === 'GET') {
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
    }`;

const newGetClues = `    if (pathname === '/api/clues' && req.method === 'GET') {
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
    }`;

apiCode = apiCode.replace(oldGetClues.replace(/\r\n/g, '\n'), newGetClues);
apiCode = apiCode.replace(oldGetClues, newGetClues);
console.log('✅ Updated GET /api/clues to use active marshal stations only');

fs.writeFileSync(apiPath, apiCode, 'utf8');
console.log('🎉 Successfully saved api/index.js');


// =====================================================================
// 2. PATCH public/admin_panel.html (Instant smooth Revoke & Card IDs)
// =====================================================================
const adminPath = path.join(rootDir, 'public', 'admin_panel.html');
let adminCode = fs.readFileSync(adminPath, 'utf8');

// A. Add IDs to cards in loadApprovedRoster()
const oldSquadCard = `        // Approved Squads
        approvedTeams.forEach(function(team) {
          var teamId = team._id || team.id;
          html += '<div class="neon-card rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border-cyan/30 bg-[#071322] hover:border-cyan/60 transition">' +`;

const newSquadCard = `        // Approved Squads
        approvedTeams.forEach(function(team) {
          var teamId = team._id || team.id;
          html += '<div id="card-approved-TEAM-' + teamId + '" class="neon-card rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border-cyan/30 bg-[#071322] hover:border-cyan/60 transition">' +`;

adminCode = adminCode.replace(oldSquadCard.replace(/\r\n/g, '\n'), newSquadCard);
adminCode = adminCode.replace(oldSquadCard, newSquadCard);

const oldMarshalCard = `        // Approved Marshals
        approvedMarshals.forEach(function(user) {
          var userId = user._id || user.id;
          html += '<div class="neon-card rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border-green/30 bg-[#061814] hover:border-green/60 transition">' +`;

const newMarshalCard = `        // Approved Marshals
        approvedMarshals.forEach(function(user) {
          var userId = user._id || user.id;
          html += '<div id="card-approved-USER-' + userId + '" class="neon-card rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border-green/30 bg-[#061814] hover:border-green/60 transition">' +`;

adminCode = adminCode.replace(oldMarshalCard.replace(/\r\n/g, '\n'), newMarshalCard);
adminCode = adminCode.replace(oldMarshalCard, newMarshalCard);

// B. Replace rejectEntity with instant smooth optimistic removal
const oldRejectEntity = `    async function rejectEntity(type, id) {
      if (!confirm('Are you sure you want to reject/revoke clearance for this entry?')) return;
      var cardPending = document.getElementById('card-pending-' + type + '-' + id);
      if (cardPending) {
        cardPending.style.opacity = '0.3';
        cardPending.style.transform = 'scale(0.95)';
        setTimeout(function() {
          if (cardPending && cardPending.parentNode) cardPending.remove();
        }, 300);
      }

      try {
        var res = await fetch(apiUrl('/api/admin/reject'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, id: id })
        });
        var data = await res.json();
        if (data.success) {
          loadPendingApprovals();
          loadApprovedRoster();
          loadLeaderboard();
          loadDatabaseData();
        }
      } catch (e) {
        alert('Reject error: ' + e.message);
        loadPendingApprovals();
        loadApprovedRoster();
      }
    }`;

const newRejectEntity = `    async function rejectEntity(type, id) {
      // Instant Optimistic Removal: 0ms UI latency, buttery smooth animation
      var cardApproved = document.getElementById('card-approved-' + type + '-' + id);
      var cardPending = document.getElementById('card-pending-' + type + '-' + id);
      var targetCard = cardApproved || cardPending;

      if (targetCard) {
        targetCard.style.transition = 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
        targetCard.style.opacity = '0';
        targetCard.style.transform = 'scale(0.92) translateY(-10px)';
        targetCard.style.pointerEvents = 'none';
        setTimeout(function() {
          if (targetCard && targetCard.parentNode) targetCard.remove();
        }, 300);
      }

      // Optimistically decrement active count badge immediately
      if (cardApproved) {
        var badge = document.getElementById('badge-approved-total');
        if (badge) {
          var cur = parseInt(badge.innerText, 10) || 0;
          if (cur > 0) badge.innerText = (cur - 1) + ' ACTIVE';
        }
        if (type === 'TEAM') {
          var st = document.getElementById('stat-teams-count');
          if (st) { var c = parseInt(st.innerText, 10) || 0; if (c > 0) st.innerText = c - 1; }
        } else if (type === 'USER') {
          var sm = document.getElementById('stat-marshals-count');
          if (sm) { var c = parseInt(sm.innerText, 10) || 0; if (c > 0) sm.innerText = c - 1; }
        }
      } else if (cardPending) {
        var bp = document.getElementById('badge-pending');
        if (bp) {
          var curP = parseInt(bp.innerText, 10) || 0;
          if (curP > 0) bp.innerText = curP - 1;
        }
      }

      // Invalidate hash so subsequent polls will sync fresh state
      lastRenderedApprovedHash = null;

      // Dispatch non-blocking asynchronous revocation
      fetch(apiUrl('/api/admin/reject'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, id: id })
      }).then(function(res) {
        return res.json();
      }).then(function(data) {
        if (data.success) {
          loadApprovedRoster();
          loadPendingApprovals();
          loadLeaderboard();
        } else {
          loadApprovedRoster();
        }
      }).catch(function(err) {
        console.warn('Revocation background sync err:', err);
        loadApprovedRoster();
      });
    }`;

adminCode = adminCode.replace(oldRejectEntity.replace(/\r\n/g, '\n'), newRejectEntity);
adminCode = adminCode.replace(oldRejectEntity, newRejectEntity);
console.log('✅ Updated rejectEntity in admin_panel.html with instant optimistic UI');

// C. Tighten polling interval to 1400ms for ultra-responsive live dashboard
adminCode = adminCode.replace(/}, 2200\);/g, '}, 1400);');
console.log('✅ Tightened admin tab polling interval to 1400ms');

fs.writeFileSync(adminPath, adminCode, 'utf8');
console.log('🎉 Successfully saved public/admin_panel.html');


// =====================================================================
// 3. PATCH public/player_dashboard.html (Scanner & Celebration Handlers)
// =====================================================================
const playerPath = path.join(rootDir, 'public', 'player_dashboard.html');
let playerCode = fs.readFileSync(playerPath, 'utf8');

// A. Change clue loading to role=PLAYER
playerCode = playerCode.replace(
  "var res = await fetch(apiUrl('/api/clues?all=true&_t=') + Date.now(), { cache: 'no-store' });",
  "var res = await fetch(apiUrl('/api/clues?role=PLAYER&_t=') + Date.now(), { cache: 'no-store' });"
);
console.log('✅ Updated clue loading to role=PLAYER in player_dashboard.html');

// B. Update resolveTeamTargetClue in player_dashboard.html to filter out visited zones
const oldClientTargetClue = `    function resolveTeamTargetClue(team, clues, teamsList) {
      if (!clues || clues.length === 0) return null;
      var route = resolveTeamRoute(team, clues, teamsList);
      var currentIdx = (team && typeof team.currentClueIndex === 'number') ? team.currentClueIndex : 0;
      if (currentIdx >= route.length) return null;
      return route[currentIdx];
    }`;

const newClientTargetClue = `    function resolveTeamTargetClue(team, clues, teamsList) {
      if (!clues || clues.length === 0) return null;
      var route = resolveTeamRoute(team, clues, teamsList);
      var visitedSet = new Set((team.visitedZones || []).map(function(z) {
        return String(z).toUpperCase().replace(/[^A-Z0-9]/g, '');
      }));
      for (var i = 0; i < route.length; i++) {
        var norm = String(route[i].zoneId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!visitedSet.has(norm)) {
          return route[i];
        }
      }
      return null;
    }`;

playerCode = playerCode.replace(oldClientTargetClue.replace(/\r\n/g, '\n'), newClientTargetClue);
playerCode = playerCode.replace(oldClientTargetClue, newClientTargetClue);
console.log('✅ Updated resolveTeamTargetClue in player_dashboard.html to never repeat visited stations');

// C. In syncTeamData: use syncData.leaderboard if available
const oldSyncDataApply = `            if (syncData.success && syncData.teamId) {
              applyPlayerSyncData(syncData);
              return;
            }`;

const newSyncDataApply = `            if (syncData.success && syncData.teamId) {
              applyPlayerSyncData(syncData);
              if (Array.isArray(syncData.leaderboard) && syncData.leaderboard.length > 0) {
                renderMiniLeaderboard(syncData.leaderboard, syncData.teamId);
              }
              return;
            }`;

playerCode = playerCode.replace(oldSyncDataApply.replace(/\r\n/g, '\n'), newSyncDataApply);
playerCode = playerCode.replace(oldSyncDataApply, newSyncDataApply);
console.log('✅ Updated syncTeamData to render mini leaderboard from syncData');

// D. Add missing functions: showCheckpointClearedModal, dismissCheckpointClearedModal,
//    openPlayerScannerModal, closePlayerScannerModal, handlePlayerBeaconScan
const missingFunctions = `
    // ─────────────────────────────────────────────────────────
    // CHECKPOINT CLEARED CELEBRATION MODAL ENGINE
    // ─────────────────────────────────────────────────────────
    function showCheckpointClearedModal(pointsAwarded, totalScore, nextStationName, nextClueText) {
      var modal = document.getElementById('checkpoint-cleared-modal');
      if (!modal) return;
      playUnlockChirp();

      var ptsEl = document.getElementById('cleared-points-label');
      if (ptsEl) ptsEl.innerText = '+' + (pointsAwarded || 25) + ' PTS AWARDED';

      var scoreEl = document.getElementById('cleared-total-score');
      if (scoreEl) scoreEl.innerText = (totalScore !== undefined ? totalScore : '--') + ' PTS';

      var stationEl = document.getElementById('cleared-next-station');
      if (stationEl) stationEl.innerText = nextStationName || 'Station Area';

      var clueEl = document.getElementById('cleared-next-clue');
      if (clueEl) clueEl.innerText = nextClueText ? ('“' + nextClueText + '”') : '“Proceed to assigned campus checkpoint...”';

      modal.classList.remove('hidden');
    }

    function dismissCheckpointClearedModal() {
      var modal = document.getElementById('checkpoint-cleared-modal');
      if (modal) modal.classList.add('hidden');
      rotateCardCipher(true);
    }

    // ─────────────────────────────────────────────────────────
    // PLAYER STATION CAMERA SCANNER ENGINE
    // ─────────────────────────────────────────────────────────
    var playerHtml5QrCode = null;
    var isPlayerScanning = false;

    async function openPlayerScannerModal() {
      var modal = document.getElementById('player-scanner-modal');
      var alertEl = document.getElementById('player-scanner-alert');
      if (alertEl) { alertEl.classList.add('hidden'); alertEl.innerText = ''; }
      if (modal) modal.classList.remove('hidden');

      try {
        if (!playerHtml5QrCode) {
          playerHtml5QrCode = new Html5Qrcode('player-qr-reader');
        }
        isPlayerScanning = true;
        await playerHtml5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          function(decodedText) {
            handlePlayerBeaconScan(decodedText);
          },
          function(error) { /* frame search ignore */ }
        );
      } catch (err) {
        console.warn('Player camera open error:', err);
        isPlayerScanning = false;
        if (alertEl) {
          alertEl.className = 'w-full p-2.5 rounded-xl bg-error/15 border border-error/40 text-error text-xs font-mono text-center';
          alertEl.innerText = 'Camera access unavailable: ' + (err.message || err);
          alertEl.classList.remove('hidden');
        }
      }
    }

    function closePlayerScannerModal() {
      var modal = document.getElementById('player-scanner-modal');
      if (playerHtml5QrCode && isPlayerScanning) {
        playerHtml5QrCode.stop().then(function() {
          isPlayerScanning = false;
          if (modal) modal.classList.add('hidden');
        }).catch(function() {
          isPlayerScanning = false;
          if (modal) modal.classList.add('hidden');
        });
      } else {
        isPlayerScanning = false;
        if (modal) modal.classList.add('hidden');
      }
    }

    async function handlePlayerBeaconScan(decodedText) {
      if (!decodedText) return;
      try {
        if (playerHtml5QrCode && isPlayerScanning) {
          await playerHtml5QrCode.stop();
          isPlayerScanning = false;
        }
      } catch(e) {}

      var teamId = (currentMyTeam && currentMyTeam._id) ? currentMyTeam._id : (currentUser ? currentUser.teamId : null);
      var alertEl = document.getElementById('player-scanner-alert');

      if (!teamId) {
        if (alertEl) {
          alertEl.className = 'w-full p-2.5 rounded-xl bg-error/15 border border-error/40 text-error text-xs font-mono text-center';
          alertEl.innerText = 'Cannot verify: squad profile not synchronized.';
          alertEl.classList.remove('hidden');
        }
        return;
      }

      if (alertEl) {
        alertEl.className = 'w-full p-2.5 rounded-xl bg-cyan/15 border border-cyan/40 text-cyan text-xs font-mono text-center';
        alertEl.innerText = '⚡ Transmitting checkpoint beacon clearance...';
        alertEl.classList.remove('hidden');
      }

      try {
        var res = await fetch(apiUrl('/api/checkin'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: teamId,
            qrPayload: decodedText,
            cone: 'GREEN',
            cardRank: 13,
            cardSuit: '♠',
            memberId: 'self_scan_beacon'
          })
        });

        var data = await res.json();
        if (!data.success) {
          if (alertEl) {
            alertEl.className = 'w-full p-2.5 rounded-xl bg-error/15 border border-error/40 text-error text-xs font-mono text-center';
            alertEl.innerText = data.error || 'Check-in failed.';
            alertEl.classList.remove('hidden');
          }
          return;
        }

        // Checkpoint Cleared! Close scanner and trigger celebration
        closePlayerScannerModal();
        playUnlockChirp();

        if (currentMyTeam) {
          currentMyTeam.score = data.teamScore;
          currentMyTeam.currentClueIndex = data.nextClueIndex;
        }
        lastRecordedScore = data.teamScore;
        lastRecordedClueIndex = data.nextClueIndex;

        // Instant telemetry reload & cipher card rotation
        await syncTeamData();
        rotateCardCipher(true);

        showCheckpointClearedModal(data.pointsAwarded || 25, data.teamScore, data.nextZoneLabel, data.nextClueText);

      } catch (err) {
        if (alertEl) {
          alertEl.className = 'w-full p-2.5 rounded-xl bg-error/15 border border-error/40 text-error text-xs font-mono text-center';
          alertEl.innerText = 'Transmission error: ' + err.message;
          alertEl.classList.remove('hidden');
        }
      }
    }
`;

// Insert before </script> in player_dashboard.html
playerCode = playerCode.replace('  </script>\n\n  <!-- ==================== AAA GAMING 10-SECOND COUNTDOWN OVERLAY', missingFunctions + '\n  </script>\n\n  <!-- ==================== AAA GAMING 10-SECOND COUNTDOWN OVERLAY');
console.log('✅ Added missing celebration modal & scanner functions to player_dashboard.html');

fs.writeFileSync(playerPath, playerCode, 'utf8');
console.log('🎉 Successfully saved public/player_dashboard.html');


// =====================================================================
// 4. PATCH public/leaderboard.html (Ultra-fast 1200ms refresh rate)
// =====================================================================
const lbPath = path.join(rootDir, 'public', 'leaderboard.html');
let lbCode = fs.readFileSync(lbPath, 'utf8');

lbCode = lbCode.replace(
  'setInterval(refreshLeaderboard, 1800 + Math.floor(Math.random()*400));',
  'setInterval(refreshLeaderboard, 1200 + Math.floor(Math.random()*300));'
);
console.log('✅ Tightened leaderboard refresh interval to 1200ms');

fs.writeFileSync(lbPath, lbCode, 'utf8');
console.log('🎉 Successfully saved public/leaderboard.html');
