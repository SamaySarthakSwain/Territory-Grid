const fs = require('fs');
const path = require('path');

const marshalHtmlPath = path.join(__dirname, '..', 'public', 'member_checkin.html');
let html = fs.readFileSync(marshalHtmlPath, 'utf8');

const target = `syncMarshalGameState();
      setInterval(syncMarshalGameState, 3500 + Math.floor(Math.random()*800));`;

const replacement = `syncMarshalGameState();
      function scheduleMarshalSync() {
        var delay = (marshalGameState === 'LOBBY' || marshalGameState === 'COUNTDOWN') ? 1000 : 3500;
        setTimeout(function() {
          syncMarshalGameState().finally(scheduleMarshalSync);
        }, delay);
      }
      scheduleMarshalSync();`;

if (html.includes(target)) {
  html = html.replace(target, replacement);
  fs.writeFileSync(marshalHtmlPath, html, 'utf8');
  console.log('Successfully patched public/member_checkin.html');
} else {
  console.warn('Target not found in member_checkin.html, checking fallback...');
}
