const fs = require('fs');
const content = fs.readFileSync('api/index.js', 'utf8');
console.log('ensureUniqueTeamCodes in api/index.js:', content.includes('ensureUniqueTeamCodes'));
