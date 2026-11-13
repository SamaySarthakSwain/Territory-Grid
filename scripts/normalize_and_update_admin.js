const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin_panel.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Normalize all CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Navigation Button for Tab 5
const dbTabBtn = `<button onclick="switchTab('database')" id="nav-btn-database" 
              class="px-3.5 py-1.5 text-xs font-headline font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition">
        <span class="material-symbols-outlined text-base">database</span>
        <span>MongoDB Database</span>
      </button>`;

const historyTabBtn = `<button onclick="switchTab('database')" id="nav-btn-database" 
              class="px-3.5 py-1.5 text-xs font-headline font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition">
        <span class="material-symbols-outlined text-base">database</span>
        <span>MongoDB Database</span>
      </button>

      <button onclick="switchTab('history')" id="nav-btn-history" 
              class="px-3.5 py-1.5 text-xs font-headline font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition whitespace-nowrap">
        <span class="material-symbols-outlined text-base">history_edu</span>
        <span>History</span>
        <span id="badge-logs-count" class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 ml-0.5">0</span>
      </button>`;

if (content.includes(dbTabBtn) && !content.includes('nav-btn-history')) {
  content = content.replace(dbTabBtn, historyTabBtn);
  console.log('1. Added nav-btn-history tab button');
} else {
  console.log('1. nav-btn-history status:', content.includes('nav-btn-history') ? 'already present' : 'not matched');
}

// 2. Tab 5 Container (#tab-content-history)
if (!content.includes('id="tab-content-history"')) {
  console.log('2. tab-content-history not present yet');
} else {
  console.log('2. tab-content-history already present');
}

// 3. Update switchTab
const oldSwitchTab = `function switchTab(tab) {
      activeTab = tab;
      ['ops', 'approvals', 'places', 'database'].forEach(function(t) {`;

const newSwitchTab = `function switchTab(tab) {
      activeTab = tab;
      ['ops', 'approvals', 'places', 'database', 'history'].forEach(function(t) {`;

if (content.includes(oldSwitchTab)) {
  content = content.replace(oldSwitchTab, newSwitchTab);
  console.log('3a. Updated switchTab array');
} else {
  console.log('3a. switchTab status:', content.includes('database\', \'history\'') ? 'already updated' : 'not matched');
}

const oldSwitchActions = `if (tab === 'database') loadDatabaseData();
      if (tab === 'places') loadPlaces();
      if (tab === 'approvals') { loadPendingApprovals(); loadApprovedRoster(); }
      if (tab === 'ops') loadLeaderboard();`;

const newSwitchActions = `if (tab === 'database') loadDatabaseData();
      if (tab === 'places') loadPlaces();
      if (tab === 'approvals') { loadPendingApprovals(); loadApprovedRoster(); }
      if (tab === 'ops') loadLeaderboard();
      if (tab === 'history') loadAdminLogs();`;

if (content.includes(oldSwitchActions)) {
  content = content.replace(oldSwitchActions, newSwitchActions);
  console.log('3b. Updated switchTab call actions');
} else {
  console.log('3b. switchTab action status:', content.includes('loadAdminLogs()') ? 'already updated' : 'not matched');
}

// 4. Update Registered Teams Table with Reset Points and Delete Team buttons
const oldRenderTeamsAction = `var actionHtml = isApproved
          ? '<span class="text-xs font-mono text-cyan flex items-center justify-end gap-1"><span class="material-symbols-outlined text-sm">verified</span> Active on Grid</span>'
          : '<button onclick="approveEntity(\\'TEAM\\', \\'' + t._id + '\\')" class="px-3 py-1 rounded-lg bg-green hover:bg-green/80 text-black font-headline font-bold text-xs uppercase flex items-center gap-1 ml-auto transition shadow-[0_0_10px_rgba(0,255,136,0.3)] cursor-pointer"><span class="material-symbols-outlined text-sm">check_circle</span><span>Quick Approve</span></button>';`;

const newRenderTeamsAction = `var safeName = (t.name || t.callsign || 'Squad').replace(/'/g, "\\\\'");
        var resetBtn = '<button onclick="confirmResetTeamPoints(\\'' + t._id + '\\', \\'' + safeName + '\\')" title="Reset Squad Points & Progress to 0" class="px-2.5 py-1 rounded bg-yellow-500/15 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 font-headline font-bold text-[11px] flex items-center gap-1 transition cursor-pointer active:scale-95"><span class="material-symbols-outlined text-xs">restart_alt</span><span class="hidden sm:inline">Reset</span></button>';
        var removeBtn = '<button onclick="confirmRemoveTeam(\\'' + t._id + '\\', \\'' + safeName + '\\')" title="Permanently Delete Squad" class="px-2.5 py-1 rounded bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-headline font-bold text-[11px] flex items-center gap-1 transition cursor-pointer active:scale-95"><span class="material-symbols-outlined text-xs">delete</span><span class="hidden sm:inline">Remove</span></button>';
        
        var actionHtml = '<div class="flex items-center justify-end gap-1.5 flex-wrap">';
        if (!isApproved) {
          actionHtml += '<button onclick="approveEntity(\\'TEAM\\', \\'' + t._id + '\\')" class="px-2.5 py-1 rounded bg-green hover:bg-green/80 text-black font-headline font-bold text-[11px] uppercase flex items-center gap-1 transition shadow-[0_0_8px_rgba(0,255,136,0.3)] cursor-pointer active:scale-95"><span class="material-symbols-outlined text-xs">check_circle</span><span>Approve</span></button>';
        }
        actionHtml += resetBtn + removeBtn + '</div>';`;

if (content.includes(oldRenderTeamsAction)) {
  content = content.replace(oldRenderTeamsAction, newRenderTeamsAction);
  console.log('4. Added Reset Pts and Remove buttons to Registered Teams table');
} else {
  console.log('4. Registered teams table status:', content.includes('confirmResetTeamPoints') ? 'already has reset' : 'not matched');
}

// 5. Update Approved Roster in Approvals tab
const oldApprovedActions = `'<div class="flex items-center gap-2">' +
              '<button onclick="rejectEntity(\\'TEAM\\', \\'' + team._id + '\\')" title="Revoke clearance" class="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-headline font-bold text-[11px] hover:bg-red-500/20 active:scale-95 transition cursor-pointer flex items-center gap-1">' +
                '<span class="material-symbols-outlined text-xs">block</span> <span>REVOKE</span>' +
              '</button>' +
            '</div>' +`;

const newApprovedActions = `'<div class="flex items-center gap-1.5 flex-wrap">' +
              '<button onclick="confirmResetTeamPoints(\\'' + team._id + '\\', \\'' + (team.name || team.callsign || 'Squad').replace(/'/g, "\\\\'") + '\\')" title="Reset Squad Points to 0" class="px-2.5 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 font-headline font-bold text-[11px] hover:bg-yellow-500/20 active:scale-95 transition cursor-pointer flex items-center gap-1">' +
                '<span class="material-symbols-outlined text-xs">restart_alt</span> <span>RESET PTS</span>' +
              '</button>' +
              '<button onclick="confirmRemoveTeam(\\'' + team._id + '\\', \\'' + (team.name || team.callsign || 'Squad').replace(/'/g, "\\\\'") + '\\')" title="Permanently Delete Squad" class="px-2.5 py-1.5 rounded-lg border border-red-500/40 bg-red-500/15 text-red-400 font-headline font-bold text-[11px] hover:bg-red-500/25 active:scale-95 transition cursor-pointer flex items-center gap-1">' +
                '<span class="material-symbols-outlined text-xs">delete</span> <span>REMOVE</span>' +
              '</button>' +
              '<button onclick="rejectEntity(\\'TEAM\\', \\'' + team._id + '\\')" title="Revoke clearance" class="px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-gray-400 font-headline font-bold text-[11px] hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition cursor-pointer flex items-center gap-1">' +
                '<span class="material-symbols-outlined text-xs">block</span> <span>REVOKE</span>' +
              '</button>' +
            '</div>' +`;

if (content.includes(oldApprovedActions)) {
  content = content.replace(oldApprovedActions, newApprovedActions);
  console.log('5. Added Reset Pts and Remove buttons to Approved Roster');
} else {
  console.log('5. Approved roster status:', content.includes('RESET PTS') ? 'already has reset' : 'not matched');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Script execution finished!');
