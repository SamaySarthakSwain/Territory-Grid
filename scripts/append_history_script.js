const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin_panel.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetTag = '  </script>\n</body>\n</html>';

const additionScript = `
    // ─────────────────────────────────────────────────────────────
    // SQUAD REMOVAL & SCORE RESET CONTROLLERS
    // ─────────────────────────────────────────────────────────────
    async function confirmResetTeamPoints(teamId, teamName) {
      if (!confirm('⚠️ RESET SQUAD POINTS & PROGRESS?\\n\\nAre you sure you want to reset all points, card progress, and visited zones to 0 for squad "' + teamName + '"?\\n\\nThe squad will restart fresh from Checkpoint 1.')) {
        return;
      }
      try {
        var res = await fetch('/api/admin/teams/reset-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: teamId })
        });
        var data = await res.json();
        if (data.success) {
          showAdminToast('Points reset to 0 for ' + teamName, 'success');
          loadLeaderboard();
          loadApprovedRoster();
          if (activeTab === 'history') loadAdminLogs();
        } else {
          alert('Error: ' + (data.error || 'Failed to reset points'));
        }
      } catch (err) {
        console.error('Reset points error:', err);
        alert('Network error resetting points: ' + err.message);
      }
    }

    async function confirmRemoveTeam(teamId, teamName) {
      if (!confirm('🚨 PERMANENT SQUAD REMOVAL?\\n\\nAre you sure you want to permanently delete squad "' + teamName + '"?\\n\\nThis will delete the team, its player accounts, and all checkpoint records from the database.')) {
        return;
      }
      try {
        var res = await fetch('/api/admin/teams/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: teamId })
        });
        var data = await res.json();
        if (data.success) {
          showAdminToast('Squad ' + teamName + ' removed permanently', 'success');
          loadLeaderboard();
          loadPendingApprovals();
          loadApprovedRoster();
          if (activeTab === 'history') loadAdminLogs();
        } else {
          alert('Error: ' + (data.error || 'Failed to remove squad'));
        }
      } catch (err) {
        console.error('Remove team error:', err);
        alert('Network error removing squad: ' + err.message);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // MISSION AUDIT TRAIL & LOGS CONTROLLER
    // ─────────────────────────────────────────────────────────────
    var cachedAdminLogs = [];
    var activeLogFilter = 'ALL';
    var logSearchTerm = '';
    var isLoadingLogs = false;

    async function loadAdminLogs() {
      if (isLoadingLogs) return;
      isLoadingLogs = true;
      try {
        var res = await fetch('/api/admin/logs?limit=250&_t=' + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          cachedAdminLogs = data.logs;
          var totalCount = data.logs.length;

          // Update Badges
          var badgeCount = document.getElementById('badge-logs-count');
          if (badgeCount) badgeCount.innerText = totalCount;
          var badgeTotal = document.getElementById('badge-logs-total');
          if (badgeTotal) badgeTotal.innerText = totalCount + ' EVENTS';

          // Update filter counts
          updateLogFilterCounts();

          // Render list
          renderAdminLogs();
        }
      } catch (err) {
        console.error('Failed to load admin logs:', err);
      } finally {
        isLoadingLogs = false;
      }
    }

    function updateLogFilterCounts() {
      var all = cachedAdminLogs.length;
      var admin = 0, checkin = 0, auth = 0, status = 0;

      cachedAdminLogs.forEach(function(l) {
        var a = (l.action || '').toUpperCase();
        if (a === 'CHECKIN') checkin++;
        else if (a === 'GAME_STATUS') status++;
        else if (['LOGIN', 'ADMIN_LOGIN', 'REGISTER', 'APPROVE_TEAM', 'APPROVE_USER', 'REJECT_TEAM', 'REJECT_USER'].indexOf(a) !== -1) auth++;
        else admin++;
      });

      var elAll = document.getElementById('filter-count-ALL'); if (elAll) elAll.innerText = all;
      var elAdmin = document.getElementById('filter-count-ADMIN'); if (elAdmin) elAdmin.innerText = admin;
      var elCheckin = document.getElementById('filter-count-CHECKIN'); if (elCheckin) elCheckin.innerText = checkin;
      var elAuth = document.getElementById('filter-count-AUTH'); if (elAuth) elAuth.innerText = auth;
      var elStatus = document.getElementById('filter-count-GAME_STATUS'); if (elStatus) elStatus.innerText = status;
    }

    function filterLogs(filterType) {
      activeLogFilter = filterType;
      ['ALL', 'ADMIN', 'CHECKIN', 'AUTH', 'GAME_STATUS'].forEach(function(f) {
        var btn = document.getElementById('filter-btn-' + f);
        if (btn) {
          if (f === filterType) {
            btn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition bg-purple-500 text-white cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.4)]';
          } else {
            btn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition bg-[#091122] text-gray-400 hover:text-white border border-gray-800 cursor-pointer';
          }
        }
      });
      renderAdminLogs();
    }

    function handleLogSearch(val) {
      logSearchTerm = (val || '').trim().toLowerCase();
      renderAdminLogs();
    }

    function renderAdminLogs() {
      var container = document.getElementById('logs-list-container');
      if (!container) return;

      var logs = cachedAdminLogs.slice();

      // Filter by category
      if (activeLogFilter === 'ADMIN') {
        logs = logs.filter(function(l) {
          var a = (l.action || '').toUpperCase();
          return a !== 'CHECKIN' && a !== 'GAME_STATUS' && ['LOGIN', 'ADMIN_LOGIN', 'REGISTER', 'APPROVE_TEAM', 'APPROVE_USER', 'REJECT_TEAM', 'REJECT_USER'].indexOf(a) === -1;
        });
      } else if (activeLogFilter === 'CHECKIN') {
        logs = logs.filter(function(l) { return (l.action || '').toUpperCase() === 'CHECKIN'; });
      } else if (activeLogFilter === 'AUTH') {
        logs = logs.filter(function(l) {
          var a = (l.action || '').toUpperCase();
          return ['LOGIN', 'ADMIN_LOGIN', 'REGISTER', 'APPROVE_TEAM', 'APPROVE_USER', 'REJECT_TEAM', 'REJECT_USER'].indexOf(a) !== -1;
        });
      } else if (activeLogFilter === 'GAME_STATUS') {
        logs = logs.filter(function(l) { return (l.action || '').toUpperCase() === 'GAME_STATUS'; });
      }

      // Filter by search keyword
      if (logSearchTerm) {
        logs = logs.filter(function(l) {
          var text = ((l.action || '') + ' ' + (l.details || '') + ' ' + (l.timestamp || '')).toLowerCase();
          return text.indexOf(logSearchTerm) !== -1;
        });
      }

      if (logs.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-400 font-mono text-xs">No audit logs found matching criteria.</div>';
        return;
      }

      container.innerHTML = logs.map(function(item) {
        var action = (item.action || 'EVENT').toUpperCase();
        var details = item.details || '';
        var ts = item.timestamp ? new Date(item.timestamp) : new Date();

        var timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        var dateStr = ts.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        var diffSec = Math.floor((Date.now() - ts.getTime()) / 1000);
        var relTime = diffSec < 60 ? 'Just now' : (diffSec < 3600 ? Math.floor(diffSec / 60) + 'm ago' : Math.floor(diffSec / 3600) + 'h ago');

        var icon = 'info';
        var borderClass = 'border-purple-500/20';
        var badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        var actionLabel = action;

        if (action === 'CHECKIN') {
          icon = 'sports_score';
          borderClass = 'border-green/30';
          badgeClass = 'bg-green/15 text-green border-green/40';
          actionLabel = 'FIELD CHECK-IN';
        } else if (action === 'RESET_POINTS') {
          icon = 'restart_alt';
          borderClass = 'border-yellow-500/40';
          badgeClass = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
          actionLabel = 'SCORE RESET';
        } else if (action === 'REMOVE_TEAM') {
          icon = 'delete_forever';
          borderClass = 'border-red-500/40';
          badgeClass = 'bg-red-500/20 text-red-400 border-red-500/50';
          actionLabel = 'SQUAD DELETED';
        } else if (action === 'GAME_STATUS') {
          icon = 'timer';
          borderClass = 'border-cyan/30';
          badgeClass = 'bg-cyan/15 text-cyan border-cyan/40';
          actionLabel = 'MATCH PHASE';
        } else if (action.indexOf('APPROVE') !== -1) {
          icon = 'verified_user';
          borderClass = 'border-green/30';
          badgeClass = 'bg-green/15 text-green border-green/40';
        } else if (action.indexOf('REJECT') !== -1) {
          icon = 'person_remove';
          borderClass = 'border-red-500/30';
          badgeClass = 'bg-red-500/15 text-red-400 border-red-500/40';
        } else if (action.indexOf('LOGIN') !== -1 || action === 'REGISTER') {
          icon = 'shield_person';
          borderClass = 'border-blue-500/30';
          badgeClass = 'bg-blue-500/15 text-blue-300 border-blue-500/40';
        } else if (action.indexOf('PLACE') !== -1) {
          icon = 'pin_drop';
          borderClass = 'border-purple-500/30';
          badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        }

        return '<div class="neon-card rounded-xl p-3 bg-[#060c18] border ' + borderClass + ' flex items-center justify-between gap-3 hover:bg-[#0a1426] transition">' +
          '<div class="flex items-center gap-3 min-w-0">' +
            '<div class="w-8 h-8 rounded-lg bg-surface-container-low border border-white/10 flex items-center justify-center shrink-0 text-white/80">' +
              '<span class="material-symbols-outlined text-sm">' + icon + '</span>' +
            '</div>' +
            '<div class="min-w-0">' +
              '<div class="flex items-center gap-2 flex-wrap">' +
                '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ' + badgeClass + '">' + actionLabel + '</span>' +
                '<span class="text-xs text-white font-mono font-medium truncate">' + details + '</span>' +
              '</div>' +
              '<div class="text-[11px] text-gray-500 font-mono mt-0.5">' +
                dateStr + ' ' + timeStr + ' • <span class="text-gray-400">' + relTime + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<span class="text-[10px] font-mono text-gray-600 hidden md:inline shrink-0">#' + (item._id || '').slice(-6) + '</span>' +
        '</div>';
      }).join('');
    }

    async function clearAdminLogs() {
      if (!confirm('⚠️ PURGE AUDIT TRAIL?\\n\\nAre you sure you want to clear all mission history entries?\\nThis action is irreversible.')) {
        return;
      }
      try {
        var res = await fetch('/api/admin/logs/clear', { method: 'POST' });
        var data = await res.json();
        if (data.success) {
          showAdminToast('Mission audit trail cleared', 'success');
          loadAdminLogs();
        } else {
          alert('Error clearing logs: ' + (data.error || 'Failed'));
        }
      } catch (err) {
        console.error('Clear logs error:', err);
      }
    }

    function exportLogsAsJSON() {
      var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cachedAdminLogs, null, 2));
      var downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'territory_grid_audit_logs_' + Date.now() + '.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showAdminToast('Audit logs exported to JSON', 'info');
    }

    // ─────────────────────────────────────────────────────────────
    // TOAST NOTIFICATION HELPER
    // ─────────────────────────────────────────────────────────────
    function showAdminToast(message, type) {
      var existing = document.getElementById('admin-toast-banner');
      if (existing) existing.remove();

      var toast = document.createElement('div');
      toast.id = 'admin-toast-banner';
      var border = type === 'success' ? 'border-green text-green bg-green/15' : 'border-cyan text-cyan bg-cyan/15';
      toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-md font-mono text-xs font-bold shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center gap-2 animate-bounce ' + border;
      toast.innerHTML = '<span class="material-symbols-outlined text-sm">' + (type === 'success' ? 'check_circle' : 'info') + '</span><span>' + message + '</span>';
      document.body.appendChild(toast);
      setTimeout(function() { if (toast) toast.remove(); }, 3500);
    }

    // Periodic history poll & badge counter sync
    setInterval(function() {
      if (activeTab === 'history') {
        loadAdminLogs();
      } else {
        fetch('/api/admin/logs?limit=1&_t=' + Date.now(), { cache: 'no-store' })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d && typeof d.total !== 'undefined') {
              var badge = document.getElementById('badge-logs-count');
              if (badge) badge.innerText = d.total;
            }
          }).catch(function(){});
      }
    }, 3500);
  </script>
</body>
</html>`;

if (content.includes(targetTag) && !content.includes('confirmResetTeamPoints')) {
  content = content.replace(targetTag, additionScript);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('Appended history scripts and helpers to admin_panel.html');
} else {
  console.log('Target tag not found or already added');
}
