const fs = require('fs');
const path = require('path');

// =========================================================================
// 1. PATCH PUBLIC/PLAYER_DASHBOARD.HTML
// =========================================================================
const playerPath = path.join(__dirname, '..', 'public', 'player_dashboard.html');
let playerHtml = fs.readFileSync(playerPath, 'utf8');

const oldPlayerStyle = `<style>
  button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }`;

const newPlayerStyle = `<style>
  button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  button {
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease, opacity 0.15s ease;
  }
  button:active:not(:disabled) {
    transform: scale(0.96);
  }
  button > * {
    pointer-events: none;
  }
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

if (playerHtml.includes(oldPlayerStyle)) {
  playerHtml = playerHtml.replace(oldPlayerStyle, newPlayerStyle);
  fs.writeFileSync(playerPath, playerHtml, 'utf8');
  console.log('✅ Patched player_dashboard.html CSS & micro-interactions');
} else {
  console.warn('⚠️ player_dashboard.html old style not found');
}

// =========================================================================
// 2. PATCH PUBLIC/MEMBER_CHECKIN.HTML
// =========================================================================
const marshalPath = path.join(__dirname, '..', 'public', 'member_checkin.html');
let marshalHtml = fs.readFileSync(marshalPath, 'utf8');

const oldMarshalStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }`;

const newMarshalStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    button {
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
      transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease, opacity 0.15s ease;
    }
    button:active:not(:disabled) {
      transform: scale(0.96);
    }
    button > * {
      pointer-events: none;
    }
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

if (marshalHtml.includes(oldMarshalStyle)) {
  marshalHtml = marshalHtml.replace(oldMarshalStyle, newMarshalStyle);
}

// Add Smart Diffing to loadRecentCheckins in member_checkin.html
const oldRecentCheckins = `async function loadRecentCheckins() {
      try {
        var res = await fetch(apiUrl('/api/checkins?limit=10&_t=' + Date.now()));
        var data = await res.json();
        if (!data.success) return;

        var list = data.checkins || [];
        var totalEl = document.getElementById('telemetry-logged-count');
        if (totalEl) totalEl.innerText = (data.total !== undefined ? data.total : list.length) + ' Scans';

        var container = document.getElementById('recent-checkins-list');
        if (!container) return;

        if (list.length === 0) {
          container.innerHTML = '<div class="text-center py-6 text-on-surface-variant font-mono text-xs">No scan events recorded at this station yet.</div>';
          return;
        }`;

const newRecentCheckins = `var lastRecentCheckinsHash = '';
    async function loadRecentCheckins() {
      try {
        var res = await fetch(apiUrl('/api/checkins?limit=10&_t=' + Date.now()));
        var data = await res.json();
        if (!data.success) return;

        var list = data.checkins || [];
        var totalEl = document.getElementById('telemetry-logged-count');
        if (totalEl) totalEl.innerText = (data.total !== undefined ? data.total : list.length) + ' Scans';

        var container = document.getElementById('recent-checkins-list');
        if (!container) return;

        var currentHash = JSON.stringify(list.map(function(c){ return [c._id, c.teamName, c.points, c.createdAt]; }));
        if (currentHash === lastRecentCheckinsHash && container.children.length > 0) {
          return; // Skip re-render!
        }
        lastRecentCheckinsHash = currentHash;

        if (list.length === 0) {
          container.innerHTML = '<div class="text-center py-6 text-on-surface-variant font-mono text-xs">No scan events recorded at this station yet.</div>';
          return;
        }`;

if (marshalHtml.includes(oldRecentCheckins)) {
  marshalHtml = marshalHtml.replace(oldRecentCheckins, newRecentCheckins);
}

// Ensure btn-force-award has fallback onclick
marshalHtml = marshalHtml.replace(
  '<button id="btn-force-award" class="',
  '<button id="btn-force-award" onclick="dismissAlreadyVisited()" class="'
);

fs.writeFileSync(marshalPath, marshalHtml, 'utf8');
console.log('✅ Patched member_checkin.html CSS, smart diffing & button handlers');

// =========================================================================
// 3. PATCH PUBLIC/LEADERBOARD.HTML
// =========================================================================
const lbPath = path.join(__dirname, '..', 'public', 'leaderboard.html');
let lbHtml = fs.readFileSync(lbPath, 'utf8');

const oldLbStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }`;

const newLbStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    button {
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
      transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease, opacity 0.15s ease;
    }
    button:active:not(:disabled) {
      transform: scale(0.96);
    }
    button > * {
      pointer-events: none;
    }
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

if (lbHtml.includes(oldLbStyle)) {
  lbHtml = lbHtml.replace(oldLbStyle, newLbStyle);
}

// Add Smart Diffing to applyFilterAndRender in leaderboard.html
const oldLbRender = `function applyFilterAndRender() {
      var sorted = cachedTeams.slice();`;

const newLbRender = `var lastLeaderboardRenderHash = '';
    function applyFilterAndRender() {
      var sorted = cachedTeams.slice();`;

if (!lbHtml.includes('var lastLeaderboardRenderHash')) {
  lbHtml = lbHtml.replace(oldLbRender, newLbRender);
}

const oldLbCalls = `      renderPodium(sorted);
      renderContenders(sorted);
      renderUserStrip(sorted);
    }`;

const newLbCalls = `      // Smart Diffing: Prevent unconditional DOM replacement
      var currentHash = currentFilter + '_' + JSON.stringify(sorted.map(function(t){
        return [t._id, t.score, (t.visitedZones||[]).length, (t.cards||[]).length];
      }));
      var pContainer = document.getElementById('podium-slots-container');
      if (currentHash === lastLeaderboardRenderHash && pContainer && pContainer.children.length > 0) {
        return; // Skip re-render!
      }
      lastLeaderboardRenderHash = currentHash;

      renderPodium(sorted);
      renderContenders(sorted);
      renderUserStrip(sorted);
    }`;

if (lbHtml.includes(oldLbCalls)) {
  lbHtml = lbHtml.replace(oldLbCalls, newLbCalls);
}

// Fix Rank button without onclick in bottom nav
lbHtml = lbHtml.replace(
  '<button class="flex flex-col items-center justify-center gap-1 w-24 h-14 text-primary-container font-bold">',
  '<button onclick="window.scrollTo({top:0, behavior:\'smooth\'})" class="flex flex-col items-center justify-center gap-1 w-24 h-14 text-primary-container font-bold cursor-pointer">'
);
lbHtml = lbHtml.replace(
  '<button class="flex flex-col items-center justify-center gap-1 w-20 h-14 text-primary-container font-bold">',
  '<button onclick="window.scrollTo({top:0, behavior:\'smooth\'})" class="flex flex-col items-center justify-center gap-1 w-20 h-14 text-primary-container font-bold cursor-pointer">'
);

fs.writeFileSync(lbPath, lbHtml, 'utf8');
console.log('✅ Patched leaderboard.html CSS, smart diffing & bottom nav button');

// =========================================================================
// 4. PATCH PUBLIC/LOGIN.HTML
// =========================================================================
const loginPath = path.join(__dirname, '..', 'public', 'login.html');
let loginHtml = fs.readFileSync(loginPath, 'utf8');

const oldLoginStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }`;

const newLoginStyle = `<style>
    button, a, input, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    button {
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
      transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease, opacity 0.15s ease;
    }
    button:active:not(:disabled) {
      transform: scale(0.96);
    }
    button > * {
      pointer-events: none;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    @keyframes tacticalShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .skeleton-shimmer {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(0,240,255,0.12) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: tacticalShimmer 1.4s infinite linear;
      border-radius: 0.5rem;
    }`;

if (loginHtml.includes(oldLoginStyle)) {
  loginHtml = loginHtml.replace(oldLoginStyle, newLoginStyle);
}

// Add visual feedback to handleFormSubmit in login.html
const oldSubmitStart = `async function handleFormSubmit(e) {
      e.preventDefault();
      var alertBox = document.getElementById('alert-banner');
      if (alertBox) alertBox.classList.add('hidden');`;

const newSubmitStart = `async function handleFormSubmit(e) {
      e.preventDefault();
      var alertBox = document.getElementById('alert-banner');
      if (alertBox) alertBox.classList.add('hidden');

      var submitBtn = document.getElementById('btn-submit');
      var submitText = document.getElementById('btn-submit-text');
      var oldText = submitText ? submitText.innerText : 'SUBMIT';
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitText) submitText.innerText = 'AUTHENTICATING...';
      }`;

const oldSubmitEnd = `      } catch (err) {
        showAlert(err.message || 'Network error occurred. Please try again.');
      }
    }`;

const newSubmitEnd = `      } catch (err) {
        showAlert(err.message || 'Network error occurred. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitText) submitText.innerText = oldText;
        }
      }
    }`;

if (loginHtml.includes(oldSubmitStart)) {
  loginHtml = loginHtml.replace(oldSubmitStart, newSubmitStart);
}
if (loginHtml.includes(oldSubmitEnd)) {
  loginHtml = loginHtml.replace(oldSubmitEnd, newSubmitEnd);
}

fs.writeFileSync(loginPath, loginHtml, 'utf8');
console.log('✅ Patched login.html CSS & submit button loading feedback');
