const fs = require('fs');
const path = require('path');

console.log('=== APPLYING HOLISTIC CODE REFINEMENTS ===');

// 1. PATCH member_checkin.html
let mc = fs.readFileSync('public/member_checkin.html', 'utf8');

// 1a. Add celeb-next-location-title
const oldCelebClue = '<span id="celeb-next-clue-label">Next Mission Hint Unlocked for Squad!</span>';
const newCelebClue = '<div class="text-cyan font-bold flex items-center justify-center gap-1 mb-0.5"><span class="material-symbols-outlined text-sm">navigation</span><span id="celeb-next-location-title">NEXT LOCATION: Next Station</span></div>\n          <span id="celeb-next-clue-label" class="text-gray-300 text-[10px]">Next Mission Hint Unlocked for Squad!</span>';

if (mc.includes(oldCelebClue)) {
  mc = mc.replace(oldCelebClue, newCelebClue);
  console.log('[+] member_checkin.html: celeb-next-location-title added.');
}

// 1b. Add telemetry clock and status spans if missing
if (!mc.includes('id="telemetry-hunt-clock"')) {
  mc = mc.replace('<main class="flex flex-col', '<div class="hidden"><span id="telemetry-hunt-clock">52:00</span><span id="telemetry-game-status">LOBBY</span></div>\n  <main class="flex flex-col');
  console.log('[+] member_checkin.html: telemetry-hunt-clock and telemetry-game-status added.');
}

// 1c. Enhance verifyManualCipherCode to check deriveTeamCode
const oldMatchTeam = 'if (t.teamCode === tt) return true;';
const newMatchTeam = 'if (t.teamCode === tt) return true;\n            if (typeof deriveTeamCode === \'function\' && deriveTeamCode(t, currentTeams) === tt) return true;';
if (mc.includes(oldMatchTeam) && !mc.includes('deriveTeamCode(t, currentTeams) === tt')) {
  mc = mc.replace(oldMatchTeam, newMatchTeam);
  console.log('[+] member_checkin.html: deriveTeamCode check added to verifyManualCipherCode.');
}

fs.writeFileSync('public/member_checkin.html', mc, 'utf8');

// 2. PATCH player_dashboard.html
let pd = fs.readFileSync('public/player_dashboard.html', 'utf8');

// 2a. Fix current-score to team-score-num
if (pd.includes("document.getElementById('current-score')")) {
  pd = pd.replace("document.getElementById('current-score')", "document.getElementById('team-score-num') || document.getElementById('current-score')");
  console.log('[+] player_dashboard.html: score element reference healed to team-score-num.');
}

// 2b. Add reactor-pulse-dot
if (!pd.includes('id="reactor-pulse-dot"')) {
  pd = pd.replace('<div id="reactor-outer-ring"', '<span id="reactor-pulse-dot" class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan animate-ping pointer-events-none"></span>\n                    <div id="reactor-outer-ring"');
  console.log('[+] player_dashboard.html: reactor-pulse-dot added.');
}

// 2c. Add player-card-section id
if (!pd.includes('id="player-card-section"')) {
  pd = pd.replace('class="card-3d-wrap', 'id="player-card-section" class="card-3d-wrap');
  console.log('[+] player_dashboard.html: id="player-card-section" added to 3D card wrap.');
}

fs.writeFileSync('public/player_dashboard.html', pd, 'utf8');

// 3. PATCH index.html with seamless mobile redirect
let idx = fs.readFileSync('public/index.html', 'utf8');
if (!idx.includes('Seamless Mobile Direct Access')) {
  const mobileScript = `  <script>
    // Seamless Mobile Direct Access: On mobile phone screens, jump straight to native mobile portal
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && !window.location.search.includes('preview=true')) {
      window.location.replace('login.html');
    }
  </script>\n</head>`;
  idx = idx.replace('</head>', mobileScript);
  fs.writeFileSync('public/index.html', idx, 'utf8');
  console.log('[+] index.html: mobile direct gateway redirect added.');
}

console.log('=== ALL REFINEMENTS APPLIED CLEANLY ===');
