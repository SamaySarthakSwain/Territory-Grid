const fs = require('fs');
const path = require('path');

function updateServer() {
  const serverPath = path.join(__dirname, '..', 'web_server', 'server.js');
  let s = fs.readFileSync(serverPath, 'utf8');

  // 1. Update gameState defaults in constructor
  const oldConstructorGameState = `gameState: {
        status: 'LOBBY',
        startedAt: null,
        endedAt: null,
        pausedAt: null,
        totalPausedMs: 0
      },`;
  const newConstructorGameState = `gameState: {
        status: 'LOBBY',
        durationMinutes: 52,
        durationSeconds: 3120,
        startedAt: null,
        endsAt: null,
        countdownStartAt: null,
        countdownEndsAt: null,
        pausedAt: null,
        totalPausedMs: 0,
        endedAt: null
      },`;
  s = s.replace(oldConstructorGameState, newConstructorGameState);

  // 2. Update /api/game/state handler
  const oldHandler = `// 9. GET & POST /api/game/state
      if (pathname === '/api/game/state') {
        if (req.method === 'GET') {
          return sendJson(res, 200, { success: true, state: db.collections.gameState });
        }
        if (req.method === 'POST') {
          const body = await parseBody(req);
          if (body.status) {
            db.collections.gameState.status = body.status;
            if (body.status === 'PLAYER_PHASE' && !db.collections.gameState.startedAt) {
              db.collections.gameState.startedAt = new Date().toISOString();
            }
            if (body.status === 'ENDED') {
              db.collections.gameState.endedAt = new Date().toISOString();
            }
            db.save();
            db.logEvent('GAME_STATUS', \`Game status changed to \${body.status}\`);
          }
          return sendJson(res, 200, { success: true, state: db.collections.gameState });
        }
      }`;

  const newHandler = `// 9. GET & POST /api/game/state (Synchronized 52-Minute Hunt & 10-Second Countdown Engine)
      if (pathname === '/api/game/state') {
        db.load();
        const now = Date.now();
        const gs = db.collections.gameState || { status: 'LOBBY' };
        if (!gs.durationMinutes) gs.durationMinutes = 52;
        if (!gs.durationSeconds) gs.durationSeconds = gs.durationMinutes * 60;

        // Auto-advance: COUNTDOWN -> PLAYER_PHASE when 10s countdown ends
        if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
          const cdEnd = new Date(gs.countdownEndsAt).getTime();
          if (now >= cdEnd) {
            gs.status = 'PLAYER_PHASE';
            if (!gs.startedAt) gs.startedAt = new Date(cdEnd).toISOString();
            if (!gs.endsAt) gs.endsAt = new Date(cdEnd + gs.durationSeconds * 1000).toISOString();
            db.save();
            db.logEvent('GAME_STATUS', '10s Countdown completed! Game is now LIVE in PLAYER_PHASE (52 Minutes).');
          }
        }

        // Auto-end match when 52-minute duration expires
        if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
          const gameEnd = new Date(gs.endsAt).getTime();
          if (now >= gameEnd) {
            gs.status = 'ENDED';
            if (!gs.endedAt) gs.endedAt = new Date().toISOString();
            db.save();
            db.logEvent('GAME_STATUS', '52-Minute Hunt duration expired. Match concluded.');
          }
        }

        if (req.method === 'GET') {
          let remainingSeconds = gs.durationSeconds || 3120;
          let countdownSeconds = 0;

          if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
            countdownSeconds = Math.max(0, Math.ceil((new Date(gs.countdownEndsAt).getTime() - now) / 1000));
            remainingSeconds = gs.durationSeconds;
          } else if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
            remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - now) / 1000));
          } else if (gs.status === 'ENDED') {
            remainingSeconds = 0;
          } else if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
            remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - new Date(gs.pausedAt).getTime()) / 1000));
          }

          return sendJson(res, 200, {
            success: true,
            state: gs,
            serverTime: new Date(now).toISOString(),
            remainingSeconds: remainingSeconds,
            countdownSeconds: countdownSeconds,
            durationSeconds: gs.durationSeconds,
            durationMinutes: gs.durationMinutes
          });
        }

        if (req.method === 'POST') {
          const body = await parseBody(req);
          const reqStatus = body.status || body.action;

          if (reqStatus === 'START_COUNTDOWN' || reqStatus === 'COUNTDOWN') {
            const cdMs = (parseInt(body.countdownSeconds, 10) || 10) * 1000;
            const durMins = parseInt(body.durationMinutes, 10) || 52;
            const durSecs = durMins * 60;

            gs.status = 'COUNTDOWN';
            gs.durationMinutes = durMins;
            gs.durationSeconds = durSecs;
            gs.countdownStartAt = new Date(now).toISOString();
            gs.countdownEndsAt = new Date(now + cdMs).toISOString();
            gs.startedAt = new Date(now + cdMs).toISOString();
            gs.endsAt = new Date(now + cdMs + durSecs * 1000).toISOString();
            gs.pausedAt = null;
            gs.totalPausedMs = 0;
            gs.endedAt = null;

            db.save();
            db.logEvent('GAME_STATUS', \`Game Master initiated 10s countdown for \${durMins}-minute hunt.\`);
          } else if (reqStatus === 'START' || reqStatus === 'PLAYER_PHASE') {
            const durMins = parseInt(body.durationMinutes, 10) || 52;
            const durSecs = durMins * 60;

            gs.status = 'PLAYER_PHASE';
            gs.durationMinutes = durMins;
            gs.durationSeconds = durSecs;
            gs.countdownStartAt = null;
            gs.countdownEndsAt = null;
            gs.startedAt = new Date(now).toISOString();
            gs.endsAt = new Date(now + durSecs * 1000).toISOString();
            gs.pausedAt = null;
            gs.totalPausedMs = 0;
            gs.endedAt = null;

            db.save();
            db.logEvent('GAME_STATUS', \`Game Master started \${durMins}-minute hunt immediately.\`);
          } else if (reqStatus === 'PAUSE' || reqStatus === 'PAUSED') {
            if (gs.status === 'PLAYER_PHASE') {
              gs.status = 'PAUSED';
              gs.pausedAt = new Date(now).toISOString();
              db.save();
              db.logEvent('GAME_STATUS', 'Game Master paused hunt operations.');
            }
          } else if (reqStatus === 'RESUME') {
            if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
              const pauseDuration = now - new Date(gs.pausedAt).getTime();
              gs.totalPausedMs = (gs.totalPausedMs || 0) + pauseDuration;
              gs.endsAt = new Date(new Date(gs.endsAt).getTime() + pauseDuration).toISOString();
              gs.status = 'PLAYER_PHASE';
              gs.pausedAt = null;
              db.save();
              db.logEvent('GAME_STATUS', \`Game Master resumed hunt operations (extended by \${Math.round(pauseDuration/1000)}s).\`);
            }
          } else if (reqStatus === 'RESET' || reqStatus === 'LOBBY') {
            gs.status = 'LOBBY';
            gs.durationMinutes = 52;
            gs.durationSeconds = 52 * 60;
            gs.startedAt = null;
            gs.endsAt = null;
            gs.countdownStartAt = null;
            gs.countdownEndsAt = null;
            gs.pausedAt = null;
            gs.totalPausedMs = 0;
            gs.endedAt = null;

            db.save();
            db.logEvent('GAME_STATUS', 'Game Master reset game state to LOBBY standby.');
          } else if (reqStatus === 'ENDED') {
            gs.status = 'ENDED';
            gs.endedAt = new Date(now).toISOString();
            db.save();
            db.logEvent('GAME_STATUS', 'Game Master ended the match.');
          }

          let remainingSeconds = gs.durationSeconds || 3120;
          let countdownSeconds = 0;
          if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
            countdownSeconds = Math.max(0, Math.ceil((new Date(gs.countdownEndsAt).getTime() - now) / 1000));
          } else if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
            remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - now) / 1000));
          } else if (gs.status === 'ENDED') {
            remainingSeconds = 0;
          }

          return sendJson(res, 200, {
            success: true,
            state: gs,
            serverTime: new Date(now).toISOString(),
            remainingSeconds: remainingSeconds,
            countdownSeconds: countdownSeconds,
            durationSeconds: gs.durationSeconds,
            durationMinutes: gs.durationMinutes
          });
        }
      }`;

  s = s.replace(oldHandler, newHandler);
  fs.writeFileSync(serverPath, s, 'utf8');
  console.log('Updated server.js');

  // Now update api/index.js
  const apiPath = path.join(__dirname, '..', 'api', 'index.js');
  let a = fs.readFileSync(apiPath, 'utf8');

  a = a.replace(oldConstructorGameState, newConstructorGameState);

  const oldApiHandler = `// 9. GET & POST /api/game/state
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/game/state') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, state: memoryStore.collections.gameState });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (body.status) {
          memoryStore.collections.gameState.status = body.status;
          if (body.status === 'PLAYER_PHASE' && !memoryStore.collections.gameState.startedAt) {
            memoryStore.collections.gameState.startedAt = new Date().toISOString();
          }
          if (body.status === 'ENDED') {
            memoryStore.collections.gameState.endedAt = new Date().toISOString();
          }
          memoryStore.save();
        }
        return sendJson(res, 200, { success: true, state: memoryStore.collections.gameState });
      }
    }`;

  const newApiHandler = `// 9. GET & POST /api/game/state (Synchronized 52-Minute Hunt & 10-Second Countdown Engine)
    // ─────────────────────────────────────────────────────────
    if (pathname === '/api/game/state') {
      memoryStore.load();
      const now = Date.now();
      const gs = memoryStore.collections.gameState || { status: 'LOBBY' };
      if (!gs.durationMinutes) gs.durationMinutes = 52;
      if (!gs.durationSeconds) gs.durationSeconds = gs.durationMinutes * 60;

      // Auto-advance COUNTDOWN -> PLAYER_PHASE
      if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
        const cdEnd = new Date(gs.countdownEndsAt).getTime();
        if (now >= cdEnd) {
          gs.status = 'PLAYER_PHASE';
          if (!gs.startedAt) gs.startedAt = new Date(cdEnd).toISOString();
          if (!gs.endsAt) gs.endsAt = new Date(cdEnd + gs.durationSeconds * 1000).toISOString();
          memoryStore.save();
        }
      }

      // Auto-end match when 52 minutes expire
      if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
        const gameEnd = new Date(gs.endsAt).getTime();
        if (now >= gameEnd) {
          gs.status = 'ENDED';
          if (!gs.endedAt) gs.endedAt = new Date().toISOString();
          memoryStore.save();
        }
      }

      if (req.method === 'GET') {
        let remainingSeconds = gs.durationSeconds || 3120;
        let countdownSeconds = 0;

        if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
          countdownSeconds = Math.max(0, Math.ceil((new Date(gs.countdownEndsAt).getTime() - now) / 1000));
          remainingSeconds = gs.durationSeconds;
        } else if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
          remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - now) / 1000));
        } else if (gs.status === 'ENDED') {
          remainingSeconds = 0;
        } else if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
          remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - new Date(gs.pausedAt).getTime()) / 1000));
        }

        return sendJson(res, 200, {
          success: true,
          state: gs,
          serverTime: new Date(now).toISOString(),
          remainingSeconds: remainingSeconds,
          countdownSeconds: countdownSeconds,
          durationSeconds: gs.durationSeconds,
          durationMinutes: gs.durationMinutes
        });
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const reqStatus = body.status || body.action;

        if (reqStatus === 'START_COUNTDOWN' || reqStatus === 'COUNTDOWN') {
          const cdMs = (parseInt(body.countdownSeconds, 10) || 10) * 1000;
          const durMins = parseInt(body.durationMinutes, 10) || 52;
          const durSecs = durMins * 60;

          gs.status = 'COUNTDOWN';
          gs.durationMinutes = durMins;
          gs.durationSeconds = durSecs;
          gs.countdownStartAt = new Date(now).toISOString();
          gs.countdownEndsAt = new Date(now + cdMs).toISOString();
          gs.startedAt = new Date(now + cdMs).toISOString();
          gs.endsAt = new Date(now + cdMs + durSecs * 1000).toISOString();
          gs.pausedAt = null;
          gs.totalPausedMs = 0;
          gs.endedAt = null;

          memoryStore.save();
        } else if (reqStatus === 'START' || reqStatus === 'PLAYER_PHASE') {
          const durMins = parseInt(body.durationMinutes, 10) || 52;
          const durSecs = durMins * 60;

          gs.status = 'PLAYER_PHASE';
          gs.durationMinutes = durMins;
          gs.durationSeconds = durSecs;
          gs.countdownStartAt = null;
          gs.countdownEndsAt = null;
          gs.startedAt = new Date(now).toISOString();
          gs.endsAt = new Date(now + durSecs * 1000).toISOString();
          gs.pausedAt = null;
          gs.totalPausedMs = 0;
          gs.endedAt = null;

          memoryStore.save();
        } else if (reqStatus === 'PAUSE' || reqStatus === 'PAUSED') {
          if (gs.status === 'PLAYER_PHASE') {
            gs.status = 'PAUSED';
            gs.pausedAt = new Date(now).toISOString();
            memoryStore.save();
          }
        } else if (reqStatus === 'RESUME') {
          if (gs.status === 'PAUSED' && gs.pausedAt && gs.endsAt) {
            const pauseDuration = now - new Date(gs.pausedAt).getTime();
            gs.totalPausedMs = (gs.totalPausedMs || 0) + pauseDuration;
            gs.endsAt = new Date(new Date(gs.endsAt).getTime() + pauseDuration).toISOString();
            gs.status = 'PLAYER_PHASE';
            gs.pausedAt = null;
            memoryStore.save();
          }
        } else if (reqStatus === 'RESET' || reqStatus === 'LOBBY') {
          gs.status = 'LOBBY';
          gs.durationMinutes = 52;
          gs.durationSeconds = 52 * 60;
          gs.startedAt = null;
          gs.endsAt = null;
          gs.countdownStartAt = null;
          gs.countdownEndsAt = null;
          gs.pausedAt = null;
          gs.totalPausedMs = 0;
          gs.endedAt = null;

          memoryStore.save();
        } else if (reqStatus === 'ENDED') {
          gs.status = 'ENDED';
          gs.endedAt = new Date(now).toISOString();
          memoryStore.save();
        }

        let remainingSeconds = gs.durationSeconds || 3120;
        let countdownSeconds = 0;
        if (gs.status === 'COUNTDOWN' && gs.countdownEndsAt) {
          countdownSeconds = Math.max(0, Math.ceil((new Date(gs.countdownEndsAt).getTime() - now) / 1000));
        } else if (gs.status === 'PLAYER_PHASE' && gs.endsAt) {
          remainingSeconds = Math.max(0, Math.floor((new Date(gs.endsAt).getTime() - now) / 1000));
        } else if (gs.status === 'ENDED') {
          remainingSeconds = 0;
        }

        return sendJson(res, 200, {
          success: true,
          state: gs,
          serverTime: new Date(now).toISOString(),
          remainingSeconds: remainingSeconds,
          countdownSeconds: countdownSeconds,
          durationSeconds: gs.durationSeconds,
          durationMinutes: gs.durationMinutes
        });
      }
    }`;

  a = a.replace(oldApiHandler, newApiHandler);
  fs.writeFileSync(apiPath, a, 'utf8');
  console.log('Updated api/index.js');
}

updateServer();
