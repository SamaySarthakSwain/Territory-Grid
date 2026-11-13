/**
 * Fix for:
 * 1. Automatic redirect to admin portal without showing login page
 * 2. Non-working buttons caused by JavaScript syntax errors in admin_panel.html & leaderboard.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUBLIC = path.join(__dirname, '..', 'public');

// ============================================================================
// 1. FIX public/admin_panel.html - SyntaxError: Unexpected token 'else'
// ============================================================================
let adminHtml = fs.readFileSync(path.join(PUBLIC, 'admin_panel.html'), 'utf8');

const badAdminBlock = `        if (serverGameState === 'COUNTDOWN') {
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
        } else if (serverGameState === 'PLAYER_PHASE') {`;

const fixedAdminBlock = `        // Clear countdown timer when not in COUNTDOWN status
        if (serverGameState !== 'COUNTDOWN' && adminCountdownTimer) {
          clearInterval(adminCountdownTimer);
          adminCountdownTimer = null;
        }

        if (serverGameState === 'COUNTDOWN') {
          var endsAt = data.countdownEndsAt || (gs && gs.countdownEndsAt);
          if (endsAt) {
            var endsMs = new Date(endsAt).getTime();
            if (!adminCountdownTimer || Math.abs(adminCountdownEndsAtMs - endsMs) > 1200) {
              startAdminLocalCountdown(endsAt);
            }
          } else if (!adminCountdownTimer) {
            startAdminLocalCountdown(new Date(Date.now() + (countdownSec || 10) * 1000).toISOString());
          }
        } else if (serverGameState === 'PLAYER_PHASE') {`;

if (adminHtml.includes(badAdminBlock)) {
  adminHtml = adminHtml.replace(badAdminBlock, fixedAdminBlock);
  console.log('✅ admin_panel.html: Fixed syntax error in syncAdminGameState()');
} else {
  // Regex replacement in case line breaks vary
  const regex = /if\s*\(serverGameState\s*===\s*'COUNTDOWN'\)\s*\{[\s\S]*?\}\s*else\s*\{\s*if\s*\(adminCountdownTimer\)\s*\{\s*clearInterval\(adminCountdownTimer\);\s*adminCountdownTimer\s*=\s*null;\s*\}\s*\}\s*else\s*if\s*\(serverGameState\s*===\s*'PLAYER_PHASE'\)/;
  if (regex.test(adminHtml)) {
    adminHtml = adminHtml.replace(regex, fixedAdminBlock);
    console.log('✅ admin_panel.html: Fixed syntax error via regex in syncAdminGameState()');
  } else {
    console.error('❌ admin_panel.html: Could not find bad countdown block');
  }
}

// Make sure signOut explicitly adds ?logout=true
const oldSignOut = `    function signOut() {
      localStorage.removeItem('territory_grid_user');
      sessionStorage.removeItem('territory_grid_user');
      window.location.href = 'login.html';
    }`;

const newSignOut = `    function signOut() {
      localStorage.removeItem('territory_grid_user');
      sessionStorage.removeItem('territory_grid_user');
      window.location.href = 'login.html?logout=true';
    }`;

if (adminHtml.includes(oldSignOut)) {
  adminHtml = adminHtml.replace(oldSignOut, newSignOut);
  console.log('✅ admin_panel.html: Updated signOut() to redirect with ?logout=true');
}

fs.writeFileSync(path.join(PUBLIC, 'admin_panel.html'), adminHtml, 'utf8');

// ============================================================================
// 2. FIX public/leaderboard.html - SyntaxError: Unexpected identifier 'smooth'
// ============================================================================
let lbHtml = fs.readFileSync(path.join(PUBLIC, 'leaderboard.html'), 'utf8');

// Replace the unescaped behavior:'smooth' quotes
lbHtml = lbHtml.replace(/onclick="window\.scrollTo\(\{top:0,\s*behavior:'smooth'\}\)"/g, 'onclick="scrollToTop()"');

// Make sure scrollToTop helper function exists
if (!lbHtml.includes('function scrollToTop()')) {
  lbHtml = lbHtml.replace('function renderBottomNav()', `function scrollToTop() {\n      window.scrollTo({ top: 0, behavior: 'smooth' });\n    }\n\n    function renderBottomNav()`);
  console.log('✅ leaderboard.html: Added scrollToTop() helper and fixed quotes');
}

fs.writeFileSync(path.join(PUBLIC, 'leaderboard.html'), lbHtml, 'utf8');

// ============================================================================
// 3. FIX public/login.html - Remove automatic redirect, show login page & active session banner
// ============================================================================
let loginHtml = fs.readFileSync(path.join(PUBLIC, 'login.html'), 'utf8');

// Insert Active Session Banner right before <!-- VIEW 1: PORTAL CHOOSER & LOGIN/REGISTRATION FORM -->
const view1Marker = '<!-- VIEW 1: PORTAL CHOOSER & LOGIN/REGISTRATION FORM -->';
const sessionBannerHtml = `<!-- ACTIVE SESSION NOTIFICATION BANNER (Shown when previous clearance exists) -->
    <div id="active-session-banner" class="hidden mb-4 p-3.5 rounded-xl border border-cyan/40 bg-cyan/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-cyber-fade">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-lg bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)]">
          <span class="material-symbols-outlined text-xl">verified_user</span>
        </div>
        <div>
          <div class="text-[10px] font-mono text-gray-400 uppercase tracking-wider">PREVIOUS CLEARANCE ACTIVE</div>
          <div class="text-xs font-headline font-bold text-white flex items-center gap-1.5">
            <span id="session-callsign-text">...</span>
            <span id="session-role-badge" class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan/20 text-cyan border border-cyan/30">PLAYER</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" onclick="resumeActiveSession()" class="px-3.5 py-1.5 rounded-lg bg-cyan text-black font-headline font-bold text-xs hover:bg-cyan/90 transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.4)]">
          <span>ENTER PORTAL</span>
          <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
        <button type="button" onclick="clearSessionAndResetForm()" class="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-headline font-bold text-xs transition cursor-pointer">
          <span>SIGN OUT</span>
        </button>
      </div>
    </div>

    <!-- VIEW 1: PORTAL CHOOSER & LOGIN/REGISTRATION FORM -->`;

if (!loginHtml.includes('id="active-session-banner"') && loginHtml.includes(view1Marker)) {
  loginHtml = loginHtml.replace(view1Marker, sessionBannerHtml);
  console.log('✅ login.html: Added active session banner HTML');
}

// Modify DOMContentLoaded to NOT auto-redirect, but show the banner and let user see login page!
const oldLoginAuthCheck = `      // Check if user is already authenticated
      var session = getStoredSession();
      if (session && session.isApproved) {
        redirectToDashboard(session.role);
        return;
      } else if (session && !session.isApproved) {
        showWaitingHall(session.callsign, session.role, session._id || session.id);
        // Fast instant check on startup in case approval happened while page was closed
        checkApprovalStatus(session._id || session.id, session.role, false);
        return;
      }`;

const newLoginAuthCheck = `      // Check if user has an existing session
      var session = getStoredSession();
      if (session && session.isApproved) {
        // DO NOT automatically redirect away without showing the login page!
        // Display the active session banner so user can enter with 1-click OR sign in as someone else
        var banner = document.getElementById('active-session-banner');
        var callsignText = document.getElementById('session-callsign-text');
        var roleBadge = document.getElementById('session-role-badge');
        if (banner && callsignText && roleBadge) {
          callsignText.innerText = session.callsign || session.username || 'User';
          roleBadge.innerText = session.role || 'PLAYER';
          banner.classList.remove('hidden');
        }
        if (session.role) {
          selectPortal(session.role);
        }
      } else if (session && !session.isApproved) {
        showWaitingHall(session.callsign, session.role, session._id || session.id);
        checkApprovalStatus(session._id || session.id, session.role, false);
        return;
      }`;

if (loginHtml.includes(oldLoginAuthCheck)) {
  loginHtml = loginHtml.replace(oldLoginAuthCheck, newLoginAuthCheck);
  console.log('✅ login.html: Replaced automatic forced redirect with user-controlled session banner');
} else {
  console.warn('⚠️ login.html: Could not find exact oldLoginAuthCheck block, checking regex');
}

// Add resumeActiveSession and clearSessionAndResetForm helper functions to login.html
const oldRedirectToDashboard = `    // Strict Role Router
    function redirectToDashboard(role) {`;

const newSessionHelpers = `    function resumeActiveSession() {
      var session = getStoredSession();
      if (session && session.role) {
        redirectToDashboard(session.role);
      }
    }

    function clearSessionAndResetForm() {
      clearSession();
      var banner = document.getElementById('active-session-banner');
      if (banner) banner.classList.add('hidden');
      selectPortal('PLAYER');
    }

    // Strict Role Router
    function redirectToDashboard(role) {`;

if (loginHtml.includes(oldRedirectToDashboard) && !loginHtml.includes('function resumeActiveSession()')) {
  loginHtml = loginHtml.replace(oldRedirectToDashboard, newSessionHelpers);
  console.log('✅ login.html: Added resumeActiveSession() and clearSessionAndResetForm() functions');
}

fs.writeFileSync(path.join(PUBLIC, 'login.html'), loginHtml, 'utf8');

// ============================================================================
// 4. VERIFY ALL JS SYNTAX IN ALL 5 PORTAL FILES
// ============================================================================
console.log('\n--- Verifying JavaScript Syntax Across All Pages ---');
const portalFiles = ['admin_panel.html', 'member_checkin.html', 'player_dashboard.html', 'leaderboard.html', 'login.html', 'index.html'];
let allPassed = true;

portalFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let i = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    i++;
    if (match[0].includes('src=')) continue;
    const code = match[1];
    try {
      new vm.Script(code, { filename: `${file}_script_${i}` });
      console.log(`  ✅ ${file} script #${i}: OK`);
    } catch (err) {
      console.error(`  ❌ ${file} script #${i} FAILED: ${err.message}`);
      allPassed = false;
    }
  }
});

if (allPassed) {
  console.log('\n🎉 ALL PORTAL SCRIPTS PASSED COMPILATION WITH 0 SYNTAX ERRORS!');
} else {
  console.error('\n⚠️ SOME SCRIPTS HAVE SYNTAX ERRORS!');
  process.exit(1);
}
