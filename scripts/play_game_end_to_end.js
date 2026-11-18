const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.GAME_URL || 'https://territory-grid-delta.vercel.app';

const recordedErrors = [];
const consoleLogs = [];

function recordError(pageName, type, msg) {
  const errObj = { page: pageName, type, message: msg, time: new Date().toISOString() };
  recordedErrors.push(errObj);
  console.error(`   ❌ [${pageName}] [${type}]: ${msg}`);
}

function attachPageListeners(page, pageName) {
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ page: pageName, type, text });
    if (type === 'error') {
      if (text.includes('favicon.ico')) return;
      recordError(pageName, 'CONSOLE_ERROR', text);
    }
  });

  page.on('pageerror', err => {
    recordError(pageName, 'UNCAUGHT_EXCEPTION', err.message);
  });

  page.on('requestfailed', req => {
    // Ignore aborted or favicon requests
    if (req.url().includes('favicon') || req.failure()?.errorText === 'net::ERR_ABORTED') return;
    recordError(pageName, 'NETWORK_FAIL', `${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function play() {
  console.log(`\n======================================================`);
  console.log(`🎮 PLAYING TERRITORY GRID END-TO-END LIKE A REAL USER`);
  console.log(`   Target Server: ${BASE_URL}`);
  console.log(`   Emulating Mobile: 390x844 (iPhone 14 / Android Standard)`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-running-insecure-content'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    // ─────────────────────────────────────────────────────────
    // ACT 1: CLEAN SLATE SETUP VIA ADMIN
    // ─────────────────────────────────────────────────────────
    console.log('--- ACT 1: ADMIN LOGIN & RESET ---');
    attachPageListeners(page, 'Login_Admin');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    console.log('   Navigated to login.html');

    // Select Game Master portal
    await page.evaluate(() => {
      selectPortal('ADMIN');
      document.getElementById('input-callsign').value = 'samay';
      document.getElementById('input-password').value = 'samay';
    });
    console.log('   Filled Admin credentials (samay/samay)');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.evaluate(() => {
        const form = document.getElementById('auth-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      })
    ]);
    console.log(`   Admin Login Destination: ${page.url()}`);

    // If on admin panel or game master, reset points and purge old test teams
    attachPageListeners(page, 'Admin_Panel');
    await page.goto(`${BASE_URL}/admin_panel.html`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Call reset and purge
    await page.evaluate(async () => {
      try {
        await fetch(apiUrl('/api/admin/teams/reset-all-points'), { method: 'POST', body: '{}' });
        await fetch(apiUrl('/api/admin/teams/purge-all'), { method: 'POST', body: '{}' });
      } catch(e){}
    });
    console.log('   Purged old test data and reset grid to clean baseline.');

    // ─────────────────────────────────────────────────────────
    // ACT 2: PLAYER 1 SQUAD REGISTRATION
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 2: SQUAD REGISTRATION (Alpha Squad) ---');
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    attachPageListeners(page, 'Player_Reg');

    const regResult = await page.evaluate(async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'PLAYER',
            name: 'Alpha Wolves',
            callsign: 'alpha',
            password: 'pass',
            membersCount: 4
          })
        });
        return await res.json();
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('   Alpha Registration Result:', regResult.status || regResult.message || regResult.error);

    // ─────────────────────────────────────────────────────────
    // ACT 3: MARSHAL REGISTRATION
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 3: MARSHAL REGISTRATION (Station North) ---');
    const marshalRegResult = await page.evaluate(async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'MEMBER',
            name: 'Marshal North',
            callsign: 'marshal1',
            password: 'pass',
            zoneId: 'ZONE_01',
            coneColor: 'GREEN'
          })
        });
        return await res.json();
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('   Marshal Registration Result:', marshalRegResult.status || marshalRegResult.message || marshalRegResult.error);

    // ─────────────────────────────────────────────────────────
    // ACT 4: ADMIN APPROVAL & START COUNTDOWN
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 4: ADMIN APPROVAL & START HUNT ---');
    await page.goto(`${BASE_URL}/admin_panel.html`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const startResult = await page.evaluate(async () => {
      try {
        // Approve all
        await fetch(apiUrl('/api/admin/approve-all'), { method: 'POST', body: '{}' });
        // Start countdown (3s countdown -> PLAYER_PHASE)
        const res = await fetch(apiUrl('/api/game/state'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COUNTDOWN',
            countdownSeconds: 3,
            durationMinutes: 52
          })
        });
        return await res.json();
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('   Game Start Result:', startResult.state?.status || startResult.status || startResult.error);

    // Wait for countdown to expire into PLAYER_PHASE
    console.log('   Waiting 4 seconds for countdown to transition to PLAYER_PHASE...');
    await sleep(4000);

    // Check game state
    const currentGs = await page.evaluate(async () => {
      const res = await fetch(apiUrl('/api/game/state?_t=' + Date.now()));
      return await res.json();
    });
    console.log('   Active Game State Status:', currentGs.status || currentGs.state?.status);

    // ─────────────────────────────────────────────────────────
    // ACT 5: PLAYER DASHBOARD PLAYTHROUGH
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 5: SQUAD LOGS IN & VIEWS CARD (Player Portal) ---');
    // Set localStorage as player "alpha"
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      selectPortal('PLAYER');
      document.getElementById('input-callsign').value = 'alpha';
      document.getElementById('input-password').value = 'pass';
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.evaluate(() => {
        const form = document.getElementById('auth-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      })
    ]);
    console.log(`   Player Login Destination: ${page.url()}`);

    attachPageListeners(page, 'Player_Dashboard');
    await page.goto(`${BASE_URL}/player_dashboard.html`, { waitUntil: 'networkidle2' });
    await sleep(2500);

    // Inspect Player UI elements
    const playerTelemetry = await page.evaluate(() => {
      const teamName = document.getElementById('team-name-label')?.innerText || '';
      const score = document.getElementById('team-score-num')?.innerText || '';
      const station = document.getElementById('active-station-name')?.innerText || '';
      const clue = document.getElementById('active-clue-text')?.innerText || '';
      const code = document.getElementById('manual-cipher-code')?.innerText || '';
      const zoneBadge = document.getElementById('active-zone-badge')?.innerText || '';
      return { teamName, score, station, clue, code, zoneBadge };
    });
    console.log('   [Player Dashboard Telemetry]:', playerTelemetry);

    // Flip card to test interactive flip animation
    await page.evaluate(() => {
      toggleCardFlip();
    });
    await sleep(800);
    const flippedCode = await page.evaluate(() => {
      return document.getElementById('manual-cipher-code')?.innerText;
    });
    console.log('   [Player Card Flipped Code]:', flippedCode);

    // ─────────────────────────────────────────────────────────
    // ACT 6: FIELD MARSHAL CHECK-IN
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 6: FIELD MARSHAL ENTERS CODE (Marshal Portal) ---');
    // Login as Marshal
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      selectPortal('MEMBER');
      document.getElementById('input-callsign').value = 'marshal1';
      document.getElementById('input-password').value = 'pass';
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.evaluate(() => {
        const form = document.getElementById('auth-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      })
    ]);
    console.log(`   Marshal Login Destination: ${page.url()}`);

    attachPageListeners(page, 'Marshal_Portal');
    await page.goto(`${BASE_URL}/member_checkin.html`, { waitUntil: 'networkidle2' });
    await sleep(2500);

    const marshalStationInfo = await page.evaluate(() => {
      return {
        callsign: document.getElementById('header-marshal-callsign')?.innerText,
        zoneId: document.getElementById('station-zone-id')?.innerText,
        zoneLabel: document.getElementById('station-zone-label')?.innerText,
        coneColor: checkinState?.coneColor,
        conePoints: checkinState?.conePoints
      };
    });
    console.log('   [Marshal Station Info]:', marshalStationInfo);

    // Type the player's code into the input field!
    const cleanDigits = flippedCode.replace(/\D/g, '');
    console.log(`   Entering Code "${cleanDigits}" into Manual Cipher Input...`);

    const awardResult = await page.evaluate(async (codeToEnter) => {
      const input = document.getElementById('manual-cipher-input');
      input.value = codeToEnter;
      // Trigger verification
      await verifyManualCipherCode();
      await new Promise(r => setTimeout(r, 2000));
      const celebOverlay = document.getElementById('celebration-overlay');
      const isCelebVisible = celebOverlay && !celebOverlay.classList.contains('hidden');
      const celebPoints = document.getElementById('celeb-points-awarded')?.innerText;
      const celebScore = document.getElementById('celeb-total-score')?.innerText;
      const wrongModal = document.getElementById('wrong-station-modal');
      const isWrongVisible = wrongModal && !wrongModal.classList.contains('hidden');
      const wrongMsg = document.getElementById('wrong-station-error-msg')?.innerText;
      return { isCelebVisible, celebPoints, celebScore, isWrongVisible, wrongMsg };
    }, cleanDigits);

    console.log('   [Marshal Award Submission Result]:', awardResult);

    if (awardResult.isWrongVisible) {
      console.log('   ⚠️ Wrong Station Triggered! Testing Marshal Override button...');
      const overrideOutcome = await page.evaluate(async () => {
        await executeWrongStationOverride();
        await new Promise(r => setTimeout(r, 2000));
        const celebOverlay = document.getElementById('celebration-overlay');
        const isCelebVisible = celebOverlay && !celebOverlay.classList.contains('hidden');
        const celebPoints = document.getElementById('celeb-points-awarded')?.innerText;
        const celebScore = document.getElementById('celeb-total-score')?.innerText;
        return { isCelebVisible, celebPoints, celebScore };
      });
      console.log('   [Marshal Override Outcome]:', overrideOutcome);
    }

    // ─────────────────────────────────────────────────────────
    // ACT 7: VERIFY PLAYER DASHBOARD SCORE & CLUE ADVANCEMENT
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 7: VERIFYING PLAYER DASHBOARD SCORE UPDATE ---');
    // Restore player session
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      selectPortal('PLAYER');
      document.getElementById('input-callsign').value = 'alpha';
      document.getElementById('input-password').value = 'pass';
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.evaluate(() => {
        const form = document.getElementById('auth-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      })
    ]);

    await page.goto(`${BASE_URL}/player_dashboard.html`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    const postAwardTelemetry = await page.evaluate(() => {
      const score = document.getElementById('team-score-num')?.innerText || '';
      const station = document.getElementById('active-station-name')?.innerText || '';
      const clue = document.getElementById('active-clue-text')?.innerText || '';
      const cardsCount = document.getElementById('cards-count-label')?.innerText || '';
      return { score, station, clue, cardsCount };
    });
    console.log('   [Player Dashboard Post-Award Telemetry]:', postAwardTelemetry);

    // ─────────────────────────────────────────────────────────
    // ACT 8: LEADERBOARD VALIDATION
    // ─────────────────────────────────────────────────────────
    console.log('\n--- ACT 8: LIVE CHAMPIONSHIP LEADERBOARD ---');
    attachPageListeners(page, 'Leaderboard');
    await page.goto(`${BASE_URL}/leaderboard.html`, { waitUntil: 'networkidle2' });
    await sleep(3500);

    const leaderboardTelemetry = await page.evaluate(() => {
      const syncStatus = document.getElementById('telemetry-sync-indicator')?.innerText || '';
      const timer = document.getElementById('hunt-timer-display')?.innerText || '';
      const podiumCards = Array.from(document.querySelectorAll('#podium-slots-container .podium-card, #podium-slots-container > div')).map(el => el.innerText.replace(/\s+/g, ' '));
      const rankingRows = Array.from(document.querySelectorAll('#leaderboard-rows-container tr, #leaderboard-rows-container > div')).map(el => el.innerText.replace(/\s+/g, ' '));
      return { syncStatus, timer, podiumCount: podiumCards.length, podiumCards: podiumCards.slice(0, 3), rowsCount: rankingRows.length };
    });
    console.log('   [Leaderboard Telemetry]:', leaderboardTelemetry);

    // Test tab switching
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('#filter-tabs button');
      if (tabs[1]) switchTab(tabs[1], 'ZONES');
    });
    await sleep(1000);
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('#filter-tabs button');
      if (tabs[2]) switchTab(tabs[2], 'CARDS');
    });
    await sleep(1000);
    console.log('   Tested Leaderboard Filter Tabs: Overall, Zones, Cards.');

  } finally {
    await browser.close();
  }

  // ─────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────
  console.log(`\n======================================================`);
  console.log(`📊 GAMEPLAY SESSION AUDIT REPORT`);
  console.log(`======================================================`);
  console.log(`Total Errors Recorded: ${recordedErrors.length}`);
  if (recordedErrors.length === 0) {
    console.log(`🎉 PERFECT SCORE: 0 ERRORS DETECTED DURING FULL PLAYTHROUGH!`);
  } else {
    console.log(`Identified Issues:`);
    recordedErrors.forEach((err, idx) => {
      console.log(` ${idx + 1}. [${err.page}] ${err.type}: ${err.message}`);
    });
  }
  console.log(`======================================================\n`);
}

play().catch(err => {
  console.error('\n❌ CRITICAL PLAYTHROUGH EXCEPTION:', err);
  process.exit(1);
});
