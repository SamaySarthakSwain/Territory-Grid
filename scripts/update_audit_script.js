const fs = require('fs');
const path = require('path');

const auditPath = path.join(__dirname, '..', 'scripts', 'system_health_audit.js');
let content = fs.readFileSync(auditPath, 'utf8');

// 1. In Module 5, after 5d, add 5e, 5f, 5g
const target5d = `      // 5d. Duplicate Check-in Prevention
      const dupCheckin = await request('/api/checkin', { method: 'POST' }, {
        teamId: testTeamId,
        zoneId: correctStation,
        cone: 'RED',
        cardRank: 8,
        cardSuit: '♦',
        memberId: 'audit_marshal_correct'
      });
      report('Duplicate station scan prevented (HTTP 400)', dupCheckin.status === 400 && (dupCheckin.json.alreadyVisited === true || dupCheckin.json.wrongStation === true));
    }`;

const new5e5f5g = `      // 5d. Duplicate Check-in Prevention
      const dupCheckin = await request('/api/checkin', { method: 'POST' }, {
        teamId: testTeamId,
        zoneId: correctStation,
        cone: 'RED',
        cardRank: 8,
        cardSuit: '♦',
        memberId: 'audit_marshal_correct'
      });
      report('Duplicate station scan prevented (HTTP 400)', dupCheckin.status === 400 && (dupCheckin.json.alreadyVisited === true || dupCheckin.json.wrongStation === true));

      // 5e. High-Security Reset All Points Engine
      const resetPointsRes = await request('/api/admin/teams/reset-all-points', { method: 'POST' });
      report('POST /api/admin/teams/reset-all-points succeeds (HTTP 200)', resetPointsRes.status === 200 && resetPointsRes.json.success === true);
      const teamAfterReset = (await request('/api/teams?_t=' + Date.now())).json.teams.find(t => t._id === testTeamId);
      report('Squad score reset to 0', teamAfterReset && teamAfterReset.score === 0);
      report('Squad cards inventory cleared to 0', teamAfterReset && teamAfterReset.cards.length === 0);
      report('Squad visited zones cleared to 0', teamAfterReset && teamAfterReset.visitedZones.length === 0);
      report('Squad clue index reset to 0', teamAfterReset && teamAfterReset.currentClueIndex === 0);

      // 5f. Match Start & Synchronized Countdown Telemetry
      const startCountdownRes = await request('/api/game/state', { method: 'POST' }, {
        status: 'COUNTDOWN',
        countdownSeconds: 10,
        durationMinutes: 52
      });
      report('POST /api/game/state initiates 10s countdown (HTTP 200)', startCountdownRes.status === 200);
      const gameStateRes = await request('/api/game/state?_t=' + Date.now());
      report('GET /api/game/state returns COUNTDOWN status', gameStateRes.json && gameStateRes.json.state && gameStateRes.json.state.status === 'COUNTDOWN');
      report('GET /api/game/state returns countdownEndsAt timestamp', !!(gameStateRes.json && gameStateRes.json.countdownEndsAt));
      report('GET /api/game/state returns durationMinutes 52', gameStateRes.json && gameStateRes.json.durationMinutes === 52);
      // Reset back to LOBBY
      await request('/api/game/state', { method: 'POST' }, { status: 'RESET' });

      // 5g. Permanent Two-Click Purge All Squads Engine
      const purgeTeamsRes = await request('/api/admin/teams/purge-all', { method: 'POST' });
      report('POST /api/admin/teams/purge-all executes (HTTP 200)', purgeTeamsRes.status === 200 && purgeTeamsRes.json.success === true);
      const teamsAfterPurge = (await request('/api/teams?_t=' + Date.now())).json.teams;
      report('All squads purged from live grid (0 remaining squads)', Array.isArray(teamsAfterPurge) && teamsAfterPurge.length === 0);
      const adminLoginAfterPurge = await request('/api/auth/login', { method: 'POST' }, { callsign: 'samay', password: 'samay' });
      report('Game Master Admin account preserved after purge', adminLoginAfterPurge.status === 200 && adminLoginAfterPurge.json && adminLoginAfterPurge.json.role === 'ADMIN');
    }`;

if (content.includes(target5d)) {
  content = content.replace(target5d, new5e5f5g);
} else {
  console.warn('target5d not found');
}

// 2. In Module 6, add requirements for new modal, countdown, and purge buttons
const oldAdminPage = `{
      file: 'public/admin_panel.html',
      name: 'Admin Master Control',
      requiredIds: [
        'places-total-count', 'stat-teams-count', 'stat-registered-count', 'stat-total-points',
        'pending-items-list', 'approved-items-list', 'clock-display', 'places-list-container'
      ],
      requiredTexts: ['Admin Operations Console', 'start52MinCountdown', 'syncAdminGameState', 'approveTeam']
    }`;

const newAdminPage = `{
      file: 'public/admin_panel.html',
      name: 'Admin Master Control',
      requiredIds: [
        'places-total-count', 'stat-teams-count', 'stat-registered-count', 'stat-total-points',
        'pending-items-list', 'approved-items-list', 'clock-display', 'places-list-container',
        'admin-action-modal', 'modal-confirm-input', 'modal-execute-btn', 'modal-title'
      ],
      requiredTexts: [
        'Admin Operations Console', 'start52MinCountdown', 'syncAdminGameState', 'approveTeam',
        'openAdminActionModal', 'executeAdminActionModal', 'startAdminLocalCountdown',
        'purge-all', 'reset-all-points'
      ]
    }`;

if (content.includes(oldAdminPage)) {
  content = content.replace(oldAdminPage, newAdminPage);
} else {
  console.warn('oldAdminPage not found');
}

// In Player Dashboard requiredTexts:
content = content.replace(
  `requiredTexts: ['resolveTeamTargetClue', 'rotateCardCipher', 'apiUrl']`,
  `requiredTexts: ['resolveTeamTargetClue', 'rotateCardCipher', 'apiUrl', 'startPlayerLocalCountdown']`
);

fs.writeFileSync(auditPath, content, 'utf8');
console.log('Successfully updated scripts/system_health_audit.js');
