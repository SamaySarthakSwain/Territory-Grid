const fs = require('fs');
const path = require('path');

function updateMemberCheckin(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const fnIdx = content.indexOf('function verifyManualCipherCode()');
  if (fnIdx === -1) {
    console.error('function verifyManualCipherCode() not found in ' + filePath);
    return;
  }

  const matchStart = content.indexOf('// Match squad by team code TT', fnIdx);
  const matchEnd = content.indexOf('checkinState.cardRank = rankCode;', fnIdx);

  if (matchStart === -1 || matchEnd === -1) {
    console.error('Markers inside verifyManualCipherCode not found in ' + filePath);
    return;
  }

  const oldBlock = content.substring(matchStart, matchEnd);

  const newBlock = `// Match squad strictly by team code TT (100% collision-free)
        if (Array.isArray(currentTeams) && currentTeams.length > 0) {
          var matchedTeam = currentTeams.find(function(t) {
            if (t.teamCode === tt) return true;
            var numMatch = (t.name || t.callsign || '').match(/\\d+/);
            if (numMatch && numMatch[0]) {
              var n = parseInt(numMatch[0], 10);
              var code = (n >= 1 && n <= 89) ? (10 + n) : (n >= 10 && n <= 99 ? n : 0);
              if (code === tt) return true;
            }
            return false;
          });
          if (matchedTeam) {
            targetTeamId = matchedTeam._id;
            squadFound = matchedTeam.name || matchedTeam.callsign;
            if (selector) selector.value = matchedTeam._id;
          }
        }
      } else {
        // Fallback for alphanumeric codes
        var tokens = rawCode.toUpperCase().split(/[-_\\s|]+/);
        var cleanTokens = tokens.filter(function(t) { return t && t !== 'TG'; });
        var legacyRanks = {
          'A': 1, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
          '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
          'J': 11, '11': 11, 'Q': 12, '12': 12, 'K': 13, '13': 13
        };
        cleanTokens.forEach(function(token) {
          if (selector) {
            for (var i = 0; i < selector.options.length; i++) {
              if (selector.options[i].text.toUpperCase().includes(token)) {
                selector.selectedIndex = i;
                targetTeamId = selector.options[i].value;
                squadFound = selector.options[i].text;
              }
            }
          }
          if (legacyRanks[token] !== undefined) {
            rankCode = token;
            rankNum = legacyRanks[token];
          }
        });
      }

      if (!targetTeamId) {
        showNotification('Squad code (' + (cleanDigits.length >= 2 ? cleanDigits.slice(0, 2) : rawCode) + ') does not match any registered squad.', true);
        return;
      }

      `;

  content = content.slice(0, matchStart) + newBlock + content.slice(matchEnd);

  // Update autoAwardCheckin call in verifyManualCipherCode
  content = content.replace(
    "autoAwardCheckin(targetTeamId, rankNum, suitSymbol, '6-Digit Code');",
    "autoAwardCheckin(targetTeamId, rankNum, suitSymbol, '6-Digit Code', false, cleanDigits);"
  );

  // Update autoAwardCheckin definition
  content = content.replace(
    "async function autoAwardCheckin(teamId, rankNum, suitSymbol, method, allowDuplicate) {",
    "async function autoAwardCheckin(teamId, rankNum, suitSymbol, method, allowDuplicate, rawCipherCode) {"
  );

  // Update payload in autoAwardCheckin
  content = content.replace(
    "allowDuplicate: !!allowDuplicate\n      };",
    "code: rawCipherCode || undefined,\n        allowDuplicate: !!allowDuplicate\n      };"
  );
  content = content.replace(
    "allowDuplicate: !!allowDuplicate\r\n      };",
    "code: rawCipherCode || undefined,\r\n        allowDuplicate: !!allowDuplicate\r\n      };"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated: ' + filePath);
}

const baseDir = path.resolve(__dirname, '..');
updateMemberCheckin(path.join(baseDir, 'public', 'member_checkin.html'));
updateMemberCheckin(path.join(baseDir, 'design_refs', 'html', 'member_checkin.html'));
