const fs = require('fs');
const path = require('path');
const PUBLIC = path.join(__dirname, '..', 'public');

['member_checkin.html', 'player_dashboard.html'].forEach(f => {
  const filePath = path.join(PUBLIC, f);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/window\.location\.href\s*=\s*'login\.html';/g, "window.location.href = 'login.html?logout=true';");
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated signOut in ' + f);
});
