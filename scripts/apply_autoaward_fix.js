const fs = require('fs');
let content = fs.readFileSync('public/member_checkin.html', 'utf8');

const anchor = 'if (!data.success) {';
const idx = content.indexOf(anchor);

if (idx !== -1) {
  const endAnchor = 'loadTeams();';
  const endIdx = content.indexOf(endAnchor, idx);
  if (endIdx !== -1) {
    const chunk = content.substring(idx, endIdx);
    console.log('Original chunk:\n', chunk);
    
    const newChunk = `if (!data.success) {
          if (data.wrongStation) {
            playCyberErrorBuzz();
            showWrongStationModal(data.error || 'Squad is assigned to a different checkpoint station!', data.targetZoneLabel || data.targetZoneId, data.teamName || squadName);
          } else if (data.alreadyVisited) {
            showAlreadyVisitedPrompt(data.error || ('Squad "' + squadName + '" already completed ' + zoneId + '!'), payload);
          } else {
            showCheckinAlert(data.error || 'Check-in failed.', true);
          }
          return;
        }

        // Triumphant victory audio fanfare
        playVictoryChirp();

        // High-impact celebration modal overlay
        showCheckinCelebration(data.teamName || squadName, data.pointsAwarded || totalPts, data.teamScore, zoneId, data.nextClueIndex, method, data.nextZoneLabel, data.nextClueText);

        // Instant telemetry reload
        `;
    
    content = content.substring(0, idx) + newChunk + content.substring(endIdx);
    fs.writeFileSync('public/member_checkin.html', content, 'utf8');
    console.log('Updated autoAwardCheckin successfully!');
  }
}
