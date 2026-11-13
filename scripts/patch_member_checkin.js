const fs = require('fs');

let html = fs.readFileSync('public/member_checkin.html', 'utf8');

// 1. Update the Hero Status Card to include Assigned Squads panel and Station Location badge
const oldTelemetryPattern = /<div class="grid grid-cols-3 gap-2 mt-space-md pt-space-sm border-t border-outline-variant\/30">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newTelemetrySection = `<div class="grid grid-cols-3 gap-2 mt-space-md pt-space-sm border-t border-outline-variant/30">
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Logged</span>
            <span class="font-headline-sm text-headline-sm text-on-surface" id="telemetry-logged-count">0</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Authorized</span>
            <span class="font-headline-sm text-headline-sm text-tertiary" id="telemetry-assigned-count">0 Squads</span>
          </div>
          <div class="flex flex-col items-center bg-surface-container-low/60 rounded p-1.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Security</span>
            <span class="font-headline-sm text-headline-sm text-primary text-[11px] font-bold">ENFORCED</span>
          </div>
        </div>

        <!-- Authorized Squads Currently Assigned to This Station -->
        <div class="mt-2.5 pt-2 border-t border-outline-variant/30 flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] text-tertiary font-bold uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">pin_drop</span>
              <span>Squads Authorized At Your Station:</span>
            </span>
            <span class="text-[10px] font-mono text-gray-400" id="assigned-squads-summary">0 Assigned</span>
          </div>
          <div id="assigned-squads-chips" class="flex flex-wrap gap-1.5 pt-0.5 max-h-20 overflow-y-auto">
            <span class="text-[11px] font-mono text-gray-400">Loading squad route telemetry...</span>
          </div>
        </div>`;

if (oldTelemetryPattern.test(html)) {
  html = html.replace(oldTelemetryPattern, newTelemetrySection);
  console.log('Telemetry & Assigned Squads panel updated!');
} else {
  console.warn('Could not match oldTelemetryPattern directly');
}

// 2. Add Wrong Station Modal below already-visited-modal
const wrongStationModalHtml = `
  <!-- WRONG CHECKPOINT STATION MODAL (Access Denied) -->
  <div id="wrong-station-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 hidden">
    <div class="w-full max-w-sm rounded-2xl bg-[#140608] border-2 border-error shadow-[0_0_40px_rgba(255,59,59,0.6)] p-5 space-y-4 animate-scaleUp">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-error/20 border-2 border-error flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,59,59,0.5)]">
          <span class="material-symbols-outlined text-error text-2xl">block</span>
        </div>
        <div>
          <h4 class="font-headline font-black text-lg text-white">Wrong Station!</h4>
          <span class="text-[11px] font-mono text-error font-bold uppercase tracking-wider">Access Denied // Strict Station Security</span>
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-surface-container-lowest border border-error/30 text-xs font-mono space-y-2 text-gray-300">
        <div class="text-white font-bold text-sm" id="wrong-station-squad-name">Squad Name</div>
        <p class="leading-relaxed text-error font-bold" id="wrong-station-error-msg">
          Squad is not assigned to this station!
        </p>
        <div class="pt-2 border-t border-white/10 flex items-center gap-1.5 text-primary">
          <span class="material-symbols-outlined text-[16px]">navigation</span>
          <span>Target Station: <b id="wrong-station-target" class="text-white">Zone</b></span>
        </div>
      </div>
      <div class="flex flex-col gap-2 pt-1">
        <button onclick="dismissWrongStationModal()" class="w-full py-2.5 rounded-xl bg-error hover:bg-error/80 text-white font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer">
          <span class="material-symbols-outlined text-sm">check</span>
          <span>Acknowledge &amp; Resume Scanner</span>
        </button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="wrong-station-modal"')) {
  html = html.replace('<!-- Field Marshal Bottom Navigation Bar -->', wrongStationModalHtml + '\n  <!-- Field Marshal Bottom Navigation Bar -->');
  console.log('Wrong station modal added!');
}

// 3. Update Celebration overlay to show NEXT LOCATION directive clearly
const oldNextClueRow = `<div class="pt-2 border-t border-gray-800 text-[11px] text-primary font-mono flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-sm">lock_open</span>
          <span id="celeb-next-clue-label">Next Mission Hint Unlocked for Squad!</span>
        </div>`;

const newNextClueRow = `<div class="pt-2 border-t border-gray-800 text-[11px] font-mono flex flex-col gap-1 text-left bg-black/40 p-2.5 rounded-lg border border-primary/20">
          <div class="flex items-center gap-1.5 text-primary font-bold">
            <span class="material-symbols-outlined text-sm">near_me</span>
            <span id="celeb-next-location-title">NEXT LOCATION: Standby</span>
          </div>
          <p class="text-[10px] text-gray-300 italic" id="celeb-next-clue-label">Next directive transmitted to squad phone.</p>
        </div>`;

if (html.includes(oldNextClueRow)) {
  html = html.replace(oldNextClueRow, newNextClueRow);
  console.log('Celebration modal next location row updated!');
}

fs.writeFileSync('public/member_checkin.html', html, 'utf8');
console.log('Saved public/member_checkin.html template structure successfully');
