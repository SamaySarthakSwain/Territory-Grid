const fs = require('fs');
const path = require('path');

const playerHtmlPath = path.join(__dirname, '..', 'public', 'player_dashboard.html');
let html = fs.readFileSync(playerHtmlPath, 'utf8');

// 1. Add startPlayerLocalCountdown function right before function triggerLaunchBurst
const target1 = 'function triggerLaunchBurst() {';

const localCountdownFunc = `// ─────────────────────────────────────────────────────────────
    // High-Precision Zero-Jitter Player Countdown Engine (100ms Ticker)
    // ─────────────────────────────────────────────────────────────
    var playerCountdownTimer = null;
    var playerCountdownEndsAtMs = 0;

    function startPlayerLocalCountdown(endsAtIso) {
      if (playerCountdownTimer) clearInterval(playerCountdownTimer);
      playerCountdownEndsAtMs = endsAtIso ? new Date(endsAtIso).getTime() : (Date.now() + 10000);

      var countdownOverlay = document.getElementById('gaming-countdown-overlay');
      var waitingHall = document.getElementById('screen-waiting-hall');
      var activeHunt = document.getElementById('screen-active-hunt');

      if (countdownOverlay) countdownOverlay.classList.remove('hidden');
      if (waitingHall) waitingHall.classList.remove('hidden');
      if (activeHunt) activeHunt.classList.add('hidden');

      function tick() {
        var msLeft = playerCountdownEndsAtMs - Date.now();
        var secLeft = Math.max(0, Math.ceil(msLeft / 1000));

        renderCountdownStep(secLeft);

        if (msLeft <= 0) {
          clearInterval(playerCountdownTimer);
          playerCountdownTimer = null;
          currentGameState = 'PLAYER_PHASE';
          triggerLaunchBurst();
          if (waitingHall) waitingHall.classList.add('hidden');
          if (activeHunt) activeHunt.classList.remove('hidden');
        }
      }

      tick();
      playerCountdownTimer = setInterval(tick, 100);
    }

    function triggerLaunchBurst() {`;

if (!html.includes('function startPlayerLocalCountdown')) {
  if (!html.includes(target1)) {
    console.error('target1 triggerLaunchBurst not found!');
    process.exit(1);
  }
  html = html.replace(target1, localCountdownFunc);
}

// 2. Update the COUNTDOWN block in syncGameState
const target2 = `if (newStatus === 'COUNTDOWN') {
          // Show 10-second countdown overlay!
          if (countdownOverlay) countdownOverlay.classList.remove('hidden');
          if (waitingHall) waitingHall.classList.remove('hidden');
          if (activeHunt) activeHunt.classList.add('hidden');

          renderCountdownStep(countdownSec);

        } else if (newStatus === 'PLAYER_PHASE') {`;

const replacement2 = `if (newStatus === 'COUNTDOWN') {
          var endsAt = data.countdownEndsAt || (gs && gs.countdownEndsAt);
          if (endsAt) {
            var endsMs = new Date(endsAt).getTime();
            if (!playerCountdownTimer || Math.abs(playerCountdownEndsAtMs - endsMs) > 1200) {
              startPlayerLocalCountdown(endsAt);
            }
          } else {
            if (!playerCountdownTimer) {
              startPlayerLocalCountdown(new Date(Date.now() + (countdownSec || 10) * 1000).toISOString());
            }
          }
        } else if (newStatus === 'PLAYER_PHASE') {
          if (playerCountdownTimer) {
            clearInterval(playerCountdownTimer);
            playerCountdownTimer = null;
          }
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
          if (playerCountdownTimer) {
            clearInterval(playerCountdownTimer);
            playerCountdownTimer = null;
          }
          if (countdownOverlay) countdownOverlay.classList.add('hidden');
          if (waitingHall) waitingHall.classList.remove('hidden');
          if (activeHunt) activeHunt.classList.add('hidden');
        }`;

// Let's check how the original block looks
const target2Old = `if (newStatus === 'COUNTDOWN') {
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
        }`;

if (html.includes(target2Old)) {
  html = html.replace(target2Old, replacement2);
} else {
  console.warn('target2Old not matched exactly; searching for partial block');
}

// 3. Update scheduleNextGameStateSync
const target3 = `function scheduleNextGameStateSync() {
        var jitter = Math.floor(Math.random() * 800);
        var baseDelay = currentGameState === 'PLAYER_PHASE' ? 3600 : 2500;
        setTimeout(function() {
          syncGameState().finally(scheduleNextGameStateSync);
        }, baseDelay + jitter);
      }`;

const replacement3 = `function scheduleNextGameStateSync() {
        var jitter = Math.floor(Math.random() * 200);
        // Ultra-responsive polling in LOBBY or COUNTDOWN (800ms) so match start is picked up with zero lag!
        var baseDelay = (currentGameState === 'LOBBY' || currentGameState === 'COUNTDOWN') ? 800 : 3500;
        setTimeout(function() {
          syncGameState().finally(scheduleNextGameStateSync);
        }, baseDelay + jitter);
      }`;

if (html.includes(target3)) {
  html = html.replace(target3, replacement3);
} else {
  console.warn('target3 not matched exactly');
}

fs.writeFileSync(playerHtmlPath, html, 'utf8');
console.log('Successfully patched public/player_dashboard.html');
