const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin_panel.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

// 1. Enhance CSS style block with tactical skeleton shimmer, smooth micro-interactions, and pointer safety
const oldStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`;

const newStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    button {
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
      transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    }
    button:active:not(:disabled) {
      transform: scale(0.96);
    }
    button > * {
      pointer-events: none;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes tacticalShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .skeleton-shimmer {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(0,240,255,0.12) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: tacticalShimmer 1.4s infinite linear;
      border-radius: 0.5rem;
    }
    @keyframes cyberFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-cyber-fade {
      animation: cyberFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }`;

if (html.includes(oldStyle)) {
  html = html.replace(oldStyle, newStyle);
} else {
  console.warn('oldStyle target not found');
}

// 2. Add Skeleton Generator Helpers and Smart Diffing variables
const skeletonCode = `
    // ─────────────────────────────────────────────────────────────
    // Tactical Cyberpunk Skeleton Loaders & Smart Diff Engine
    // ─────────────────────────────────────────────────────────────
    var lastRenderedApprovedHash = '';
    var lastRenderedPendingHash = '';
    var lastRenderedRegisteredTeamsHash = '';
    var lastRenderedPlacesHash = '';
    var lastRenderedLogsHash = '';

    function getTableSkeletonHtml(rows) {
      rows = rows || 4;
      var out = '';
      for (var i = 0; i < rows; i++) {
        out += '<tr class="border-b border-white/5">' +
          '<td class="py-3 px-3"><div class="h-4 w-6 skeleton-shimmer"></div></td>' +
          '<td class="py-3 px-3"><div class="h-4 w-32 skeleton-shimmer"></div></td>' +
          '<td class="py-3 px-3"><div class="h-4 w-20 skeleton-shimmer"></div></td>' +
          '<td class="py-3 px-3"><div class="h-4 w-14 skeleton-shimmer"></div></td>' +
          '<td class="py-3 px-3"><div class="h-4 w-24 skeleton-shimmer"></div></td>' +
          '<td class="py-3 px-3"><div class="h-4 w-28 skeleton-shimmer"></div></td>' +
          '<td class="py-3 px-3"><div class="h-7 w-28 skeleton-shimmer rounded-lg"></div></td>' +
        '</tr>';
      }
      return out;
    }

    function getCardsSkeletonHtml(count) {
      count = count || 3;
      var out = '';
      for (var i = 0; i < count; i++) {
        out += '<div class="neon-card rounded-xl p-4 flex items-center justify-between gap-3 border-cyan/20 bg-[#091122]/60 animate-pulse">' +
          '<div class="flex items-center gap-3 w-2/3">' +
            '<div class="w-10 h-10 rounded-lg skeleton-shimmer flex-shrink-0"></div>' +
            '<div class="space-y-2 w-full">' +
              '<div class="h-4 w-40 skeleton-shimmer"></div>' +
              '<div class="h-3 w-56 skeleton-shimmer"></div>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<div class="h-8 w-24 skeleton-shimmer rounded-xl"></div>' +
            '<div class="h-8 w-20 skeleton-shimmer rounded-xl"></div>' +
          '</div>' +
        '</div>';
      }
      return out;
    }

    function getPlacesGridSkeleton(count) {
      count = count || 3;
      var out = '';
      for (var i = 0; i < count; i++) {
        out += '<div class="neon-card rounded-2xl p-5 border-cyan/20 bg-[#091122]/60 space-y-3 animate-pulse">' +
          '<div class="flex items-center justify-between">' +
            '<div class="h-5 w-24 skeleton-shimmer"></div>' +
            '<div class="h-4 w-12 skeleton-shimmer rounded-full"></div>' +
          '</div>' +
          '<div class="h-4 w-48 skeleton-shimmer"></div>' +
          '<div class="h-12 w-full skeleton-shimmer rounded-xl"></div>' +
          '<div class="flex justify-end gap-2 pt-2">' +
            '<div class="h-7 w-16 skeleton-shimmer rounded-lg"></div>' +
            '<div class="h-7 w-16 skeleton-shimmer rounded-lg"></div>' +
          '</div>' +
        '</div>';
      }
      return out;
    }
`;

// Insert skeletonCode right after activeTab definition
const activeTabMarker = "var activeTab = 'ops';";
if (html.includes(activeTabMarker) && !html.includes('function getTableSkeletonHtml')) {
  html = html.replace(activeTabMarker, `${activeTabMarker}\n${skeletonCode}`);
}

// 3. Update initial HTML container contents to use beautiful skeletons instead of plain "Loading..."
html = html.replace(
  '<div class="text-center py-6 text-gray-400 text-xs font-mono">Loading active clearances...</div>',
  '<div id="skeleton-approved" class="space-y-3">' +
    '<div class="neon-card rounded-xl p-4 flex items-center justify-between gap-3 border-cyan/20 bg-[#091122]/60 animate-pulse">' +
      '<div class="flex items-center gap-3 w-2/3"><div class="w-10 h-10 rounded-lg skeleton-shimmer"></div><div class="space-y-2 w-full"><div class="h-4 w-40 skeleton-shimmer"></div><div class="h-3 w-56 skeleton-shimmer"></div></div></div>' +
      '<div class="h-8 w-24 skeleton-shimmer rounded-xl"></div>' +
    '</div>' +
    '<div class="neon-card rounded-xl p-4 flex items-center justify-between gap-3 border-cyan/20 bg-[#091122]/60 animate-pulse">' +
      '<div class="flex items-center gap-3 w-2/3"><div class="w-10 h-10 rounded-lg skeleton-shimmer"></div><div class="space-y-2 w-full"><div class="h-4 w-36 skeleton-shimmer"></div><div class="h-3 w-48 skeleton-shimmer"></div></div></div>' +
      '<div class="h-8 w-24 skeleton-shimmer rounded-xl"></div>' +
    '</div>' +
  '</div>'
);

html = html.replace(
  '<div class="text-center py-6 text-gray-400 text-xs font-mono">Loading pending clearances...</div>',
  '<div id="skeleton-pending" class="space-y-3">' +
    '<div class="neon-card rounded-xl p-4 flex items-center justify-between gap-3 border-yellow/20 bg-[#091122]/60 animate-pulse">' +
      '<div class="flex items-center gap-3 w-2/3"><div class="w-10 h-10 rounded-lg skeleton-shimmer"></div><div class="space-y-2 w-full"><div class="h-4 w-40 skeleton-shimmer"></div><div class="h-3 w-48 skeleton-shimmer"></div></div></div>' +
      '<div class="flex gap-2"><div class="h-8 w-20 skeleton-shimmer rounded-xl"></div><div class="h-8 w-20 skeleton-shimmer rounded-xl"></div></div>' +
    '</div>' +
  '</div>'
);

// 4. Update switchTab to invalidate hash on manual switch and manage tab-aware loading
const oldSwitchTab = `function switchTab(tab) {
      activeTab = tab;
      ['ops', 'approvals', 'places', 'database', 'history'].forEach(function(t) {
        var content = document.getElementById('tab-content-' + t);
        var btn = document.getElementById('nav-btn-' + t);
        if (content && btn) {
          if (t === tab) {
            content.classList.remove('hidden');
            btn.className = 'px-3.5 py-1.5 text-xs font-headline font-bold rounded-lg bg-cyan text-black flex items-center gap-1.5 transition';
          } else {
            content.classList.add('hidden');
            btn.className = 'px-3.5 py-1.5 text-xs font-headline font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition';
          }
        }
      });

      if (tab === 'database') loadDatabaseData();
      if (tab === 'places') loadPlaces();
      if (tab === 'approvals') { loadPendingApprovals(); loadApprovedRoster(); }
      if (tab === 'ops') loadLeaderboard();
      if (tab === 'history') loadAdminLogs();
    }`;

const newSwitchTab = `function switchTab(tab) {
      activeTab = tab;
      ['ops', 'approvals', 'places', 'database', 'history'].forEach(function(t) {
        var content = document.getElementById('tab-content-' + t);
        var btn = document.getElementById('nav-btn-' + t);
        if (content && btn) {
          if (t === tab) {
            content.classList.remove('hidden');
            content.classList.add('animate-cyber-fade');
            btn.className = 'px-3.5 py-1.5 text-xs font-headline font-bold rounded-lg bg-cyan text-black flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer';
          } else {
            content.classList.add('hidden');
            content.classList.remove('animate-cyber-fade');
            btn.className = 'px-3.5 py-1.5 text-xs font-headline font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer relative';
          }
        }
      });

      // Force instant refresh of active tab content
      if (tab === 'database') { lastRenderedCollectionsHash = ''; loadDatabaseData(); }
      if (tab === 'places') { lastRenderedPlacesHash = ''; loadPlaces(); }
      if (tab === 'approvals') { lastRenderedPendingHash = ''; lastRenderedApprovedHash = ''; loadPendingApprovals(); loadApprovedRoster(); }
      if (tab === 'ops') { lastRenderedRegisteredTeamsHash = ''; loadLeaderboard(); }
      if (tab === 'history') { lastRenderedLogsHash = ''; loadAdminLogs(); }
    }`;

if (html.includes(oldSwitchTab)) {
  html = html.replace(oldSwitchTab, newSwitchTab);
}

// 5. Update renderRegisteredTeamsTable to use Smart Diffing
const oldRenderTeams = `function renderRegisteredTeamsTable() {
      var tbody = document.getElementById('registered-teams-table-body');
      if (!tbody) return;

      var teams = cachedRegisteredTeams.slice();
      if (registeredTeamsFilter === 'active') {
        teams = teams.filter(function(t) { return t.isApproved; });
      } else if (registeredTeamsFilter === 'pending') {
        teams = teams.filter(function(t) { return !t.isApproved; });
      }

      if (teams.length === 0) {
        var msg = registeredTeamsFilter === 'pending' ? 'No squads pending clearance. All registered squads are authorized!' :
                  (registeredTeamsFilter === 'active' ? 'No active squads authorized yet.' : 'No squads registered yet. Teams can register from the login screen.');
        tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400 font-mono text-xs">' + msg + '</td></tr>';
        return;
      }`;

const newRenderTeams = `function renderRegisteredTeamsTable() {
      var tbody = document.getElementById('registered-teams-table-body');
      if (!tbody) return;

      var teams = cachedRegisteredTeams.slice();
      if (registeredTeamsFilter === 'active') {
        teams = teams.filter(function(t) { return t.isApproved; });
      } else if (registeredTeamsFilter === 'pending') {
        teams = teams.filter(function(t) { return !t.isApproved; });
      }

      // Smart Diffing: Prevent unconditional DOM replacement if data is unchanged!
      var currentHash = registeredTeamsFilter + '_' + JSON.stringify(teams.map(function(t){ return [t._id, t.score, t.isApproved, t.currentClueIndex, (t.visitedZones||[]).length]; }));
      if (currentHash === lastRenderedRegisteredTeamsHash && tbody.children.length > 0) {
        return; // Skip re-render! Buttons remain completely stable in DOM!
      }
      lastRenderedRegisteredTeamsHash = currentHash;

      if (teams.length === 0) {
        var msg = registeredTeamsFilter === 'pending' ? 'No squads pending clearance. All registered squads are authorized!' :
                  (registeredTeamsFilter === 'active' ? 'No active squads authorized yet.' : 'No squads registered yet. Teams can register from the login screen.');
        tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400 font-mono text-xs">' + msg + '</td></tr>';
        return;
      }`;

if (html.includes(oldRenderTeams)) {
  html = html.replace(oldRenderTeams, newRenderTeams);
}

// 6. Update loadApprovedRoster with Smart Diffing
const oldApprovedRoster = `async function loadApprovedRoster() {
      try {
        var res = await fetch(apiUrl('/api/admin/approved?_t=') + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (!data.success) return;

        var approvedTeams = (data.teams || []).filter(function(t) { return t.isApproved; });
        var approvedMarshals = (data.users || []).filter(function(u) { return u.role === 'MEMBER' && u.isApproved; });
        var totalActive = approvedTeams.length + approvedMarshals.length;

        var badgeTotal = document.getElementById('badge-approved-total');
        if (badgeTotal) badgeTotal.innerText = totalActive + ' ACTIVE';
        var statApproved = document.getElementById('stat-approved-count');
        if (statApproved) statApproved.innerText = totalActive;

        var container = document.getElementById('approved-items-list');
        if (!container) return;

        if (totalActive === 0) {
          container.innerHTML = '<div class="text-center py-8 text-gray-400 font-mono text-xs">No active authorized clearances currently in grid.</div>';
          return;
        }`;

const newApprovedRoster = `async function loadApprovedRoster() {
      try {
        var res = await fetch(apiUrl('/api/admin/approved?_t=') + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (!data.success) return;

        var approvedTeams = (data.teams || []).filter(function(t) { return t.isApproved; });
        var approvedMarshals = (data.users || []).filter(function(u) { return u.role === 'MEMBER' && u.isApproved; });
        var totalActive = approvedTeams.length + approvedMarshals.length;

        var badgeTotal = document.getElementById('badge-approved-total');
        if (badgeTotal) badgeTotal.innerText = totalActive + ' ACTIVE';
        var statApproved = document.getElementById('stat-approved-count');
        if (statApproved) statApproved.innerText = totalActive;

        // Smart Diffing: Prevent unconditional DOM replacement
        var currentHash = JSON.stringify({
          t: approvedTeams.map(function(t){ return [t._id, t.score, t.currentClueIndex, (t.visitedZones||[]).length]; }),
          m: approvedMarshals.map(function(m){ return [m._id, m.zoneId, m.zoneLabel]; })
        });
        var container = document.getElementById('approved-items-list');
        if (!container) return;

        if (currentHash === lastRenderedApprovedHash && container.children.length > 0) {
          return; // Skip re-render!
        }
        lastRenderedApprovedHash = currentHash;

        if (totalActive === 0) {
          container.innerHTML = '<div class="text-center py-8 text-gray-400 font-mono text-xs">No active authorized clearances currently in grid.</div>';
          return;
        }`;

if (html.includes(oldApprovedRoster)) {
  html = html.replace(oldApprovedRoster, newApprovedRoster);
}

// 7. Update loadPendingApprovals with Smart Diffing
const oldPendingApprovals = `var listContainer = document.getElementById('pending-items-list');
          if (!listContainer) return;

          if (realCount === 0) {
            listContainer.innerHTML = '<div class="text-center py-8 text-gray-400 font-mono text-xs">No pending requests. All squads and marshals are clear!</div>';
            pendingItemsCache = {};
            return;
          }`;

const newPendingApprovals = `var listContainer = document.getElementById('pending-items-list');
          if (!listContainer) return;

          // Smart Diffing: Prevent unneeded DOM re-renders of pending items
          var pendingHash = JSON.stringify({
            t: pendingTeams.map(function(t){ return t._id; }),
            m: pendingMarshals.map(function(m){ return m._id; })
          });
          if (pendingHash === lastRenderedPendingHash && listContainer.children.length > 0) {
            return; // Skip re-render!
          }
          lastRenderedPendingHash = pendingHash;

          if (realCount === 0) {
            listContainer.innerHTML = '<div class="text-center py-8 text-gray-400 font-mono text-xs">No pending requests. All squads and marshals are clear!</div>';
            pendingItemsCache = {};
            return;
          }`;

if (html.includes(oldPendingApprovals)) {
  html = html.replace(oldPendingApprovals, newPendingApprovals);
}

// 8. Replace uncoordinated polling loops with Tab-Aware Scheduler and fetchPendingBadgeOnly
const oldIntervals = `      // Set intervals to refresh pending approvals and roster safely
      setInterval(function() {
        try { loadPendingApprovals(); } catch(e) {}
      }, 2000);
      setInterval(function() {
        try { loadApprovedRoster(); } catch(e) {}
      }, 2200);
      setInterval(function() {
        try { loadLeaderboard(); } catch(e) {}
      }, 2400);`;

const newIntervals = `      // Tab-Aware Intelligent Polling Engine: Eliminates DOM thrashing and preserves button click states!
      scheduleAdminTabPoll();`;

const tabPollFunction = `
    // ─────────────────────────────────────────────────────────────
    // Tab-Aware Polling Engine (Prevents DOM Thrashing)
    // ─────────────────────────────────────────────────────────────
    var adminTabPollTimeout = null;

    async function fetchPendingBadgeOnly() {
      try {
        var res = await fetch(apiUrl('/api/admin/pending?_t=') + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (data.success) {
          var pTeams = (data.teams || []).filter(function(t) { return !inFlightApprovals[t._id] && !inFlightApprovals[t.callsign]; });
          var pMarshals = (data.users || []).filter(function(u) { return u.role === 'MEMBER' && !inFlightApprovals[u._id] && !inFlightApprovals[u.callsign]; });
          var totalPending = pTeams.length + pMarshals.length;

          var badgePending = document.getElementById('badge-pending');
          if (badgePending) badgePending.innerText = totalPending;
          var statPending = document.getElementById('stat-pending-count');
          if (statPending) statPending.innerText = totalPending;

          var opsBanner = document.getElementById('ops-pending-banner');
          var opsBannerCount = document.getElementById('ops-banner-count');
          if (opsBanner && opsBannerCount) {
            if (totalPending > 0) {
              opsBanner.classList.remove('hidden');
              opsBannerCount.innerText = totalPending + ' NEW';
            } else {
              opsBanner.classList.add('hidden');
            }
          }
        }
      } catch(e) {}
    }

    function scheduleAdminTabPoll() {
      if (adminTabPollTimeout) clearTimeout(adminTabPollTimeout);
      adminTabPollTimeout = setTimeout(async function() {
        try {
          if (activeTab === 'ops') {
            await loadLeaderboard();
            await fetchPendingBadgeOnly();
          } else if (activeTab === 'approvals') {
            await loadPendingApprovals();
            await loadApprovedRoster();
          } else if (activeTab === 'places') {
            await loadPlaces();
          } else if (activeTab === 'history') {
            await loadAdminLogs();
          }
        } catch(e) {
          console.warn('Tab poll error:', e);
        } finally {
          scheduleAdminTabPoll();
        }
      }, 2200);
    }
`;

if (html.includes(oldIntervals)) {
  html = html.replace(oldIntervals, newIntervals);
}

if (!html.includes('function scheduleAdminTabPoll')) {
  html = html.replace('function startClock()', `${tabPollFunction}\n    function startClock()`);
}

// 9. Interactive Feedback on Critical Action Buttons
// Replace togglePauseGame with visual loading feedback
const oldPause = `async function togglePauseGame() {
      try {
        var action = (serverGameState === 'PAUSED') ? 'RESUME' : 'PAUSE';
        await fetch(apiUrl('/api/game/state'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action })
        });
        syncAdminGameState();
      } catch (e) {
        alert('Failed to pause/resume game: ' + e.message);
      }
    }`;

const newPause = `async function togglePauseGame() {
      var btn = document.getElementById('btn-pause-ops');
      var btnText = document.getElementById('btn-pause-text');
      var originalText = btnText ? btnText.innerText : 'PAUSE OPS';
      if (btn) { btn.disabled = true; if (btnText) btnText.innerText = 'PROCESSING...'; }

      try {
        var action = (serverGameState === 'PAUSED') ? 'RESUME' : 'PAUSE';
        await fetch(apiUrl('/api/game/state'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action })
        });
        await syncAdminGameState();
      } catch (e) {
        alert('Failed to pause/resume game: ' + e.message);
      } finally {
        if (btn) { btn.disabled = false; }
      }
    }`;

if (html.includes(oldPause)) {
  html = html.replace(oldPause, newPause);
}

// Update rebalanceAllSquadRoutes with instant button feedback
const oldRebal = `async function rebalanceAllSquadRoutes() {
      if (!confirm('Re-balance and distribute route starting positions evenly across all campus checkpoints?')) return;
      try {
        var res = await fetch(apiUrl('/api/admin/rebalance-routes'), { method: 'POST' });
        var data = await res.json();
        if (data.success) {
          alert('Route distribution complete: ' + data.message);
          loadApprovedRoster();
          loadRegisteredTeams();
        } else {
          alert('Re-balance failed: ' + (data.message || 'Unknown error'));
        }
      } catch (e) {
        alert('Failed to rebalance routes: ' + e.message);
      }
    }`;

const newRebal = `async function rebalanceAllSquadRoutes() {
      if (!confirm('Re-balance and distribute route starting positions evenly across all campus checkpoints?')) return;
      var btn = event && event.currentTarget ? event.currentTarget : null;
      if (btn) { btn.disabled = true; btn.classList.add('opacity-50'); }

      try {
        var res = await fetch(apiUrl('/api/admin/rebalance-routes'), { method: 'POST' });
        var data = await res.json();
        if (data.success) {
          alert('Route distribution complete: ' + data.message);
          lastRenderedApprovedHash = '';
          lastRenderedRegisteredTeamsHash = '';
          loadApprovedRoster();
          loadRegisteredTeams();
        } else {
          alert('Re-balance failed: ' + (data.message || 'Unknown error'));
        }
      } catch (e) {
        alert('Failed to rebalance routes: ' + e.message);
      } finally {
        if (btn) { btn.disabled = false; btn.classList.remove('opacity-50'); }
      }
    }`;

if (html.includes(oldRebal)) {
  html = html.replace(oldRebal, newRebal);
}

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully applied button fixes and tactical skeleton loaders to admin_panel.html');
