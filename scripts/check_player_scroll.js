const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'player_dashboard.html'), 'utf8');

console.log('scrollToTop exists:', html.includes('scrollToTop'));
console.log('scrollToCard exists:', html.includes('scrollToCard'));
console.log('scrollToDeck exists:', html.includes('scrollToDeck'));
