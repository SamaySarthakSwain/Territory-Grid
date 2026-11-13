const fs = require('fs');

['public/player_dashboard.html', 'public/member_checkin.html'].forEach(file => {
  let html = fs.readFileSync(file, 'utf8');

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

  html = html.replace(/fetch\('(\/api[^']+)'/g, "fetch(apiUrl('$1')");
  html = html.replace(/fetch\(`(\/api[^`]+)`/g, "fetch(apiUrl(`$1`)");

  fs.writeFileSync(file, html, 'utf8');
  console.log(`${file} patched successfully!`);
});
