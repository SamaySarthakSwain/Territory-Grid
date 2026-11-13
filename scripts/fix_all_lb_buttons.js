const fs = require('fs');
const path = require('path');

const lbPath = path.join(__dirname, '..', 'public', 'leaderboard.html');
let html = fs.readFileSync(lbPath, 'utf8');

const target = '<button class="flex flex-col items-center justify-center gap-1 w-24 h-14 text-primary-container font-bold">';
const replacement = '<button onclick="window.scrollTo({top:0, behavior:\'smooth\'})" class="flex flex-col items-center justify-center gap-1 w-24 h-14 text-primary-container font-bold cursor-pointer">';

html = html.replaceAll(target, replacement);

fs.writeFileSync(lbPath, html, 'utf8');
console.log('Successfully updated all rank buttons in leaderboard.html');
