const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const PUBLIC = path.join(BASE, 'public');

// 1. UPDATE public/login.html
const loginPath = path.join(PUBLIC, 'login.html');
let loginHtml = fs.readFileSync(loginPath, 'utf8');

// Replace the hint banner completely - no reference to samay or credentials
const oldHint = `<span>RESTRICTED ACCESS: Enter ID "samay" and password "samay" to access the Admin Terminal.</span>`;
const newHint = `<span>RESTRICTED PROTOCOL // Authorized Command Personnel Only.</span>`;
loginHtml = loginHtml.replace(oldHint, newHint);

// Replace placeholder containing (samay)
loginHtml = loginHtml.replace(/placeholder = 'Enter Admin ID \(samay\)';/g, "placeholder = 'Enter Command ID';");
loginHtml = loginHtml.replace(/placeholder="Enter Callsign \/ Squad Name"/g, `placeholder="Enter Callsign / ID"`);

// Replace error message in handleFormSubmit
const oldSubmitAlert = `showAlert('Security Rejection: Game Master Terminal access is strictly restricted. Only ID "samay" and password "samay" is authorized.', true);`;
const newSubmitAlert = `showAlert('Clearance Rejected: Invalid Command ID or Access Key.', true);`;
loginHtml = loginHtml.replace(oldSubmitAlert, newSubmitAlert);

// Replace alert in restricted=admin URL handler
const oldRestrictedAlert = `showAlert('Access Denied: Only Game Master Samay (ID: samay) can access the Admin Command Terminal.', true);`;
const newRestrictedAlert = `showAlert('Access Denied: Command Terminal requires authorized credentials.', true);`;
loginHtml = loginHtml.replace(oldRestrictedAlert, newRestrictedAlert);

fs.writeFileSync(loginPath, loginHtml, 'utf8');
console.log('✅ login.html: Removed all admin hint texts and credentials leaks');

// 2. UPDATE api/index.js
const apiPath = path.join(BASE, 'api', 'index.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

const oldApiError = `error: 'Clearance Denied: Admin portal is strictly restricted to Game Master Samay. Invalid ID or password.'`;
const newApiError = `error: 'Clearance Rejected: Invalid Command ID or Access Key.'`;
apiContent = apiContent.replace(oldApiError, newApiError);

const oldReservedError = `error: 'Callsign "samay" is reserved for Game Master Admin.'`;
const newReservedError = `error: 'This callsign is reserved.'`;
apiContent = apiContent.replace(oldReservedError, newReservedError);

fs.writeFileSync(apiPath, apiContent, 'utf8');
console.log('✅ api/index.js: Sanitized server responses to conceal credentials');
