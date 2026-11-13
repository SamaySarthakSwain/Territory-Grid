const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'leaderboard.html'), 'utf8');

const btnRegex = /<button[\s\S]*?<\/button>/gi;
let match;
let i = 0;
while ((match = btnRegex.exec(html)) !== null) {
  i++;
  const full = match[0];
  const onclickMatch = full.match(/onclick=["']([^"']+)["']/i);
  const idMatch = full.match(/id=["']([^"']+)["']/i);
  const text = full.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  console.log(`${i}. [${idMatch ? idMatch[1] : 'NO-ID'}] "${text.slice(0, 35)}" -> onclick: ${onclickMatch ? onclickMatch[1] : 'NONE'}`);
}
