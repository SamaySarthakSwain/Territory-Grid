const fs = require('fs');
const path = require('path');

function updateDashboard(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add CSS for Gyroscope and Countdown in <style>
  const extraStyles = `
    /* 3D Cyber Gyroscope Animation */
    .gyro-stage {
      perspective: 1000px;
      width: 210px;
      height: 210px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gyro-sphere {
      position: relative;
      width: 175px;
      height: 175px;
      transform-style: preserve-3d;
      animation: gyroSpin 14s linear infinite;
    }
    @keyframes gyroSpin {
      0% { transform: rotateX(20deg) rotateY(0deg) rotateZ(0deg); }
      50% { transform: rotateX(-30deg) rotateY(180deg) rotateZ(180deg); }
      100% { transform: rotateX(20deg) rotateY(360deg) rotateZ(360deg); }
    }
    .gyro-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      pointer-events: none;
    }
    .gyro-ring-1 {
      border: 2px solid #00e5ff;
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.6), inset 0 0 15px rgba(0, 229, 255, 0.3);
      transform: rotateX(0deg) rotateY(0deg);
    }
    .gyro-ring-2 {
      border: 2px dashed #ffd9e3;
      box-shadow: 0 0 20px rgba(255, 176, 201, 0.5), inset 0 0 12px rgba(255, 176, 201, 0.3);
      transform: rotateX(65deg) rotateY(45deg);
    }
    .gyro-ring-3 {
      border: 2px dotted #79ff5b;
      box-shadow: 0 0 20px rgba(121, 255, 91, 0.5), inset 0 0 10px rgba(121, 255, 91, 0.3);
      transform: rotateX(115deg) rotateY(80deg);
    }
    .gyro-core {
      position: absolute;
      inset: 42px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 229, 255, 0.45) 0%, rgba(10, 14, 23, 0.95) 75%);
      border: 2px solid rgba(0, 229, 255, 0.8);
      box-shadow: 0 0 35px rgba(0, 229, 255, 0.7), inset 0 0 20px rgba(0, 229, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  if (!content.includes('.gyro-stage')) {
    content = content.replace('</style>', extraStyles + '\n  </style>');
  }

  // 2. Add Live 52-Minute Timer in Header
  const oldHeaderEnd = `<div class="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-0.5 rounded-full border border-primary-container/30">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          <span class="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider" id="header-callsign-badge">SQUAD</span>
        </div>`;

  const newHeaderTimer = `<!-- Live Synchronized 52-Minute Hunt Timer -->
        <div id="hunt-timer-badge" class="flex items-center gap-1.5 bg-[#061220] px-3 py-1 rounded-full border border-primary/50 shadow-[0_0_12px_rgba(0,229,255,0.3)]">
          <span class="material-symbols-outlined text-[15px] text-primary animate-pulse" id="timer-clock-icon">timer</span>
          <span class="font-mono text-xs sm:text-sm font-bold text-white tracking-widest" id="hunt-timer-display">52:00</span>
        </div>

        ` + oldHeaderEnd;

  if (!content.includes('id="hunt-timer-badge"')) {
    content = content.replace(oldHeaderEnd, newHeaderTimer);
  }

  // 3. Wrap main content with #player-active-hunt-container and add #player-waiting-hall
  const waitingHallHtml = `
      <!-- ==================== 3D HOLOGRAPHIC WAITING HALL ==================== -->
      <div id="player-waiting-hall" class="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full px-4 py-8 text-center relative overflow-hidden">
        
        <!-- Ambient Cyber Background Grid & Energy Glow -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.12)_0%,transparent_70%)] pointer-events-none"></div>
        <div class="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <!-- Radar Sweep Laser Line -->
        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent shadow-[0_0_15px_#00e5ff] opacity-40 animate-pulse pointer-events-none"></div>

        <!-- 3D Gyroscope Hologram Core -->
        <div class="relative my-4 flex items-center justify-center">
          <div class="gyro-stage">
            <div class="gyro-sphere">
              <div class="gyro-ring gyro-ring-1"></div>
              <div class="gyro-ring gyro-ring-2"></div>
              <div class="gyro-ring gyro-ring-3"></div>
              <div class="gyro-core">
                <div class="relative flex items-center justify-center w-full h-full">
                  <span class="material-symbols-outlined text-4xl text-[#00e5ff] drop-shadow-[0_0_15px_rgba(0,229,255,0.9)] animate-pulse">lock</span>
                  <div class="absolute w-2 h-2 rounded-full bg-[#FFD600] animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Standby Status Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#07192c] border border-cyan/40 shadow-[0_0_20px_rgba(0,229,255,0.3)] mb-4">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan animate-ping"></span>
          <span class="font-mono text-xs font-bold text-cyan tracking-widest uppercase">STANDBY // GRID LOCKED</span>
        </div>

        <!-- Headline -->
        <h1 class="text-2xl sm:text-3xl font-headline font-black text-white tracking-wide uppercase drop-shadow-[0_0_25px_rgba(0,229,255,0.4)] mb-2">
          Waiting for Admin to Start the Game
        </h1>

        <!-- Subtext description -->
        <p class="max-w-md text-xs sm:text-sm text-gray-300 font-body leading-relaxed mb-6">
          Your squad is registered and cleared for <b class="text-white">Territory Grid</b>. All campus clue hints, mission directives, and your dynamic playing card cipher are encrypted and will unlock simultaneously the moment Game Master Samay transmits the launch signal.
        </p>

        <!-- Squad Telemetry Pod -->
        <div class="w-full max-w-sm rounded-2xl bg-surface-container/90 border border-primary/30 p-4 backdrop-blur-xl shadow-2xl space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span class="text-xs font-mono text-gray-400 uppercase">Assigned Squad</span>
            <span class="text-sm font-headline font-bold text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">shield</span>
              <span id="waiting-squad-callsign">Squad Alpha</span>
            </span>
          </div>

          <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span class="text-xs font-mono text-gray-400 uppercase">Clearance Status</span>
            <span class="text-xs font-mono font-bold text-tertiary flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">verified</span> AUTHORIZED
            </span>
          </div>

          <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span class="text-xs font-mono text-gray-400 uppercase">Game Duration</span>
            <span class="text-xs font-mono font-bold text-secondary-fixed">52:00 MINUTES</span>
          </div>

          <div class="flex items-center justify-between pt-0.5">
            <span class="text-xs font-mono text-gray-400 uppercase">Synchronized Master Clock</span>
            <span class="text-xs font-mono font-black text-cyan tracking-wider" id="waiting-hunt-clock">52:00 [READY]</span>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-2 text-[11px] font-mono text-gray-500">
          <span class="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
          <span>Live WebSocket / MongoDB Channel Active • Zero Refresh Required</span>
        </div>

      </div>
  `;

  const oldMainStart = '<main class="flex flex-col relative w-full pt-16 pb-20 bg-surface min-h-screen">\n    <div class="flex flex-col w-full px-gutter space-y-space-md pb-6">';
  const oldMainEnd = '    </div>\n  </main>';

  if (!content.includes('id="player-waiting-hall"')) {
    content = content.replace(
      oldMainStart,
      '<main class="flex flex-col relative w-full pt-16 pb-20 bg-surface min-h-screen">\n' +
      waitingHallHtml + '\n' +
      '    <div id="player-active-hunt-container" class="hidden flex flex-col w-full px-gutter space-y-space-md pb-6">'
    );
    // Replace the closing tag before </main>
    const lastDivMain = content.lastIndexOf('    </div>\n  </main>');
    if (lastDivMain !== -1) {
      content = content.slice(0, lastDivMain) + '    </div>\n    </div>\n  </main>' + content.slice(lastDivMain + '    </div>\n  </main>'.length);
    }
  }

  // 4. Add AAA Gaming Countdown Overlay before </body>
  const countdownOverlayHtml = `
  <!-- ==================== AAA GAMING 10-SECOND COUNTDOWN OVERLAY ==================== -->
  <div id="gaming-countdown-overlay" class="hidden fixed inset-0 z-[9999] bg-[#030712]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
    
    <!-- Pulse Hex Matrix & Strobe Glow -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,85,0.18)_0%,rgba(0,229,255,0.12)_50%,transparent_75%)] pointer-events-none animate-pulse"></div>
    <div class="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#00e5ff_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
    
    <!-- Top Alert HUD -->
    <div class="relative z-10 flex flex-col items-center gap-2 mb-4">
      <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 font-mono text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-bounce">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
        <span>⚠️ LAUNCH PROTOCOL ENGAGED // GRID IMMINENT ⚠️</span>
      </div>
      <p class="text-xs font-mono text-gray-300 uppercase tracking-widest">Deploying 52-Minute Territory Hunt Directive</p>
    </div>

    <!-- Giant 3D Holographic Countdown Digits -->
    <div class="relative z-10 my-4 flex items-center justify-center">
      <div id="countdown-num-wrapper" class="relative">
        <div id="countdown-shockwave" class="absolute inset-0 rounded-full bg-cyan/20 blur-2xl pointer-events-none"></div>
        <div id="countdown-big-num" class="font-headline font-black text-8xl sm:text-9xl md:text-[160px] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan to-primary drop-shadow-[0_0_60px_rgba(0,229,255,0.95)] leading-none select-none transition-all duration-150">
          10
        </div>
      </div>
    </div>

    <!-- Progress Charge Bar -->
    <div class="relative z-10 w-full max-w-sm mt-4">
      <div class="flex items-center justify-between text-[11px] font-mono text-cyan mb-1.5 px-1 font-bold">
        <span>QUANTUM REACTOR CHARGE</span>
        <span id="countdown-charge-pct">100%</span>
      </div>
      <div class="w-full h-3 rounded-full bg-black/80 border border-cyan/50 p-0.5 overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.4)]">
        <div id="countdown-progress-bar" class="h-full rounded-full bg-gradient-to-r from-cyan via-tertiary-container to-[#FFD600] transition-all duration-300" style="width: 100%;"></div>
      </div>
      <p class="text-[10px] font-mono text-gray-400 mt-2 text-center" id="countdown-action-hint">PREPARE YOUR SQUAD • DO NOT CLOSE APP</p>
    </div>

  </div>
  `;

  if (!content.includes('id="gaming-countdown-overlay"')) {
    content = content.replace('</body>', countdownOverlayHtml + '\n</body>');
  }

  // 5. Add Game State Sync, 52-Minute Countdown Timer & Web Audio Functions in Script
  const gameSyncScripts = `
    // ─────────────────────────────────────────────────────────
    // SYNCHRONIZED 52-MINUTE HUNT TIMER & GAME LAUNCH CONTROLLER
    // ─────────────────────────────────────────────────────────
    var currentGameState = 'LOBBY';
    var serverRemainingHuntSeconds = 3120; // 52 minutes
    var lastCountdownSecond = -1;

    function playCountdownTone(freq, isFinal) {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx = new AudioCtx();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = isFinal ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq || 550, ctx.currentTime);
        if (isFinal) {
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        } else {
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
      } catch (e) {}
    }

    function formatMinutesSeconds(totalSec) {
      if (totalSec <= 0) return '00:00';
      var m = Math.floor(totalSec / 60);
      var s = totalSec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function updateHuntTimerDisplay(remSec) {
      var display = document.getElementById('hunt-timer-display');
      var badge = document.getElementById('hunt-timer-badge');
      if (!display) return;

      display.innerText = formatMinutesSeconds(remSec);

      if (remSec <= 0) {
        display.innerText = '00:00';
        display.classList.add('text-error');
      } else if (remSec <= 300) { // < 5 mins
        display.className = 'font-mono text-xs sm:text-sm font-black text-red-500 tracking-widest animate-pulse';
        if (badge) badge.style.borderColor = 'rgba(239, 68, 68, 0.7)';
      } else if (remSec <= 900) { // < 15 mins
        display.className = 'font-mono text-xs sm:text-sm font-black text-[#FFD600] tracking-widest';
        if (badge) badge.style.borderColor = 'rgba(255, 214, 0, 0.6)';
      } else {
        display.className = 'font-mono text-xs sm:text-sm font-black text-white tracking-widest';
        if (badge) badge.style.borderColor = 'rgba(0, 229, 255, 0.4)';
      }
    }

    function renderCountdownStep(sec) {
      var numEl = document.getElementById('countdown-big-num');
      var barEl = document.getElementById('countdown-progress-bar');
      var pctEl = document.getElementById('countdown-charge-pct');
      if (!numEl) return;

      if (sec !== lastCountdownSecond) {
        lastCountdownSecond = sec;
        numEl.innerText = sec > 0 ? sec : 'START!';

        // Bounce animation
        numEl.style.transform = 'scale(1.35)';
        setTimeout(function() { numEl.style.transform = 'scale(1)'; }, 150);

        // Progress bar
        var pct = Math.max(0, Math.min(100, Math.round((sec / 10) * 100)));
        if (barEl) barEl.style.width = pct + '%';
        if (pctEl) pctEl.innerText = pct + '%';

        // High-tech synthesized audio tone rising with each count
        var freq = 440 + (10 - sec) * 55; // 440Hz -> 990Hz
        playCountdownTone(freq, sec === 0);
      }
    }

    function triggerLaunchBurst() {
      var numEl = document.getElementById('countdown-big-num');
      var hintEl = document.getElementById('countdown-action-hint');
      var overlay = document.getElementById('gaming-countdown-overlay');
      if (numEl) {
        numEl.innerText = 'GO!';
        numEl.className = 'font-headline font-black text-7xl sm:text-9xl text-green drop-shadow-[0_0_70px_rgba(44,241,0,0.95)]';
      }
      if (hintEl) hintEl.innerText = 'HUNT COMMENCED // DEPLOY OPERATIVES!';
      playCountdownTone(1200, true);

      setTimeout(function() {
        if (overlay) overlay.classList.add('hidden');
      }, 900);
    }

    async function syncGameState() {
      try {
        var res = await fetch('/api/game/state?_t=' + Date.now(), { cache: 'no-store' });
        var data = await res.json();
        if (!data.success) return;

        var gs = data.state || {};
        var newStatus = gs.status || 'LOBBY';
        var countdownSec = data.countdownSeconds || 0;
        var remSec = data.remainingSeconds !== undefined ? data.remainingSeconds : 3120;

        serverRemainingHuntSeconds = remSec;
        updateHuntTimerDisplay(remSec);

        var squadName = (currentMyTeam ? (currentMyTeam.name || currentMyTeam.callsign) : (currentUser ? currentUser.callsign : 'Squad'));
        var wCall = document.getElementById('waiting-squad-callsign');
        if (wCall && squadName) wCall.innerText = squadName;

        var wClock = document.getElementById('waiting-hunt-clock');
        if (wClock) wClock.innerText = formatMinutesSeconds(remSec) + ' [STANDBY]';

        var waitingHall = document.getElementById('player-waiting-hall');
        var activeHunt = document.getElementById('player-active-hunt-container');
        var countdownOverlay = document.getElementById('gaming-countdown-overlay');

        if (newStatus === 'COUNTDOWN') {
          // Show 10-second countdown overlay!
          if (countdownOverlay) countdownOverlay.classList.remove('hidden');
          if (waitingHall) waitingHall.classList.remove('hidden');
          if (activeHunt) activeHunt.classList.add('hidden');

          renderCountdownStep(countdownSec);

        } else if (newStatus === 'PLAYER_PHASE') {
          // LIVE GAME! Hide countdown and waiting screen, show full active hunt!
          if (countdownOverlay) {
            if (!countdownOverlay.classList.contains('hidden')) {
              triggerLaunchBurst();
            } else {
              countdownOverlay.classList.add('hidden');
            }
          }
          if (waitingHall) waitingHall.classList.add('hidden');
          if (activeHunt) activeHunt.classList.remove('hidden');

        } else {
          // LOBBY, WAITING, or ENDED
          if (countdownOverlay) countdownOverlay.classList.add('hidden');
          if (waitingHall) waitingHall.classList.remove('hidden');
          if (activeHunt) activeHunt.classList.add('hidden');
        }

        currentGameState = newStatus;

      } catch (e) {
        console.warn('Game state sync error:', e);
      }
    }
  `;

  if (!content.includes('function syncGameState')) {
    content = content.replace('window.addEventListener(\'DOMContentLoaded\', function() {', gameSyncScripts + '\n    window.addEventListener(\'DOMContentLoaded\', function() {');
  }

  // 6. Connect in DOMContentLoaded
  const oldDomLoaded = `      loadCluesAndSync();
      // Fast live sync every 1.5 seconds for instantaneous clue & score updates
      setInterval(syncTeamData, 1500);`;

  const newDomLoaded = `      loadCluesAndSync();
      // Fast live sync every 1.5 seconds for instantaneous clue & score updates
      setInterval(syncTeamData, 1500);

      // Fast game state sync every 1.5 seconds & continuous 1s timer countdown
      syncGameState();
      setInterval(syncGameState, 1500);
      setInterval(function() {
        if (currentGameState === 'PLAYER_PHASE' && serverRemainingHuntSeconds > 0) {
          serverRemainingHuntSeconds--;
          updateHuntTimerDisplay(serverRemainingHuntSeconds);
        }
      }, 1000);`;

  if (!content.includes('syncGameState();')) {
    content = content.replace(oldDomLoaded, newDomLoaded);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated player_dashboard in:', filePath);
}

const baseDir = path.resolve(__dirname, '..');
updateDashboard(path.join(baseDir, 'public', 'player_dashboard.html'));
updateDashboard(path.join(baseDir, 'design_refs', 'html', 'player_dashboard.html'));
