const fs = require('fs');
const path = require('path');

function updateAdminPanel(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace Clock Action Buttons
  const oldButtonsBlock = `<div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onclick="togglePauseGame()" id="btn-pause-ops" 
                  class="flex-1 md:flex-initial px-5 py-2.5 rounded-xl border border-yellow/40 bg-yellow/10 hover:bg-yellow/20 text-yellow text-xs font-headline font-bold flex items-center justify-center gap-2 transition">
            <span class="material-symbols-outlined text-base">pause_circle</span>
            <span id="btn-pause-text">PAUSE OPS</span>
          </button>

          <button onclick="changeGameStatus('PLAYER_PHASE')" 
                  class="flex-1 md:flex-initial px-5 py-2.5 rounded-xl border border-green/40 bg-green/10 hover:bg-green/20 text-green text-xs font-headline font-bold flex items-center justify-center gap-2 transition">
            <span class="material-symbols-outlined text-base">play_circle</span>
            <span>START HUNT</span>
          </button>

          <button onclick="changeGameStatus('ENDED')" 
                  class="flex-1 md:flex-initial px-5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-headline font-bold flex items-center justify-center gap-2 transition">
            <span class="material-symbols-outlined text-base">flag</span>
            <span>END MATCH</span>
          </button>
        </div>`;

  const newButtonsBlock = `<div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button onclick="start52MinCountdown()" 
                  class="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border-2 border-green/60 bg-gradient-to-r from-green/20 to-tertiary-container/30 hover:brightness-125 text-white text-xs font-headline font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.4)] active:scale-95 transition cursor-pointer">
            <span class="material-symbols-outlined text-lg text-green">rocket_launch</span>
            <span>START 52-MIN HUNT (10s Countdown)</span>
          </button>

          <button onclick="togglePauseGame()" id="btn-pause-ops" 
                  class="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl border border-yellow/40 bg-yellow/10 hover:bg-yellow/20 text-yellow text-xs font-headline font-bold flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span class="material-symbols-outlined text-base">pause_circle</span>
            <span id="btn-pause-text">PAUSE OPS</span>
          </button>

          <button onclick="endMatch()" 
                  class="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-headline font-bold flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span class="material-symbols-outlined text-base">flag</span>
            <span>END MATCH</span>
          </button>

          <button onclick="resetGameToLobby()" 
                  class="flex-1 md:flex-initial px-3 py-2.5 rounded-xl border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 text-cyan text-xs font-headline font-bold flex items-center justify-center gap-1.5 transition cursor-pointer" title="Reset to Lobby Standby">
            <span class="material-symbols-outlined text-base">restart_alt</span>
            <span>RESET LOBBY</span>
          </button>
        </div>`;

  content = content.replace(oldButtonsBlock, newButtonsBlock);

  // 2. Replace Master Clock Functions
  const oldClockSection = `    // Master Clock
    function startClock() {
      setInterval(function() {
        if (timerRunning) {
          timerSeconds++;
          var h = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
          var m = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
          var s = String(timerSeconds % 60).padStart(2, '0');
          var el = document.getElementById('clock-display');
          if (el) el.innerText = h + ':' + m + ':' + s;
        }
      }, 1000);
    }

    function togglePauseGame() {
      timerRunning = !timerRunning;
      var btn = document.getElementById('btn-pause-text');
      if (btn) btn.innerText = timerRunning ? 'PAUSE OPS' : 'RESUME OPS';
    }

    async function changeGameStatus(status) {
      try {
        await fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status })
        });
        document.getElementById('game-phase-badge').innerText = status + ' // LIVE';
      } catch (e) {
        console.error(e);
      }
    }`;

  const newClockSection = `    // ─────────────────────────────────────────────────────────
    // SYNCHRONIZED MASTER 52-MINUTE CLOCK & GAME ORCHESTRATION
    // ─────────────────────────────────────────────────────────
    var serverRemainingSeconds = 3120;
    var serverGameState = 'LOBBY';

    function formatTimeDisplay(totalSec) {
      if (totalSec <= 0) return '00:00';
      var m = Math.floor(totalSec / 60);
      var s = totalSec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    async function syncAdminGameState() {
      try {
        var res = await fetch('/api/game/state?_t=' + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (!data.success) return;

        var gs = data.state || {};
        serverGameState = gs.status || 'LOBBY';
        var countdownSec = data.countdownSeconds || 0;
        var remSec = data.remainingSeconds !== undefined ? data.remainingSeconds : 3120;
        serverRemainingSeconds = remSec;

        var clockEl = document.getElementById('clock-display');
        var badgeEl = document.getElementById('game-phase-badge');
        var pauseBtnText = document.getElementById('btn-pause-text');

        if (serverGameState === 'COUNTDOWN') {
          if (badgeEl) {
            badgeEl.innerText = 'COUNTDOWN IN PROGRESS // ' + countdownSec + 's';
            badgeEl.className = 'text-xs font-mono text-[#FFD600] uppercase tracking-widest font-bold animate-pulse';
          }
          if (clockEl) {
            clockEl.innerText = '00:' + String(countdownSec).padStart(2, '0');
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-[#FFD600] tracking-wider drop-shadow-[0_0_20px_rgba(255,214,0,0.8)] animate-pulse';
          }
        } else if (serverGameState === 'PLAYER_PHASE') {
          if (badgeEl) {
            badgeEl.innerText = '52-MIN HUNT // LIVE OPERATING';
            badgeEl.className = 'text-xs font-mono text-green uppercase tracking-widest font-bold';
          }
          if (clockEl) {
            clockEl.innerText = formatTimeDisplay(remSec);
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-cyan tracking-wider drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]';
          }
          if (pauseBtnText) pauseBtnText.innerText = 'PAUSE OPS';
        } else if (serverGameState === 'PAUSED') {
          if (badgeEl) {
            badgeEl.innerText = 'HUNT PAUSED // STANDBY';
            badgeEl.className = 'text-xs font-mono text-[#FFD600] uppercase tracking-widest font-bold';
          }
          if (clockEl) {
            clockEl.innerText = formatTimeDisplay(remSec);
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-yellow tracking-wider';
          }
          if (pauseBtnText) pauseBtnText.innerText = 'RESUME OPS';
        } else if (serverGameState === 'ENDED') {
          if (badgeEl) {
            badgeEl.innerText = 'MATCH CONCLUDED // ENDED';
            badgeEl.className = 'text-xs font-mono text-red-400 uppercase tracking-widest font-bold';
          }
          if (clockEl) {
            clockEl.innerText = '00:00';
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-red-500 tracking-wider';
          }
        } else { // LOBBY
          if (badgeEl) {
            badgeEl.innerText = 'LOBBY STANDBY // AWAITING START';
            badgeEl.className = 'text-xs font-mono text-cyan uppercase tracking-widest font-bold';
          }
          if (clockEl) {
            clockEl.innerText = '52:00';
            clockEl.className = 'text-4xl sm:text-5xl font-headline font-black text-cyan tracking-wider';
          }
        }
      } catch (e) {
        console.warn('Sync admin game state error:', e);
      }
    }

    function startClock() {
      syncAdminGameState();
      setInterval(syncAdminGameState, 1500);
      setInterval(function() {
        if (serverGameState === 'PLAYER_PHASE' && serverRemainingSeconds > 0) {
          serverRemainingSeconds--;
          var clockEl = document.getElementById('clock-display');
          if (clockEl) clockEl.innerText = formatTimeDisplay(serverRemainingSeconds);
        }
      }, 1000);
    }

    async function start52MinCountdown() {
      if (serverGameState === 'COUNTDOWN' || serverGameState === 'PLAYER_PHASE') {
        if (!confirm('Game is already underway. Do you want to re-initiate the 10-second countdown for a fresh 52-minute hunt?')) return;
      }
      try {
        var res = await fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COUNTDOWN', countdownSeconds: 10, durationMinutes: 52 })
        });
        syncAdminGameState();
      } catch (e) {
        alert('Failed to initiate countdown: ' + e.message);
      }
    }

    async function togglePauseGame() {
      try {
        var action = (serverGameState === 'PAUSED') ? 'RESUME' : 'PAUSE';
        await fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action })
        });
        syncAdminGameState();
      } catch (e) {
        alert('Failed to pause/resume game: ' + e.message);
      }
    }

    async function endMatch() {
      if (!confirm('Are you sure you want to END the match now? All operative check-ins will be locked.')) return;
      try {
        await fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ENDED' })
        });
        syncAdminGameState();
      } catch (e) {
        alert('Failed to end match: ' + e.message);
      }
    }

    async function resetGameToLobby() {
      if (!confirm('Reset game state back to LOBBY standby (52:00)? Players will return to the 3D Waiting Screen.')) return;
      try {
        await fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'RESET' })
        });
        syncAdminGameState();
      } catch (e) {
        alert('Failed to reset to lobby: ' + e.message);
      }
    }

    async function changeGameStatus(status) {
      if (status === 'PLAYER_PHASE') {
        start52MinCountdown();
      } else if (status === 'ENDED') {
        endMatch();
      } else {
        await fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status })
        });
        syncAdminGameState();
      }
    }`;

  content = content.replace(oldClockSection, newClockSection);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated admin_panel in ' + filePath);
}

function updateMemberCheckin(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update Telemetry Bar to include live hunt clock
  const oldTelemetryBar = `<div class="grid grid-cols-3 gap-2 mt-space-md pt-space-sm border-t border-outline-variant/30">
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Logged</span>
            <span class="font-headline-sm text-headline-sm text-on-surface" id="telemetry-logged-count">0</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Squads</span>
            <span class="font-headline-sm text-headline-sm text-tertiary" id="telemetry-squads-count">0 Live</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Status</span>
            <span class="font-headline-sm text-headline-sm text-primary">ONLINE</span>
          </div>
        </div>`;

  const newTelemetryBar = `<div class="grid grid-cols-4 gap-2 mt-space-md pt-space-sm border-t border-outline-variant/30">
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Logged</span>
            <span class="font-headline-sm text-headline-sm text-on-surface" id="telemetry-logged-count">0</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Squads</span>
            <span class="font-headline-sm text-headline-sm text-tertiary" id="telemetry-squads-count">0 Live</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Hunt Clock</span>
            <span class="font-headline-sm text-headline-sm text-secondary-fixed font-mono font-bold" id="telemetry-hunt-clock">52:00</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Status</span>
            <span class="font-headline-sm text-headline-sm text-primary" id="telemetry-game-status">LOBBY</span>
          </div>
        </div>`;

  content = content.replace(oldTelemetryBar, newTelemetryBar);

  // 2. Add syncMarshalGameState in script
  const marshalSyncScript = `
    // Live Synchronized Game State & 52-Minute Clock Sync
    var marshalRemainingHuntSeconds = 3120;
    var marshalGameState = 'LOBBY';

    async function syncMarshalGameState() {
      try {
        var res = await fetch('/api/game/state?_t=' + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (!data.success) return;

        var gs = data.state || {};
        marshalGameState = gs.status || 'LOBBY';
        var remSec = data.remainingSeconds !== undefined ? data.remainingSeconds : 3120;
        marshalRemainingHuntSeconds = remSec;

        var clockEl = document.getElementById('telemetry-hunt-clock');
        var statusEl = document.getElementById('telemetry-game-status');

        if (clockEl) {
          var m = Math.floor(remSec / 60);
          var s = remSec % 60;
          clockEl.innerText = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        if (statusEl) {
          statusEl.innerText = marshalGameState;
          if (marshalGameState === 'PLAYER_PHASE') {
            statusEl.className = 'font-headline-sm text-headline-sm text-green';
          } else if (marshalGameState === 'COUNTDOWN') {
            statusEl.className = 'font-headline-sm text-headline-sm text-[#FFD600] animate-pulse';
          } else {
            statusEl.className = 'font-headline-sm text-headline-sm text-primary';
          }
        }
      } catch (e) {}
    }
  `;

  if (!content.includes('function syncMarshalGameState')) {
    content = content.replace('window.addEventListener(\'DOMContentLoaded\', function() {', marshalSyncScript + '\n    window.addEventListener(\'DOMContentLoaded\', function() {');
  }

  // 3. Trigger in DOMContentLoaded
  if (!content.includes('syncMarshalGameState();')) {
    content = content.replace('loadRecentCheckins();', 'loadRecentCheckins();\n      syncMarshalGameState();\n      setInterval(syncMarshalGameState, 2000);\n      setInterval(function() {\n        if (marshalGameState === "PLAYER_PHASE" && marshalRemainingHuntSeconds > 0) {\n          marshalRemainingHuntSeconds--;\n          var clockEl = document.getElementById("telemetry-hunt-clock");\n          if (clockEl) {\n            var m = Math.floor(marshalRemainingHuntSeconds / 60);\n            var s = marshalRemainingHuntSeconds % 60;\n            clockEl.innerText = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");\n          }\n        }\n      }, 1000);');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated member_checkin in ' + filePath);
}

const baseDir = path.resolve(__dirname, '..');
updateAdminPanel(path.join(baseDir, 'public', 'admin_panel.html'));
updateAdminPanel(path.join(baseDir, 'design_refs', 'html', 'admin_panel.html'));
updateMemberCheckin(path.join(baseDir, 'public', 'member_checkin.html'));
updateMemberCheckin(path.join(baseDir, 'design_refs', 'html', 'member_checkin.html'));
