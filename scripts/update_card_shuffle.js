const fs = require('fs');
const path = require('path');

function updatePlayerDashboard(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Clean UTF-8 card suits
  content = content.replace(
    /var CARD_SUITS = \[\s*\{ symbol: '[^']+', name: 'Spades', isRed: false \},\s*\{ symbol: '[^']+', name: 'Hearts', isRed: true \},\s*\{ symbol: '[^']+', name: 'Diamonds', isRed: true \},\s*\{ symbol: '[^']+', name: 'Clubs', isRed: false \}\s*\];/g,
    `var CARD_SUITS = [
      { symbol: '♠', name: 'Spades', isRed: false },
      { symbol: '♥', name: 'Hearts', isRed: true },
      { symbol: '♦', name: 'Diamonds', isRed: true },
      { symbol: '♣', name: 'Clubs', isRed: false }
    ];`
  );

  // 2. Replace getCheckpointCard and add 30-second shuffle engine
  const oldGetCardStart = content.indexOf('// Deterministic Checkpoint Card Engine');
  const oldGetCardEnd = content.indexOf('function toggleCardFlip(');

  if (oldGetCardStart !== -1 && oldGetCardEnd !== -1) {
    const newEngineBlock = `// Deterministic Checkpoint Card Engine (Rotates dynamic cipher card every 30 seconds)
    var cardShuffleStep = Math.floor(Date.now() / 30000);
    var lastRotatedSlot = cardShuffleStep;

    function getCheckpointCard(team, clueIdx, teamsList, shuffleStep) {
      var tt = deriveTeamCode(team, teamsList);
      var cIdx = parseInt(clueIdx, 10) || 0;
      var step = (shuffleStep !== undefined) ? shuffleStep : cardShuffleStep;

      // Rotates across all 13 card ranks (1..13) and 4 suits every 30 seconds
      var rankIdx = Math.abs((tt * 3 + cIdx * 7 + step * 5)) % 13;
      var suitIdx = Math.abs((tt * 5 + cIdx * 3 + step)) % 4;
      var rankObj = CARD_RANKS[rankIdx];
      var suitObj = CARD_SUITS[suitIdx];
      var rr = 20 + rankObj.value; // 21 to 33
      var hh = 10 + ((cIdx * 4 + suitIdx + (step % 10)) % 52); // 10 to 61
      var code = '' + tt + rr + String(hh).padStart(2, '0');
      return {
        rank: rankObj.value,
        code: rankObj.code,
        suit: suitObj.symbol,
        isRed: suitObj.isRed,
        sixDigitCode: code,
        token: '' + hh,
        clueIdx: cIdx,
        step: step
      };
    }

    `;

    content = content.slice(0, oldGetCardStart) + newEngineBlock + content.slice(oldGetCardEnd);
    console.log('Replaced getCheckpointCard in ' + filePath);
  } else {
    console.warn('Could not find getCheckpointCard markers in ' + filePath);
  }

  // 3. Update rotateCardCipher & checkAndRotateCard
  const oldRotateStart = content.indexOf('function rotateCardCipher(animate) {');
  const oldRotateEnd = content.indexOf('function applyCardVisuals(card) {');

  if (oldRotateStart !== -1 && oldRotateEnd !== -1) {
    const newRotateBlock = `function rotateCardCipher(animate) {
      var cIdx = (currentMyTeam && currentMyTeam.currentClueIndex !== undefined) ? currentMyTeam.currentClueIndex : (currentUser && currentUser.currentClueIndex !== undefined ? currentUser.currentClueIndex : 0);
      activeCipherCard = getCheckpointCard(currentMyTeam || currentUser, cIdx, cachedTeamsList, cardShuffleStep);

      var flipper = document.getElementById('card-flipper');
      if (animate && flipper) {
        flipper.style.transition = 'filter 0.3s ease, transform 0.3s ease';
        flipper.style.filter = 'brightness(1.45) drop-shadow(0 0 22px rgba(0,229,255,0.85))';
        setTimeout(function() {
          applyCardVisuals(activeCipherCard);
          flipper.style.filter = 'none';
        }, 260);
      } else {
        applyCardVisuals(activeCipherCard);
      }
    }

    function checkAndRotateCard(animate) {
      var currentSlot = Math.floor(Date.now() / 30000);
      if (currentSlot !== lastRotatedSlot) {
        lastRotatedSlot = currentSlot;
        cardShuffleStep = currentSlot;
        rotateCardCipher(animate);
      }
    }

    `;

    content = content.slice(0, oldRotateStart) + newRotateBlock + content.slice(oldRotateEnd);
    console.log('Replaced rotateCardCipher in ' + filePath);
  }

  // 4. Update checkCard calculation in applyCardVisuals
  content = content.replace(
    'var checkCard = card.sixDigitCode ? card : getCheckpointCard(currentMyTeam || currentUser, cIdx, cachedTeamsList);',
    'var checkCard = (card && card.sixDigitCode) ? card : getCheckpointCard(currentMyTeam || currentUser, cIdx, cachedTeamsList, cardShuffleStep);'
  );

  // 5. Update DOMContentLoaded with automatic 30s shuffle interval
  content = content.replace(
    `      // Initialize deterministic checkpoint card cipher
      rotateCardCipher(false);

      loadCluesAndSync();`,
    `      // Initialize deterministic checkpoint card cipher
      checkAndRotateCard(false);

      // AUTOMATIC 30-SECOND DYNAMIC CARD SHUFFLE ENGINE
      // Smoothly shuffles holographic cards and updates cipher code every 30 seconds
      setInterval(function() {
        checkAndRotateCard(true);
      }, 1000);

      loadCluesAndSync();`
  );

  // 6. Fix any residual mojibake symbols
  content = content.split('â™ ').join('♠');
  content = content.split('â™¥').join('♥');
  content = content.split('â™¦').join('♦');
  content = content.split('â™£').join('♣');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated: ' + filePath);
}

const baseDir = path.resolve(__dirname, '..');
updatePlayerDashboard(path.join(baseDir, 'public', 'player_dashboard.html'));
updatePlayerDashboard(path.join(baseDir, 'design_refs', 'html', 'player_dashboard.html'));
