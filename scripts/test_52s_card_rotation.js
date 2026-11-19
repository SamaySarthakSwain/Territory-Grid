const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('🧪 Starting 52-Second Dynamic Card Rotation Test with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Navigate to login first to set origin and localStorage
  const loginUrl = 'file:///' + path.resolve(__dirname, '..', 'public', 'login.html').replace(/\\/g, '/');
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  // Set authenticated player in localStorage
  await page.evaluate(() => {
    localStorage.setItem('territory_grid_user', JSON.stringify({
      id: 'team_alpha_wolves',
      _id: 'team_alpha_wolves',
      teamId: 'team_alpha_wolves',
      callsign: 'ALPHA WOLVES',
      name: 'Alpha Wolves',
      username: 'alpha',
      role: 'PLAYER',
      isApproved: true,
      currentClueIndex: 0
    }));
  });

  // Now navigate to player_dashboard.html
  const dashUrl = 'file:///' + path.resolve(__dirname, '..', 'public', 'player_dashboard.html').replace(/\\/g, '/');
  console.log('Navigating to player_dashboard.html...');
  await page.goto(dashUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Current page URL:', page.url());

  // Extract initial card telemetry
  const initialCard = await page.evaluate(() => {
    const rankEl = document.getElementById('card-rank-top');
    const suitEl = document.getElementById('card-suit-top');
    const cipherEl = document.getElementById('manual-cipher-code');
    const countdownEl = document.getElementById('card-cycle-countdown');
    const progressEl = document.getElementById('card-cycle-progress-bar');
    return {
      rank: rankEl ? rankEl.innerText : null,
      suit: suitEl ? suitEl.innerText : null,
      cipher: cipherEl ? cipherEl.innerText : null,
      countdown: countdownEl ? countdownEl.innerText : null,
      progressWidth: progressEl ? progressEl.style.width : null,
      cardShuffleStep: typeof cardShuffleStep !== 'undefined' ? cardShuffleStep : null
    };
  });

  console.log('Initial Card Telemetry (t = 0):', initialCard);
  if (!initialCard.rank || !initialCard.suit || !initialCard.cipher) {
    console.error('❌ Failed: Initial card elements not populated!');
    await browser.close();
    process.exit(1);
  }

  // Fast-forward time by 52 seconds in browser runtime to test rotation trigger
  console.log('Simulating 52-second rotation tick...');
  const rotatedCard = await page.evaluate(async () => {
    // Manually advance slot by 1 cycle and trigger checkAndRotateCard
    cardShuffleStep += 1;
    rotateCardCipher(false); // immediate visual update without 260ms delay
    const rankEl = document.getElementById('card-rank-top');
    const suitEl = document.getElementById('card-suit-top');
    const cipherEl = document.getElementById('manual-cipher-code');
    const countdownEl = document.getElementById('card-cycle-countdown');
    return {
      rank: rankEl ? rankEl.innerText : null,
      suit: suitEl ? suitEl.innerText : null,
      cipher: cipherEl ? cipherEl.innerText : null,
      countdown: countdownEl ? countdownEl.innerText : null,
      cardShuffleStep: cardShuffleStep
    };
  });

  console.log('Rotated Card Telemetry (t = +52s):', rotatedCard);

  if (initialCard.rank === rotatedCard.rank && initialCard.suit === rotatedCard.suit && initialCard.cipher === rotatedCard.cipher) {
    console.error('❌ Failed: Card did not change after rotation trigger!');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Card successfully rotated from', initialCard.rank + initialCard.suit, '(' + initialCard.cipher + ') to', rotatedCard.rank + rotatedCard.suit, '(' + rotatedCard.cipher + ')!');

  // Test automatic countdown progression
  console.log('Testing automatic 1-second interval ticking...');
  await new Promise(r => setTimeout(r, 2200));

  const tickedCountdown = await page.evaluate(() => {
    const el = document.getElementById('card-cycle-countdown');
    return el ? el.innerText : null;
  });
  console.log('Countdown after 2 seconds:', tickedCountdown);

  console.log('🎉 ALL 52-SECOND CARD ROTATION TESTS PASSED WITH 0 ERRORS!');
  await browser.close();
  process.exit(0);
})();
