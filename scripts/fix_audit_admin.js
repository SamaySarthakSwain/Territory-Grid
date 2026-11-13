const fs = require('fs');
const path = require('path');

const auditPath = path.join(__dirname, '..', 'scripts', 'system_health_audit.js');
let content = fs.readFileSync(auditPath, 'utf8');

const target = `    {
      file: 'public/admin_panel.html',
      name: 'Admin Master Control',
      requiredIds: [
        'places-total-count', 'stat-teams-count', 'stat-registered-count', 'stat-total-points',
        'pending-items-list', 'approved-items-list', 'clock-display', 'places-list-container'
      ],
      requiredTexts: ['rebalanceAllSquadRoutes', 'loadApprovedRoster', 'loadPendingApprovals']
    }`;

const replacement = `    {
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
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(auditPath, content, 'utf8');
  console.log('Successfully updated admin_panel section in system_health_audit.js');
} else {
  console.warn('Target still not found');
}
