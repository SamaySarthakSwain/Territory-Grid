const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = path.join(__dirname, '..');
const PUBLIC = path.join(BASE, 'public');

// ============================================================================
// 1. UPDATE api/index.js - Strict Server-side Admin Auth
// ============================================================================
const apiPath = path.join(BASE, 'api', 'index.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Replace login handler's admin check with strict rule
const oldAdminLoginCheck = `      // Admin Samay (Fixed Account)
      if (trimmedCallsign.toLowerCase() === 'samay' && trimmedPass === 'samay') {
        return sendJson(res, 200, {
          success: true,
          role: 'ADMIN',
          isApproved: true,
          user: DEFAULT_ADMIN
        });
      }`;

const newAdminLoginCheck = `      // Strictly Guard Admin Access: Only ID 'samay' and password 'samay'
      if (requestedRole === 'ADMIN' || trimmedCallsign.toLowerCase() === 'samay') {
        if (trimmedCallsign.toLowerCase() === 'samay' && trimmedPass === 'samay') {
          return sendJson(res, 200, {
            success: true,
            role: 'ADMIN',
            isApproved: true,
            user: DEFAULT_ADMIN
          });
        } else {
          return sendJson(res, 401, {
            success: false,
            error: 'Clearance Denied: Admin portal is strictly restricted to Game Master Samay. Invalid ID or password.'
          });
        }
      }`;

if (apiContent.includes(oldAdminLoginCheck)) {
  apiContent = apiContent.replace(oldAdminLoginCheck, newAdminLoginCheck);
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('✅ api/index.js: Enforced strict admin check on /api/auth/login');
} else {
  console.warn('⚠️ api/index.js: oldAdminLoginCheck string not matched exactly');
}

// ============================================================================
// 2. UPDATE public/login.html - Remove Auto-Fill, Clear Inputs on Admin Tab
// ============================================================================
const loginPath = path.join(PUBLIC, 'login.html');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Remove fillAdminCredentials() call from selectPortal('ADMIN')
loginContent = loginContent.replace(/fillAdminCredentials\(\);/g, `// Do NOT auto-fill admin credentials - require manual entry of samay / samay
        var callsignInput = document.getElementById('input-callsign');
        var passInput = document.getElementById('input-password');
        if (callsignInput) { callsignInput.value = ''; callsignInput.placeholder = 'Enter Admin ID (samay)'; }
        if (passInput) { passInput.value = ''; passInput.placeholder = 'Enter Admin Password'; }`);

// Remove the Auto-Fill button from the hint markup
const oldHintMarkup = `<div id="admin-credentials-hint" class="hidden p-3 rounded-xl bg-magenta/10 border border-magenta/30 text-xs font-mono text-magenta flex items-center justify-between">
            <span>GAME MASTER ACCESS: Authorized Personnel Only</span>
            <button type="button" onclick="fillAdminCredentials()" class="underline hover:text-white text-[11px] font-bold">Auto-Fill</button>
          </div>`;

const newHintMarkup = `<div id="admin-credentials-hint" class="hidden p-3 rounded-xl bg-magenta/10 border border-magenta/30 text-xs font-mono text-magenta flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">lock</span>
            <span>RESTRICTED ACCESS: Enter ID "samay" and password "samay" to access the Admin Terminal.</span>
          </div>`;

if (loginContent.includes(oldHintMarkup)) {
  loginContent = loginContent.replace(oldHintMarkup, newHintMarkup);
  console.log('✅ login.html: Removed Auto-Fill button from admin hint');
} else {
  // Regex replacement
  loginContent = loginContent.replace(/<div id="admin-credentials-hint"[\s\S]*?<\/div>/, newHintMarkup);
  console.log('✅ login.html: Replaced admin hint via regex');
}

// Remove fillAdminCredentials function definition
loginContent = loginContent.replace(/function fillAdminCredentials\(\) \{[\s\S]*?\}/, `function fillAdminCredentials() {
      // Disabled for security - credentials must be entered manually
    }`);

// Check URL params for restricted alert on DOMContentLoaded
const oldUrlParamCheck = `        if (urlParams.get('logout') === 'true' || urlParams.get('switch') === 'true' || urlParams.get('clear') === 'true') {
          clearSession();
        }`;

const newUrlParamCheck = `        if (urlParams.get('logout') === 'true' || urlParams.get('switch') === 'true' || urlParams.get('clear') === 'true') {
          clearSession();
        }
        if (urlParams.get('restricted') === 'admin') {
          clearSession();
          setTimeout(function() {
            showAlert('Access Denied: Only Game Master Samay (ID: samay) can access the Admin Command Terminal.', true);
            selectPortal('ADMIN');
          }, 150);
        }`;

if (loginContent.includes(oldUrlParamCheck)) {
  loginContent = loginContent.replace(oldUrlParamCheck, newUrlParamCheck);
  console.log('✅ login.html: Added restricted=admin alert handling');
}

fs.writeFileSync(loginPath, loginContent, 'utf8');

// ============================================================================
// 3. UPDATE public/admin_panel.html - Strict Identity & Role Guard
// ============================================================================
const adminPath = path.join(PUBLIC, 'admin_panel.html');
let adminContent = fs.readFileSync(adminPath, 'utf8');

const oldAdminGuard = `    // 1. Role Guard: Enforce Admin (samay)
    (function checkAdminClearance() {
      try {
        var raw = localStorage.getItem('territory_grid_user') || sessionStorage.getItem('territory_grid_user');
        var user = raw ? JSON.parse(raw) : null;
        if (!user || user.role !== 'ADMIN') {
          alert('Security Clearance Alert: Access restricted to Game Master Samay.');
          window.location.href = 'login.html';
        }
      } catch (e) {
        window.location.href = 'login.html';
      }
    })();`;

const newAdminGuard = `    // 1. Strict Role & Identity Guard: Strictly enforce Admin (samay)
    (function checkAdminClearance() {
      try {
        var raw = localStorage.getItem('territory_grid_user') || sessionStorage.getItem('territory_grid_user');
        var user = raw ? JSON.parse(raw) : null;
        var isSamay = user && (
          (user.callsign && user.callsign.toLowerCase() === 'samay') ||
          (user.username && user.username.toLowerCase() === 'samay') ||
          (user.name && user.name.toLowerCase() === 'samay')
        );
        if (!user || user.role !== 'ADMIN' || !isSamay) {
          localStorage.removeItem('territory_grid_user');
          sessionStorage.removeItem('territory_grid_user');
          window.location.replace('login.html?logout=true&restricted=admin');
          return;
        }
      } catch (e) {
        localStorage.removeItem('territory_grid_user');
        sessionStorage.removeItem('territory_grid_user');
        window.location.replace('login.html?logout=true&restricted=admin');
      }
    })();`;

if (adminContent.includes(oldAdminGuard)) {
  adminContent = adminContent.replace(oldAdminGuard, newAdminGuard);
  fs.writeFileSync(adminPath, adminContent, 'utf8');
  console.log('✅ admin_panel.html: Enforced strict identity & role guard');
} else {
  console.warn('⚠️ admin_panel.html: oldAdminGuard not matched exactly');
}

console.log('\n--- Validating JavaScript Syntax on updated files ---');
['admin_panel.html', 'login.html'].forEach(f => {
  const c = fs.readFileSync(path.join(PUBLIC, f), 'utf8');
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let i = 0;
  while ((match = scriptRegex.exec(c)) !== null) {
    i++;
    if (match[0].includes('src=')) continue;
    try {
      new vm.Script(match[1], { filename: `${f}_s${i}` });
      console.log(`  ✅ ${f} script #${i}: OK`);
    } catch (err) {
      console.error(`  ❌ ${f} script #${i} FAILED:`, err.message);
      process.exit(1);
    }
  }
});

console.log('🎉 Done applying admin security locks!');
