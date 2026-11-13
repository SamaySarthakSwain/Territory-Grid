const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// 1. UPDATE public/admin_panel.html
// ─────────────────────────────────────────────────────────────
const adminPath = path.join(__dirname, '..', 'public', 'admin_panel.html');
let adminHtml = fs.readFileSync(adminPath, 'utf8');

// Replace loadPendingApprovals and approveEntity with robust versions
const oldPendingApprovalsFunc = adminHtml.indexOf('async function loadPendingApprovals() {');
const oldRejectFunc = adminHtml.indexOf('async function rejectEntity(type, id) {');

if (oldPendingApprovalsFunc !== -1 && oldRejectFunc !== -1) {
  const replacement = `var inFlightApprovals = {};

    // Load Pending Approvals (Waiting Hall with in-flight suppression)
    async function loadPendingApprovals() {
      if (isLoadingPending) return;
      isLoadingPending = true;
      try {
        var res = await fetch('/api/admin/pending?_t=' + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (data.success) {
          // Filter out entities currently being processed to prevent UI flicker
          var pendingTeams = (data.teams || []).filter(function(t) {
            var tid = t._id || t.id;
            return !inFlightApprovals[tid] && !inFlightApprovals[t.callsign];
          });
          var pendingMarshals = (data.users || []).filter(function(u) {
            var uid = u._id || u.id;
            return u.role === 'MEMBER' && !inFlightApprovals[uid] && !inFlightApprovals[u.callsign];
          });
          var realCount = pendingTeams.length + pendingMarshals.length;

          var badgePending = document.getElementById('badge-pending');
          if (badgePending) badgePending.innerText = realCount;
          var statPending = document.getElementById('stat-pending-count');
          if (statPending) statPending.innerText = realCount;

          var listContainer = document.getElementById('pending-items-list');
          if (!listContainer) return;

          if (realCount === 0) {
            listContainer.innerHTML = '<div class="text-center py-8 text-gray-400 font-mono text-xs">No pending requests. All squads and marshals are clear!</div>';
            pendingItemsCache = {};
            return;
          }

          var html = '';
          pendingItemsCache = {};

          // Pending Teams
          pendingTeams.forEach(function(team) {
            var teamId = team._id || team.id;
            pendingItemsCache['TEAM_' + teamId] = team;
            html += '<div id="card-pending-TEAM-' + teamId + '" class="neon-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border-yellow/30 bg-[#091122] transition-all duration-300">' +
              '<div class="flex items-center gap-3">' +
                '<div class="w-10 h-10 rounded-lg bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan">' +
                  '<span class="material-symbols-outlined">sports_esports</span>' +
                '</div>' +
                '<div>' +
                  '<div class="flex items-center gap-2">' +
                    '<h4 class="font-headline font-bold text-white text-sm">' + (team.name || team.callsign) + '</h4>' +
                    '<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan/20 text-cyan border border-cyan/30">SQUAD</span>' +
                  '</div>' +
                  '<p class="text-xs text-gray-400 font-mono">Callsign: <b>' + (team.callsign || team.name) + '</b> • Registered: ' + (team.createdAt ? new Date(team.createdAt).toLocaleTimeString() : 'Recent') + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-2" id="actions-TEAM-' + teamId + '">' +
                '<button onclick="approveEntity(\\'TEAM\\', \\'' + teamId + '\\')" class="px-4 py-2 rounded-xl bg-green text-black font-headline font-bold text-xs flex items-center gap-1 hover:shadow-[0_0_12px_rgba(0,255,136,0.6)] active:scale-95 transition cursor-pointer">' +
                  '<span class="material-symbols-outlined text-sm">check</span> <span>APPROVE SQUAD</span>' +
                '</button>' +
                '<button onclick="rejectEntity(\\'TEAM\\', \\'' + teamId + '\\')" class="px-3 py-2 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-headline font-bold text-xs hover:bg-red-500/20 active:scale-95 transition cursor-pointer">' +
                  '<span class="material-symbols-outlined text-sm">close</span> <span>REJECT</span>' +
                '</button>' +
              '</div>' +
            '</div>';
          });

          // Pending Marshals
          pendingMarshals.forEach(function(user) {
            var userId = user._id || user.id;
            pendingItemsCache['USER_' + userId] = user;
            html += '<div id="card-pending-USER-' + userId + '" class="neon-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border-yellow/30 bg-[#091122] transition-all duration-300">' +
              '<div class="flex items-center gap-3">' +
                '<div class="w-10 h-10 rounded-lg bg-green/20 border border-green/40 flex items-center justify-center text-green">' +
                  '<span class="material-symbols-outlined">badge</span>' +
                '</div>' +
                '<div>' +
                  '<div class="flex items-center gap-2">' +
                    '<h4 class="font-headline font-bold text-white text-sm">' + (user.name || user.callsign) + '</h4>' +
                    '<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-green/20 text-green border border-green/30">FIELD MARSHAL</span>' +
                  '</div>' +
                  '<p class="text-xs text-gray-400 font-mono">Callsign: <b>' + user.callsign + '</b> • Assigned: <b>' + (user.zoneLabel || user.zoneId || 'Station') + '</b></p>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-2" id="actions-USER-' + userId + '">' +
                '<button onclick="approveEntity(\\'USER\\', \\'' + userId + '\\')" class="px-4 py-2 rounded-xl bg-green text-black font-headline font-bold text-xs flex items-center gap-1 hover:shadow-[0_0_12px_rgba(0,255,136,0.6)] active:scale-95 transition cursor-pointer">' +
                  '<span class="material-symbols-outlined text-sm">check</span> <span>APPROVE MARSHAL</span>' +
                '</button>' +
                '<button onclick="rejectEntity(\\'USER\\', \\'' + userId + '\\')" class="px-3 py-2 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-headline font-bold text-xs hover:bg-red-500/20 active:scale-95 transition cursor-pointer">' +
                  '<span class="material-symbols-outlined text-sm">close</span> <span>REJECT</span>' +
                '</button>' +
              '</div>' +
            '</div>';
          });

          listContainer.innerHTML = html;
        }
      } catch (e) {
        console.error('Pending load error:', e);
      } finally {
        isLoadingPending = false;
      }
    }

    // Instant Resilient Approval (Prevents flicker, duplicates, and race conditions)
    async function approveEntity(type, id) {
      if (!id || inFlightApprovals[id]) return;
      inFlightApprovals[id] = true;

      var cardId = 'card-pending-' + type + '-' + id;
      var cardEl = document.getElementById(cardId);
      var actionsEl = document.getElementById('actions-' + type + '-' + id);

      // Instant Optimistic Feedback
      if (actionsEl) {
        actionsEl.innerHTML = '<span class="px-3 py-1.5 rounded-lg bg-green text-black font-headline font-bold text-xs flex items-center gap-1 shadow-[0_0_15px_rgba(0,255,136,0.8)] animate-pulse">' +
          '<span class="material-symbols-outlined text-sm">check_circle</span> <span>AUTHORIZED!</span>' +
        '</span>';
      }

      if (cardEl) {
        cardEl.style.borderColor = '#00ff88';
        cardEl.style.boxShadow = '0 0 20px rgba(0,255,136,0.4)';
        setTimeout(function() {
          if (cardEl && cardEl.parentNode) {
            cardEl.remove();
            var listContainer = document.getElementById('pending-items-list');
            if (listContainer && listContainer.children.length === 0) {
              listContainer.innerHTML = '<div class="text-center py-8 text-gray-400 font-mono text-xs">No pending requests. All squads and marshals are clear!</div>';
            }
          }
        }, 350);
      }

      var curPending = parseInt(document.getElementById('badge-pending').innerText || '0', 10);
      if (curPending > 0) {
        document.getElementById('badge-pending').innerText = curPending - 1;
        document.getElementById('stat-pending-count').innerText = curPending - 1;
      }

      try {
        var res = await fetch('/api/admin/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, id: id })
        });
        var data = await res.json();
        delete inFlightApprovals[id];

        if (data.success) {
          showAdminToast((data.message || 'Clearance authorized successfully'), 'success');
          loadApprovedRoster();
          loadLeaderboard();
          loadDatabaseData();
          renderRegisteredTeamsTable();
          setTimeout(loadPendingApprovals, 400);
        } else {
          showAdminToast('Approval failed: ' + (data.error || 'Server rejected'), 'error');
          loadPendingApprovals();
          loadApprovedRoster();
        }
      } catch (e) {
        delete inFlightApprovals[id];
        showAdminToast('Approval connection error: ' + e.message, 'error');
        loadPendingApprovals();
        loadApprovedRoster();
      }
    }

    `;

  adminHtml = adminHtml.substring(0, oldPendingApprovalsFunc) + replacement + adminHtml.substring(oldRejectFunc);
  fs.writeFileSync(adminPath, adminHtml, 'utf8');
  console.log('Updated public/admin_panel.html with resilient approvals!');
} else {
  console.error('Could not find function loadPendingApprovals or rejectEntity in admin_panel.html');
}

// ─────────────────────────────────────────────────────────────
// 2. UPDATE public/login.html (Waiting Hall Polling & Auto-Entry)
// ─────────────────────────────────────────────────────────────
const loginPath = path.join(__dirname, '..', 'public', 'login.html');
let loginHtml = fs.readFileSync(loginPath, 'utf8');

// Replace checkApprovalStatus in login.html with dual id/callsign polling & instant auto-entry
const oldCheckApprovalFunc = loginHtml.indexOf('async function checkApprovalStatus(userId, role, isManual) {');
const oldExitFunc = loginHtml.indexOf('function exitWaitingHall() {');

if (oldCheckApprovalFunc !== -1 && oldExitFunc !== -1) {
  const newCheckApproval = `async function checkApprovalStatus(userId, role, isManual) {
      if (isCheckingStatus) return;
      isCheckingStatus = true;
      try {
        var session = getStoredSession() || {};
        var uid = userId || session._id || session.id || '';
        var csign = session.callsign || '';

        var res = await fetch('/api/auth/status?id=' + encodeURIComponent(uid) + '&callsign=' + encodeURIComponent(csign) + '&_t=' + Date.now(), {
          cache: 'no-store'
        });
        var data = await res.json();

        if (data && data.isApproved) {
          if (pollInterval) clearInterval(pollInterval);

          // Update stored session with persistent clearance
          session.isApproved = true;
          session._id = data._id || session._id;
          session.role = data.role || role || session.role;
          session.teamId = data.teamId || session.teamId;
          saveSession(session);

          // Visual celebration feedback and instant redirect
          var pollTimer = document.getElementById('poll-timer');
          if (pollTimer) {
            pollTimer.innerText = '✓ CLEARANCE AUTHORIZED! ENTERING SECTOR...';
            pollTimer.className = 'text-green font-bold text-sm animate-bounce shadow-[0_0_15px_rgba(0,255,136,0.8)]';
          }

          setTimeout(function() {
            redirectToDashboard(data.role || role || session.role);
          }, 400);
        } else if (isManual) {
          var pollTimer = document.getElementById('poll-timer');
          if (pollTimer) {
            pollTimer.innerText = 'Waiting for Game Master Samay approval... (Checked just now)';
          }
        }
      } catch (e) {
        console.warn('Clearance poll error:', e);
      } finally {
        isCheckingStatus = false;
      }
    }

    `;

  loginHtml = loginHtml.substring(0, oldCheckApprovalFunc) + newCheckApproval + loginHtml.substring(oldExitFunc);

  // Also auto-check on page load if session exists:
  const oldDomContentLoaded = 'if (session && !session.isApproved) {\n        showWaitingHall(session.callsign, session.role, session._id);\n        return;\n      }';
  const newDomContentLoaded = `if (session && !session.isApproved) {
        showWaitingHall(session.callsign, session.role, session._id || session.id);
        // Fast instant check on startup in case approval happened while page was closed
        checkApprovalStatus(session._id || session.id, session.role, false);
        return;
      }`;

  if (loginHtml.includes(oldDomContentLoaded)) {
    loginHtml = loginHtml.replace(oldDomContentLoaded, newDomContentLoaded);
  }

  fs.writeFileSync(loginPath, loginHtml, 'utf8');
  console.log('Updated public/login.html with resilient polling & instant entry!');
} else {
  console.error('Could not find checkApprovalStatus in login.html');
}

// ─────────────────────────────────────────────────────────────
// 3. UPDATE public/player_dashboard.html (Snapshot Restoring & Persistence)
// ─────────────────────────────────────────────────────────────
const playerPath = path.join(__dirname, '..', 'public', 'player_dashboard.html');
let playerHtml = fs.readFileSync(playerPath, 'utf8');

// Replace enforceClearance so it doesn't kick user out without asking server first
const oldEnforceClearance = `(function enforceClearance() {
      try {
        var raw = localStorage.getItem('territory_grid_user') || sessionStorage.getItem('territory_grid_user');
        currentUser = raw ? JSON.parse(raw) : null;
        if (!currentUser) {
          window.location.href = 'login.html';
          return;
        }
        if (!currentUser.isApproved && currentUser.role !== 'ADMIN') {
          window.location.href = 'login.html';
          return;
        }
        if (currentUser.role === 'MEMBER') {
          window.location.href = 'member_checkin.html';
          return;
        }
      } catch (e) {
        window.location.href = 'login.html';
      }
    })();`;

const newEnforceClearance = `(function enforceClearance() {
      try {
        var raw = localStorage.getItem('territory_grid_user') || sessionStorage.getItem('territory_grid_user');
        currentUser = raw ? JSON.parse(raw) : null;
        if (!currentUser) {
          window.location.href = 'login.html';
          return;
        }
        if (currentUser.role === 'MEMBER') {
          window.location.href = 'member_checkin.html';
          return;
        }
        // If stored clearance flag is missing/false, verify with server before redirecting
        if (!currentUser.isApproved && currentUser.role !== 'ADMIN') {
          fetch('/api/auth/status?id=' + encodeURIComponent(currentUser._id || '') + '&callsign=' + encodeURIComponent(currentUser.callsign || '') + '&_t=' + Date.now(), { cache: 'no-store' })
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (d && d.isApproved) {
                currentUser.isApproved = true;
                localStorage.setItem('territory_grid_user', JSON.stringify(currentUser));
                sessionStorage.setItem('territory_grid_user', JSON.stringify(currentUser));
              } else {
                window.location.href = 'login.html';
              }
            })
            .catch(function() {
              // Network error: allow user to view their local dashboard rather than locking out
            });
        }

        // Restore cached team snapshot immediately so zero detail is lost on page reload
        try {
          var snapKey = 'tg_snapshot_' + (currentUser.callsign || 'squad');
          var rawSnap = localStorage.getItem(snapKey);
          if (rawSnap) {
            var snap = JSON.parse(rawSnap);
            if (snap) {
              currentMyTeam = snap;
              setTimeout(function() {
                var scoreEl = document.getElementById('current-score');
                if (scoreEl && typeof snap.score !== 'undefined') scoreEl.innerText = snap.score;
                if (Array.isArray(snap.cards)) renderDeck(snap.cards);
              }, 50);
            }
          }
        } catch(err){}

      } catch (e) {
        window.location.href = 'login.html';
      }
    })();`;

if (playerHtml.includes(oldEnforceClearance)) {
  playerHtml = playerHtml.replace(oldEnforceClearance, newEnforceClearance);
  console.log('Updated enforceClearance in player_dashboard.html');
} else {
  console.error('Could not find oldEnforceClearance in player_dashboard.html');
}

// In syncTeamData: save team snapshot to localStorage
const oldSyncTeamSuccess = `if (myTeam) {
          currentMyTeam = myTeam;`;

const newSyncTeamSuccess = `if (myTeam) {
          currentMyTeam = myTeam;
          // Persist snapshot to localStorage so accidental reloads never lose history
          try {
            var snapKey = 'tg_snapshot_' + (currentUser.callsign || 'squad');
            localStorage.setItem(snapKey, JSON.stringify(myTeam));
          } catch(e){}`;

if (playerHtml.includes(oldSyncTeamSuccess) && !playerHtml.includes('tg_snapshot_')) {
  playerHtml = playerHtml.replace(oldSyncTeamSuccess, newSyncTeamSuccess);
  console.log('Added snapshot persistence to syncTeamData in player_dashboard.html');
}

fs.writeFileSync(playerPath, playerHtml, 'utf8');

// Synchronize all updated files to design_refs and android assets!
const syncFiles = [
  'public/admin_panel.html',
  'public/login.html',
  'public/player_dashboard.html',
  'public/member_checkin.html'
];

syncFiles.forEach(relPath => {
  const content = fs.readFileSync(path.join(__dirname, '..', relPath));
  const fileName = path.basename(relPath);
  fs.writeFileSync(path.join(__dirname, '..', 'design_refs', 'html', fileName), content);
  fs.writeFileSync(path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'public', fileName), content);
  console.log('Synchronized ' + fileName + ' to design_refs and android assets');
});

console.log('ALL FIXES APPLIED SUCCESSFULLY!');
