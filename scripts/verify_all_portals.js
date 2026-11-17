const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pages = [
  {
    file: 'public/index.html',
    name: 'Landing Gateway',
    requiredIds: ['nav-tabs', 'screen-frame', 'current-screen-title', 'current-screen-role'],
    requiredTexts: ['Territory Grid', 'AUTH MATRIX // SIGN-IN', 'ADMIN COMMAND PANEL', 'FIELD MARSHAL CHECKPOINT']
  },
  {
    file: 'public/login.html',
    name: 'Login Portal',
    requiredIds: ['card-PLAYER', 'card-MEMBER', 'card-ADMIN', 'btn-mode-login', 'btn-mode-register', 'input-callsign', 'input-password', 'btn-submit', 'view-waiting-hall', 'alert-banner'],
    requiredTexts: ['Squad Authentication Terminal', 'ENTER SQUAD HUD', 'selectPortal', 'handleFormSubmit', 'setAuthMode']
  },
  {
    file: 'public/player_dashboard.html',
    name: 'Player Dashboard',
    requiredIds: [
      'player-waiting-hall', 'player-active-hunt-container', 'gaming-countdown-overlay',
      'active-station-name', 'active-clue-text', 'active-checkpoint-label', 'active-zone-badge',
      'card-qr-container', 'manual-cipher-code', 'cards-count-label', 'score-progress-bar',
      'header-callsign-badge', 'team-name-label', 'team-score-num', 'team-rank-label',
      'collected-deck-container', 'card-front-face', 'card-back-face'
    ],
    requiredTexts: ['resolveTeamTargetClue', 'rotateCardCipher', 'apiUrl', 'startPlayerLocalCountdown']
  },
  {
    file: 'public/member_checkin.html',
    name: 'Field Marshal Station',
    requiredIds: [
      'station-zone-id', 'station-zone-label', 'telemetry-logged-count', 'telemetry-assigned-count',
      'assigned-squads-chips', 'wrong-station-modal', 'celebration-overlay', 'team-selector',
      'manual-cipher-input', 'btn-toggle-camera'
    ],
    requiredTexts: ['showWrongStationModal', 'autoAwardCheckin', 'resolveTeamTargetClue']
  },
  {
    file: 'public/admin_panel.html',
    name: 'Admin Master Control',
    requiredIds: [
      'places-total-count', 'stat-teams-count', 'stat-registered-count', 'stat-total-points',
      'pending-items-list', 'approved-items-list', 'clock-display', 'places-list-container',
      'admin-action-modal', 'modal-confirm-input', 'modal-execute-btn', 'modal-title'
    ],
    requiredTexts: [
      'rebalanceAllSquadRoutes', 'loadApprovedRoster', 'loadPendingApprovals',
      'openAdminActionModal', 'executeAdminActionModal', 'startAdminLocalCountdown',
      'purge-all', 'reset-all-points'
    ]
  },
  {
    file: 'public/leaderboard.html',
    name: 'Championship Leaderboard',
    requiredIds: [
      'podium-slots-container', 'contenders-rows-container', 'hunt-timer-display',
      'current-user-strip', 'live-event-feed-text'
    ],
    requiredTexts: ['refreshLeaderboard', 'renderPodium', 'renderContenders']
  }
];

let allPassed = true;

pages.forEach(p => {
  console.log(`\n======================================================`);
  console.log(`Auditing: ${p.name} (${p.file})`);
  console.log(`======================================================`);
  
  const content = fs.readFileSync(p.file, 'utf8');

  // Check script syntax
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, sIdx = 0;
  while ((m = scriptRegex.exec(content)) !== null) {
    try {
      new vm.Script(m[1], { filename: p.file + '_script_' + sIdx });
    } catch(err) {
      console.error(`  ❌ Syntax Error in Script #${sIdx}:`, err.message);
      allPassed = false;
    }
    sIdx++;
  }
  console.log(`  ✅ All ${sIdx} inline scripts parsed with valid JavaScript syntax.`);

  // Check required IDs
  let missing = [];
  p.requiredIds.forEach(id => {
    if (!content.includes('id="' + id + '"') && !content.includes("id='" + id + "'")) {
      missing.push(id);
      allPassed = false;
    }
  });

  if (missing.length > 0) {
    console.error(`  ❌ Missing required DOM IDs:`, missing);
  } else {
    console.log(`  ✅ All ${p.requiredIds.length} required interactive DOM elements exist!`);
  }

  // Check required text/functions
  let missingTexts = [];
  p.requiredTexts.forEach(txt => {
    if (!content.includes(txt)) {
      missingTexts.push(txt);
      allPassed = false;
    }
  });

  if (missingTexts.length > 0) {
    console.error(`  ❌ Missing required functions or text hooks:`, missingTexts);
  } else {
    console.log(`  ✅ All ${p.requiredTexts.length} required functions and core text hooks present!`);
  }
});

console.log(`\n======================================================`);
if (allPassed) {
  console.log(`🎉 ALL 6 PORTALS & SCREENS AUDITED WITH 100% SUCCESS!`);
} else {
  console.error(`⚠️ Some elements or scripts failed validation.`);
  process.exit(1);
}
