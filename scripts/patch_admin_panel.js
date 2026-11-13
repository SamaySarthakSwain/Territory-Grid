const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin_panel.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

// 1. Add RESET ALL POINTS and PURGE ALL SQUADS buttons in Tab 1 (Ops Control)
const t1Target = `<span>RESET LOBBY</span>
          </button>`;

const t1Replacement = `<span>RESET LOBBY</span>
          </button>

          <button onclick="openAdminActionModal('reset-points')" 
                  class="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl border border-yellow/50 bg-yellow/10 hover:bg-yellow/20 text-yellow text-xs font-headline font-bold flex items-center justify-center gap-1.5 transition cursor-pointer" title="Reset all squads score and cards to 0">
            <span class="material-symbols-outlined text-base">restart_alt</span>
            <span>RESET ALL POINTS</span>
          </button>

          <button onclick="openAdminActionModal('purge-teams')" 
                  class="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-headline font-bold flex items-center justify-center gap-1.5 transition cursor-pointer" title="Purge all registered squads from grid">
            <span class="material-symbols-outlined text-base">delete_forever</span>
            <span>PURGE ALL SQUADS</span>
          </button>`;

if (!html.includes(t1Target)) {
  console.error('Target 1 (Ops Control buttons) not found!');
  process.exit(1);
}
html = html.replace(t1Target, t1Replacement);

// 2. Add Reset All Scores and Purge All Squads buttons in Tab 2 (Active Authorized Clearances)
const t2Target = `<button onclick="loadApprovedRoster()" class="px-4 py-2 rounded-xl bg-green/10 border border-green/30 text-green text-xs font-headline font-bold hover:bg-green/20 transition flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh Roster</span>
          </button>`;

const t2Replacement = `<div class="flex flex-wrap items-center gap-2">
            <button onclick="openAdminActionModal('reset-points')" class="px-3.5 py-2 rounded-xl bg-yellow/10 border border-yellow/30 text-yellow text-xs font-headline font-bold hover:bg-yellow/20 transition flex items-center gap-1.5 cursor-pointer" title="Reset all squad scores to 0">
              <span class="material-symbols-outlined text-sm">restart_alt</span>
              <span>Reset All Scores</span>
            </button>

            <button onclick="openAdminActionModal('purge-teams')" class="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-headline font-bold hover:bg-red-500/20 transition flex items-center gap-1.5 cursor-pointer" title="Purge all teams with confirmation">
              <span class="material-symbols-outlined text-sm">delete_sweep</span>
              <span>Purge All Squads</span>
            </button>

            <button onclick="loadApprovedRoster()" class="px-4 py-2 rounded-xl bg-green/10 border border-green/30 text-green text-xs font-headline font-bold hover:bg-green/20 transition flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-sm">refresh</span>
              <span>Refresh Roster</span>
            </button>
          </div>`;

if (!html.includes(t2Target)) {
  console.error('Target 2 (Tab 2 Header button) not found!');
  process.exit(1);
}
html = html.replace(t2Target, t2Replacement);

// 3. Add modal markup before </body>
const modalMarkup = `
  <!-- High-Security Two-Click Action Confirmation Modal -->
  <div id="admin-action-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
    <div class="relative w-full max-w-lg bg-[#0d131f] border-2 border-red-500/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(255,0,85,0.4)] text-left space-y-4">
      <div class="flex items-center gap-3">
        <div id="modal-icon-container" class="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
          <span id="modal-icon" class="material-symbols-outlined text-2xl">warning</span>
        </div>
        <div>
          <h4 id="modal-title" class="text-lg font-headline font-black text-white uppercase tracking-wider">Security Confirmation</h4>
          <p id="modal-subtitle" class="text-xs font-mono text-gray-400">Two-factor Game Master Authorization</p>
        </div>
      </div>
      <div id="modal-description" class="text-sm font-mono text-gray-300 bg-black/40 p-4 rounded-xl border border-white/10 leading-relaxed">
        Action description here...
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-mono text-yellow font-bold uppercase tracking-wider block">
          Type <span class="text-white underline font-black">OK</span> to authorize this action:
        </label>
        <input type="text" id="modal-confirm-input" placeholder="Type OK to confirm" autocomplete="off"
               class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-yellow/50 text-white font-mono text-sm focus:outline-none focus:border-yellow focus:ring-1 focus:ring-yellow"
               oninput="checkModalConfirmInput()"
               onkeyup="if(event.key === 'Enter' && !document.getElementById('modal-execute-btn').disabled) executeAdminActionModal();" />
      </div>
      <div class="flex items-center justify-end gap-3 pt-2">
        <button onclick="closeAdminActionModal()" 
                class="px-4 py-2 rounded-xl border border-gray-600 bg-gray-800/60 hover:bg-gray-700 text-gray-300 text-xs font-headline font-bold transition cursor-pointer">
          CANCEL
        </button>
        <button id="modal-execute-btn" onclick="executeAdminActionModal()" disabled
                class="px-5 py-2.5 rounded-xl bg-red-500/20 border-2 border-red-500 text-red-400 text-xs font-headline font-black hover:bg-red-500 hover:text-white transition cursor-pointer opacity-50 cursor-not-allowed">
          CONFIRM AUTHORIZATION
        </button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="admin-action-modal"')) {
  html = html.replace('</body>', `${modalMarkup}\n</body>`);
}

// 4. Update JavaScript functions: Modal handling and Synchronized Countdown Engine
const jsFunctions = `
    // ─────────────────────────────────────────────────────────────
    // Two-Click High-Security Confirmation System
    // ─────────────────────────────────────────────────────────────
    var currentAdminModalAction = null;

    function openAdminActionModal(actionType) {
      currentAdminModalAction = actionType;
      var modal = document.getElementById('admin-action-modal');
      var title = document.getElementById('modal-title');
      var subtitle = document.getElementById('modal-subtitle');
      var desc = document.getElementById('modal-description');
      var icon = document.getElementById('modal-icon');
      var iconBox = document.getElementById('modal-icon-container');
      var input = document.getElementById('modal-confirm-input');
      var btn = document.getElementById('modal-execute-btn');

      if (!modal) return;
      if (input) input.value = '';
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      if (actionType === 'purge-teams') {
        if (title) title.innerText = 'SECURITY OVERRIDE // PURGE ALL SQUADS';
        if (subtitle) subtitle.innerText = 'Permanent Grid Cleanse Protocol';
        if (icon) icon.innerText = 'delete_forever';
        if (iconBox) iconBox.className = 'w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400';
        if (desc) {
          desc.innerHTML = '<span class="text-red-400 font-bold">CRITICAL WARNING:</span> This action will permanently remove <span class="text-white font-bold">ALL registered squads</span>, player clearances, inventory cards, and checkpoint logs from the live database.<br><br>The Game Master administrator account (<span class="text-green font-bold">samay</span>) will remain untouched.';
        }
        if (btn) {
          btn.innerText = 'CONFIRM SQUAD PURGE';
          btn.className = 'px-5 py-2.5 rounded-xl bg-red-500/30 border-2 border-red-500 text-red-300 text-xs font-headline font-black hover:bg-red-500 hover:text-white transition cursor-pointer opacity-50 cursor-not-allowed';
        }
      } else if (actionType === 'reset-points') {
        if (title) title.innerText = 'RESET ALL SQUAD POINTS TO ZERO';
        if (subtitle) subtitle.innerText = 'Score & Progress Wipe Protocol';
        if (icon) icon.innerText = 'restart_alt';
        if (iconBox) iconBox.className = 'w-12 h-12 rounded-xl bg-yellow/20 border border-yellow/40 flex items-center justify-center text-yellow';
        if (desc) {
          desc.innerHTML = '<span class="text-yellow font-bold">CONFIRMATION:</span> This will reset scores to <span class="text-white font-bold">0</span>, wipe all collected cards, and reset station progress for <span class="text-white font-bold">ALL registered squads</span>.<br><br>Squad accounts and login clearances will remain intact.';
        }
        if (btn) {
          btn.innerText = 'CONFIRM RESET TO ZERO';
          btn.className = 'px-5 py-2.5 rounded-xl bg-yellow/30 border-2 border-yellow text-yellow text-xs font-headline font-black hover:bg-yellow hover:text-black transition cursor-pointer opacity-50 cursor-not-allowed';
        }
      }

      modal.classList.remove('hidden');
      setTimeout(function() { if (input) input.focus(); }, 100);
    }

    function closeAdminActionModal() {
      var modal = document.getElementById('admin-action-modal');
      if (modal) modal.classList.add('hidden');
      currentAdminModalAction = null;
    }

    function checkModalConfirmInput() {
      var input = document.getElementById('modal-confirm-input');
      var btn = document.getElementById('modal-execute-btn');
      if (!input || !btn) return;
      var val = (input.value || '').trim().toUpperCase();
      if (val === 'OK') {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }

    async function executeAdminActionModal() {
      var input = document.getElementById('modal-confirm-input');
      var val = (input ? input.value || '' : '').trim().toUpperCase();
      if (val !== 'OK') {
        alert('Please type "OK" to authorize this action.');
        return;
      }

      var endpoint = currentAdminModalAction === 'purge-teams' 
        ? '/api/admin/teams/purge-all' 
        : '/api/admin/teams/reset-all-points';

      var btn = document.getElementById('modal-execute-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'EXECUTING...';
      }

      try {
        var res = await fetch(apiUrl(endpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        var data = await res.json();
        if (data.success) {
          alert(data.message || 'Operation executed successfully.');
          closeAdminActionModal();
          loadApprovedRoster();
          loadPendingApprovals();
          loadRegisteredTeams();
          loadLiveLeaderboard();
        } else {
          alert('Operation failed: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Network/Server error: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'CONFIRM AUTHORIZATION';
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Synchronized Zero-Jitter Admin Countdown Engine (100ms Ticker)
    // ─────────────────────────────────────────────────────────────
    var adminCountdownTimer = null;
    var adminCountdownEndsAtMs = 0;

    function startAdminLocalCountdown(endsAtIso) {
      if (adminCountdownTimer) clearInterval(adminCountdownTimer);
      adminCountdownEndsAtMs = endsAtIso ? new Date(endsAtIso).getTime() : (Date.now() + 10000);

      function tick() {
        var msLeft = adminCountdownEndsAtMs - Date.now();
        var secLeft = Math.max(0, Math.ceil(msLeft / 1000));
        var clockEl = document.getElementById('clock-display');
        var badgeEl = document.getElementById('game-phase-badge');

        if (badgeEl) {
          badgeEl.innerText = 'COUNTDOWN IN PROGRESS // ' + secLeft + 's';
          badgeEl.className = 'text-xs font-mono text-[#FFD600] uppercase tracking-widest font-bold animate-pulse';
        }
        if (clockEl) {
          clockEl.innerText = '00:' + String(secLeft).padStart(2, '0');
          clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-[#FFD600] tracking-wider drop-shadow-[0_0_20px_rgba(255,214,0,0.8)] animate-pulse';
        }

        if (msLeft <= 0) {
          clearInterval(adminCountdownTimer);
          adminCountdownTimer = null;
          serverGameState = 'PLAYER_PHASE';
          if (badgeEl) {
            badgeEl.innerText = '52-MIN HUNT // LIVE OPERATING';
            badgeEl.className = 'text-xs font-mono text-green uppercase tracking-widest font-bold';
          }
          if (clockEl) {
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-cyan tracking-wider drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]';
          }
          syncAdminGameState();
        }
      }

      tick();
      adminCountdownTimer = setInterval(tick, 100);
    }
`;

// Insert the jsFunctions right before function startClock
if (!html.includes('function openAdminActionModal')) {
  html = html.replace('function startClock()', `${jsFunctions}\n    function startClock()`);
}

// 5. Update start52MinCountdown to immediately start local countdown
const oldStart52 = `async function start52MinCountdown() {
      if (serverGameState === 'COUNTDOWN' || serverGameState === 'PLAYER_PHASE') {
        if (!confirm('Game is already underway. Do you want to re-initiate the 10-second countdown for a fresh 52-minute hunt?')) return;
      }
      try {
        var res = await fetch(apiUrl('/api/game/state'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COUNTDOWN', countdownSeconds: 10, durationMinutes: 52 })
        });
        syncAdminGameState();
      } catch (e) {
        alert('Failed to initiate countdown: ' + e.message);
      }
    }`;

const newStart52 = `async function start52MinCountdown() {
      if (serverGameState === 'COUNTDOWN' || serverGameState === 'PLAYER_PHASE') {
        if (!confirm('Game is already underway. Do you want to re-initiate the 10-second countdown for a fresh 52-minute hunt?')) return;
      }

      // Optimistic instant local feedback: zero lag on button click!
      serverGameState = 'COUNTDOWN';
      startAdminLocalCountdown(new Date(Date.now() + 10000).toISOString());

      try {
        var res = await fetch(apiUrl('/api/game/state'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COUNTDOWN', countdownSeconds: 10, durationMinutes: 52 })
        });
        var data = await res.json();
        var targetEndsAt = data.countdownEndsAt || (data.state && data.state.countdownEndsAt);
        if (targetEndsAt) {
          startAdminLocalCountdown(targetEndsAt);
        }
      } catch (e) {
        alert('Failed to initiate countdown: ' + e.message);
        syncAdminGameState();
      }
    }`;

if (html.includes(oldStart52)) {
  html = html.replace(oldStart52, newStart52);
} else {
  console.warn('oldStart52 exact block not found; checking partial');
}

// 6. Update syncAdminGameState to synchronize smoothly with COUNTDOWN
const oldSyncState = `if (serverGameState === 'COUNTDOWN') {
          if (badgeEl) {
            badgeEl.innerText = 'COUNTDOWN IN PROGRESS // ' + countdownSec + 's';
            badgeEl.className = 'text-xs font-mono text-[#FFD600] uppercase tracking-widest font-bold animate-pulse';
          }
          if (clockEl) {
            clockEl.innerText = '00:' + String(countdownSec).padStart(2, '0');
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-[#FFD600] tracking-wider drop-shadow-[0_0_20px_rgba(255,214,0,0.8)] animate-pulse';
          }
        }`;

const newSyncState = `if (serverGameState === 'COUNTDOWN') {
          var endsAt = data.countdownEndsAt || (gs && gs.countdownEndsAt);
          if (endsAt) {
            var endsMs = new Date(endsAt).getTime();
            if (!adminCountdownTimer || Math.abs(adminCountdownEndsAtMs - endsMs) > 1200) {
              startAdminLocalCountdown(endsAt);
            }
          } else if (!adminCountdownTimer) {
            startAdminLocalCountdown(new Date(Date.now() + (countdownSec || 10) * 1000).toISOString());
          }
        } else {
          if (adminCountdownTimer) {
            clearInterval(adminCountdownTimer);
            adminCountdownTimer = null;
          }
        }`;

if (html.includes(oldSyncState)) {
  html = html.replace(oldSyncState, newSyncState);
} else {
  console.warn('oldSyncState exact block not found');
}

// 7. Update startClock polling interval from 1500ms to 1000ms
html = html.replace('setInterval(syncAdminGameState, 1500);', 'setInterval(syncAdminGameState, 1000);');

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully patched public/admin_panel.html');
