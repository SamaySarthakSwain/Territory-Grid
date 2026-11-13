const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, '..', 'public', 'login.html');
let loginHtml = fs.readFileSync(loginPath, 'utf8');

loginHtml = loginHtml.replace('submitted to Game Master <b>Samay</b>.', 'submitted for Game Master clearance.');
loginHtml = loginHtml.replace('GAME MASTER: SAMAY', 'OPERATIONAL COMMAND');
loginHtml = loginHtml.replace('Waiting for Game Master Samay approval...', 'Waiting for Game Master approval...');

fs.writeFileSync(loginPath, loginHtml, 'utf8');
console.log('✅ login.html: Completely removed all mentions of Samay from UI');
