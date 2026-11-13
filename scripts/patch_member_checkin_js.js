const fs = require('fs');

let html = fs.readFileSync('public/member_checkin.html', 'utf8');

// Helper functions to inject
const helpersToInject = `
    // ─────────────────────────────────────────────────────────
    // STRICT STATION & BALANCED ROUTING UTILITIES
    // ─────────────────────────────────────────────────────────
    var allStationClues = [];

    function normalizeZone(z) {
      if (!z) return '';
      var s = String(z).toUpperCase().trim();
      s = s.replace(/[^A-Z0-9]/g, '');
      s = s.replace(/^ZONE0+(\\d+)/, 'ZONE$1');
      return s;
    }

    function deriveTeamCode(strOrTeam, teamsList) {
      var str = '';
      var teamObj = null;
      if (strOrTeam && typeof strOrTeam === 'object') {
        teamObj = strOrTeam;
        str = strOrTeam.callsign || strOrTeam.name || strOrTeam._id || 'SQUAD';
      } else if (typeof strOrTeam === 'string') {
        str = strOrTeam;
      } else {
        str = 'SQUAD';
      }
      str = String(str).trim();

      if (teamObj && teamObj.teamCode && teamObj.teamCode >= 10 && teamObj.teamCode <= 99) {
        return teamObj.teamCode;
      }

      var numMatch = str.match(/\\d+/);
      if (numMatch && numMatch[0]) {
        var n = parseInt(numMatch[0], 10);
        if (n >= 1 && n <= 89) return 10 + n;
        if (n >= 10 && n <= 99) return n;
      }

      if (Array.isArray(teamsList) && teamsList.length > 0) {
        var strUpper = str.toUpperCase();
        var idx = teamsList.findIndex(function(t) {
          return (t.callsign && t.callsign.toUpperCase() === strUpper) ||
                 (t.name && t.name.toUpperCase() === strUpper) ||
                 (t._id && t._id === str);
        });
        if (idx !== -1) {
          return 10 + (idx % 89);
        }
      }

      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 88;
      }
      return 11 + Math.abs(hash);
    }

    function resolveTeamRoute(team, clues, teamsList) {
      if (!clues || clues.length === 0) return [];
      var K = clues.length;
      var code = (team && typeof team.teamCode === 'number' && team.teamCode >= 11)
        ? team.teamCode
        : deriveTeamCode(team, teamsList);
      var offset = code % K;
      var route = [];
      for (var i = 0; i < K; i++) {
        route.push(clues[(offset + i) % K]);
      }
      return route;
    }

    function resolveTeamTargetClue(team, clues, teamsList) {
      if (!clues || clues.length === 0) return null;
      var route = resolveTeamRoute(team, clues, teamsList);
      var currentIdx = (team && typeof team.currentClueIndex === 'number') ? team.currentClueIndex : 0;
      if (currentIdx >= route.length) return null;
      return route[currentIdx];
    }

    function playCyberErrorBuzz() {
      try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } catch(e){}
    }

    function showWrongStationModal(errorMsg, targetStation, squadName) {
      var modal = document.getElementById('wrong-station-modal');
      if (!modal) {
        alert(errorMsg);
        return;
      }
      document.getElementById('wrong-station-squad-name').innerText = squadName || 'Squad';
      document.getElementById('wrong-station-error-msg').innerText = errorMsg;
      document.getElementById('wrong-station-target').innerText = targetStation || 'Assigned Zone';
      modal.classList.remove('hidden');
    }

    function dismissWrongStationModal() {
      var modal = document.getElementById('wrong-station-modal');
      if (modal) modal.classList.add('hidden');
      var manualInput = document.getElementById('manual-cipher-input');
      if (manualInput) manualInput.value = '';
      startCameraScanner();
    }
`;

if (!html.includes('function normalizeZone')) {
  html = html.replace('var checkinState = {', helpersToInject + '\n    var checkinState = {');
  console.log('Helpers injected!');
}

// Update loadTeams() to also fetch clues and render assigned squads
const newLoadTeams = `async function loadTeams() {
      try {
        var cluesRes = await fetch(apiUrl('/api/clues?all=true&_t=' + Date.now()));
        var cluesData = await cluesRes.json();
        if (cluesData.success && Array.isArray(cluesData.clues)) {
          allStationClues = cluesData.clues;
        }

        var res = await fetch(apiUrl('/api/teams?_t=' + Date.now()));
        var data = await res.json();
        if (data.success) {
          currentTeams = (data.teams || []).filter(function(t) { return t.isApproved; });
          var selector = document.getElementById('team-selector');
          var selectedVal = selector ? selector.value : '';

          var myZoneNorm = normalizeZone(currentUser.zoneId || 'ZONE_01');

          // Match station landmark label
          var matchedClue = allStationClues.find(function(c) {
            return normalizeZone(c.zoneId) === myZoneNorm;
          });
          if (matchedClue && matchedClue.zoneLabel) {
            var zl = document.getElementById('station-zone-label');
            if (zl) zl.innerText = matchedClue.zoneLabel + ' (' + (matchedClue.zoneId || currentUser.zoneId) + ')';
          }

          // Filter squads currently assigned to this marshal's station!
          var assignedSquads = currentTeams.filter(function(t) {
            var target = resolveTeamTargetClue(t, allStationClues, currentTeams);
            return target && normalizeZone(target.zoneId) === myZoneNorm;
          });

          var assignedCountEl = document.getElementById('telemetry-assigned-count');
          if (assignedCountEl) assignedCountEl.innerText = assignedSquads.length + ' Squads';
          var summaryEl = document.getElementById('assigned-squads-summary');
          if (summaryEl) summaryEl.innerText = assignedSquads.length + ' En Route';

          var chipsContainer = document.getElementById('assigned-squads-chips');
          if (chipsContainer) {
            if (assignedSquads.length === 0) {
              chipsContainer.innerHTML = '<span class="text-[11px] font-mono text-gray-400 italic">No squads currently routed to this station.</span>';
            } else {
              chipsContainer.innerHTML = assignedSquads.map(function(s) {
                var cNum = (s.currentClueIndex || 0) + 1;
                return '<span class="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm">' +
                  '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>' +
                  (s.name || s.callsign) + ' (#' + cNum + ')' +
                  '</span>';
              }).join('');
            }
          }

          if (selector) {
            if (currentTeams.length === 0) {
              selector.innerHTML = '<option value="">-- No approved squads available yet --</option>';
              return;
            }

            var optionsHtml = currentTeams.map(function(t, idx) {
              var isTargetMe = assignedSquads.some(function(as) { return as._id === t._id; });
              var prefix = isTargetMe ? '🎯 [ASSIGNED HERE] ' : '';
              return '<option value="' + t._id + '">' + prefix + (t.name || t.callsign) + ' (Score: ' + (t.score || 0) + ' pts)</option>';
            }).join('');

            selector.innerHTML = optionsHtml;
            if (selectedVal) selector.value = selectedVal;
          }

          updateSummary();
        }
      } catch (e) {
        console.warn('Load teams error:', e);
      }
    }`;

// Replace loadTeams function
const oldLoadTeamsRegex = /async function loadTeams\(\) \{[\s\S]*?updateSummary\(\);\s*\}\s*\} catch \(e\) \{[\s\S]*?\}\s*\}/;
if (oldLoadTeamsRegex.test(html)) {
  html = html.replace(oldLoadTeamsRegex, newLoadTeams);
  console.log('loadTeams() function replaced successfully!');
} else {
  console.warn('Could not match old loadTeams regex');
}

// Update autoAwardCheckin error handling & celebration call
const oldAutoAwardCheck = `        if (!data.success) {
          if (data.alreadyVisited) {
            showAlreadyVisitedPrompt(data.error || ('Squad "' + squadName + '" already completed ' + zoneId + '!'), payload);
          } else {
            showCheckinAlert(data.error || 'Check-in failed.', true);
          }
          return;
        }

        // Triumphant victory audio fanfare
        playVictoryChirp();

        // High-impact celebration modal overlay
        showCheckinCelebration(data.teamName || squadName, data.pointsAwarded || totalPts, data.teamScore, zoneId, data.nextClueIndex, method);`;

const newAutoAwardCheck = `        if (!data.success) {
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
        showCheckinCelebration(data.teamName || squadName, data.pointsAwarded || totalPts, data.teamScore, zoneId, data.nextClueIndex, method, data.nextZoneLabel, data.nextClueText);`;

if (html.includes(oldAutoAwardCheck)) {
  html = html.replace(oldAutoAwardCheck, newAutoAwardCheck);
  console.log('autoAwardCheckin() error handling and celebration call updated!');
} else {
  console.warn('Could not find oldAutoAwardCheck exact string');
}

// Update showCheckinCelebration signature and content
const oldShowCelebRegex = /function showCheckinCelebration\(teamName, points, totalScore, zoneId, nextClueIndex, method\) \{[\s\S]*?document\.getElementById\('celeb-next-clue-label'\)\.innerText = 'Next Clue #' \+ nextClueNum \+ ' is now live on squad phones!';/;

const newShowCelebCode = `function showCheckinCelebration(teamName, points, totalScore, zoneId, nextClueIndex, method, nextZoneLabel, nextClueText) {
      var overlay = document.getElementById('celebration-overlay');
      if (!overlay) return;

      document.getElementById('celeb-team-name').innerText = teamName;
      document.getElementById('celeb-station-zone').innerText = 'Station Cleared: ' + zoneId + ' (' + (method || 'Verified') + ')';
      document.getElementById('celeb-points-awarded').innerText = '+' + points + ' PTS';
      document.getElementById('celeb-total-score').innerText = (totalScore !== undefined ? totalScore : 'Updated') + ' PTS';
      
      var nextClueNum = (nextClueIndex !== undefined) ? (nextClueIndex + 1) : 2;
      var locTitle = document.getElementById('celeb-next-location-title');
      if (locTitle) locTitle.innerText = 'NEXT LOCATION: ' + (nextZoneLabel || ('Checkpoint #' + nextClueNum));
      var clueLbl = document.getElementById('celeb-next-clue-label');
      if (clueLbl) clueLbl.innerText = nextClueText ? ('“' + nextClueText + '”') : ('Directive #' + nextClueNum + ' transmitted to squad phone.');`;

if (oldShowCelebRegex.test(html)) {
  html = html.replace(oldShowCelebRegex, newShowCelebCode);
  console.log('showCheckinCelebration updated!');
} else {
  console.warn('Could not match oldShowCelebRegex');
}

fs.writeFileSync('public/member_checkin.html', html, 'utf8');
console.log('All patches to public/member_checkin.html completed!');
