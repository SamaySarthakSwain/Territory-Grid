const fs = require('fs');

let html = fs.readFileSync('public/login.html', 'utf8');

// 1. Add apiUrl helper if not present
if (!html.includes('function apiUrl(path)')) {
  const apiHelper = `
    // Resilient API Base Resolver (Works in APK file:// and web https://)
    function apiUrl(path) {
      var base = '';
      if (window.location.protocol === 'file:' || window.location.origin === 'null' || !window.location.origin.startsWith('http')) {
        base = 'https://territory-grid-delta.vercel.app';
      }
      return base + path;
    }
`;
  html = html.replace("<script>", "<script>" + apiHelper);
}

// 2. Wrap fetch calls with apiUrl
html = html.replace(
  "fetch('/api/clues?all=true&_t='",
  "fetch(apiUrl('/api/clues?all=true&_t='"
);
html = html.replace(
  "fetch(endpoint,",
  "fetch(apiUrl(endpoint),"
);
html = html.replace(
  "fetch('/api/auth/status?id='",
  "fetch(apiUrl('/api/auth/status?id='"
);

// 3. Fallback station option if no clues exist
const oldStationEmpty = "sel.innerHTML = '<option value=\"\" disabled selected>⚠️ No campus places created by Game Master yet</option>';";
const newStationEmpty = "sel.innerHTML = '<option value=\"ZONE_01\" selected>Campus Sector Alpha (ZONE_01 - Default)</option>';";
html = html.replace(oldStationEmpty, newStationEmpty);

// 4. In handleFormSubmit, guarantee zoneId for Marshal
const oldZoneExtract = "var zoneId = zoneElem ? zoneElem.value : null;\n      var zoneLabel = zoneElem ? zoneElem.options[zoneElem.selectedIndex].text : null;";
const oldZoneExtractCRLF = "var zoneId = zoneElem ? zoneElem.value : null;\r\n      var zoneLabel = zoneElem ? zoneElem.options[zoneElem.selectedIndex].text : null;";

const newZoneExtract = `var zoneId = (zoneElem && zoneElem.value) ? zoneElem.value : (currentRole === 'MEMBER' ? 'ZONE_01' : null);
      var zoneLabel = (zoneElem && zoneElem.selectedIndex >= 0 && zoneElem.options[zoneElem.selectedIndex]) ? zoneElem.options[zoneElem.selectedIndex].text : (currentRole === 'MEMBER' ? 'Sector Alpha (ZONE_01)' : null);`;

if (html.includes(oldZoneExtractCRLF)) {
  html = html.replace(oldZoneExtractCRLF, newZoneExtract);
} else if (html.includes(oldZoneExtract)) {
  html = html.replace(oldZoneExtract, newZoneExtract);
}

// 5. Fast poll timer: 1200ms
html = html.replace("setInterval(function() {\n        checkApprovalStatus(userId, role, false);\n      }, 1500);", "setInterval(function() {\n        checkApprovalStatus(userId, role, false);\n      }, 1200);");
html = html.replace("setInterval(function() {\r\n        checkApprovalStatus(userId, role, false);\r\n      }, 1500);", "setInterval(function() {\r\n        checkApprovalStatus(userId, role, false);\r\n      }, 1200);");

fs.writeFileSync('public/login.html', html, 'utf8');
console.log('public/login.html patched successfully!');
