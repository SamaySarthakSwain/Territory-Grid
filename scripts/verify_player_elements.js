const fs = require('fs');

const html = fs.readFileSync('public/player_dashboard.html', 'utf8');
const ids = [
  'player-waiting-hall',
  'player-active-hunt-container',
  'gaming-countdown-overlay',
  'countdown-big-num',
  'countdown-progress-bar',
  'countdown-charge-pct',
  'countdown-action-hint',
  'hunt-timer-display',
  'hunt-timer-badge',
  'header-callsign-badge',
  'waiting-squad-callsign',
  'waiting-hunt-clock',
  'team-name-label',
  'team-zone-label',
  'team-rank-label',
  'team-score-num',
  'score-ring-circle',
  'score-progress-bar',
  'cards-count-label',
  'last-points-badge',
  'active-clue-directive-card',
  'active-checkpoint-label',
  'active-zone-badge',
  'active-clue-text',
  'active-station-name',
  'active-station-status',
  'card-front-face',
  'card-back-face',
  'card-ambient-glow',
  'card-qr-container',
  'manual-cipher-code',
  'card-rank-top',
  'card-rank-bot',
  'card-suit-top',
  'card-suit-bot',
  'collected-deck-container',
  'deck-count-indicator',
  'player-scanner-modal',
  'player-qr-reader',
  'player-scanner-alert',
  'checkpoint-cleared-modal',
  'cleared-points-label',
  'cleared-total-score',
  'cleared-next-station',
  'cleared-next-clue'
];

let allFound = true;
ids.forEach(id => {
  const found = html.includes('id="' + id + '"');
  if (!found) {
    console.error('MISSING ID in player_dashboard.html:', id);
    allFound = false;
  }
});

if (allFound) {
  console.log('✅ ALL ' + ids.length + ' CORE GAMEPLAY & HUD ELEMENTS EXIST IN PLAYER_DASHBOARD.HTML!');
}
