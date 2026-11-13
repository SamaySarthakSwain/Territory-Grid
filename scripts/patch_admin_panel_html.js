const fs = require('fs');

let html = fs.readFileSync('public/admin_panel.html', 'utf8');

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

// 2. Replace all fetch('/api... with fetch(apiUrl('/api...
html = html.replace(/fetch\('(\/api[^']+)'/g, "fetch(apiUrl('$1')");
html = html.replace(/fetch\(`(\/api[^`]+)`/g, "fetch(apiUrl(`$1`)");

fs.writeFileSync('public/admin_panel.html', html, 'utf8');
console.log('public/admin_panel.html patched successfully!');
