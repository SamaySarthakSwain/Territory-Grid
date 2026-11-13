const fs = require('fs');

// Patch api/index.js
let apiCode = fs.readFileSync('api/index.js', 'utf8');

// Fix load() method in api/index.js to not overwrite valid in-memory collections with an empty or older file
apiCode = apiCode.replace(
  `  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.collections = parsed;
        }
      }
    } catch (e) {
      // keep defaults
    }
  }`,
  `  load() {
    try {
      if ((!this.collections.users || this.collections.users.length <= 1) && fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.collections = parsed;
        }
      }
    } catch (e) {}
  }`
);

// Ensure /api/admin/pending forces a fresh syncFromCloud(true)
apiCode = apiCode.replace(
  `if (pathname === '/api/admin/pending' && req.method === 'GET') {`,
  `if (pathname === '/api/admin/pending' && req.method === 'GET') {
      await memoryStore.syncFromCloud(true);`
);

// Ensure /api/auth/status forces syncFromCloud if user not immediately found
apiCode = apiCode.replace(
  `if (pathname === '/api/auth/status' && req.method === 'GET') {`,
  `if (pathname === '/api/auth/status' && req.method === 'GET') {
      await memoryStore.syncFromCloud(false);`
);

fs.writeFileSync('api/index.js', apiCode, 'utf8');
console.log('Patched api/index.js');

// Patch web_server/server.js
let serverCode = fs.readFileSync('web_server/server.js', 'utf8');

// Fix load() method in server.js
serverCode = serverCode.replace(
  `  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.collections = JSON.parse(raw);
        console.log('[MongoDB Engine] Loaded collections from persistent storage.');
      } catch (e) {
        console.error('[MongoDB Engine] Failed to parse DB file, initializing clean state.', e);
      }
    }
  }`,
  `  load() {
    if ((!this.collections.users || this.collections.users.length <= 1) && fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.collections = parsed;
          console.log('[MongoDB Engine] Loaded collections from persistent storage.');
        }
      } catch (e) {
        console.error('[MongoDB Engine] Failed to parse DB file, initializing clean state.', e);
      }
    }
  }`
);

// Ensure /api/admin/pending forces fresh syncFromCloud in server.js
serverCode = serverCode.replace(
  `if (pathname === '/api/admin/pending' && req.method === 'GET') {`,
  `if (pathname === '/api/admin/pending' && req.method === 'GET') {
        await db.syncFromCloud(true);`
);

// Ensure /api/auth/status syncs from cloud in server.js
serverCode = serverCode.replace(
  `if (pathname === '/api/auth/status' && req.method === 'GET') {`,
  `if (pathname === '/api/auth/status' && req.method === 'GET') {
        await db.syncFromCloud(false);`
);

// Ensure /api/auth/register awaits syncToCloud before returning in server.js
serverCode = serverCode.replace(
  `db.collections.users.push(newUser);\n        db.save();`,
  `db.collections.users.push(newUser);\n        await db.syncToCloud();`
);
serverCode = serverCode.replace(
  `db.collections.users.push(newUser);\r\n        db.save();`,
  `db.collections.users.push(newUser);\r\n        await db.syncToCloud();`
);

// Ensure /api/admin/approve awaits syncToCloud in server.js
serverCode = serverCode.replace(
  `if (approvedAny) {\n          db.save();`,
  `if (approvedAny) {\n          await db.syncToCloud();`
);
serverCode = serverCode.replace(
  `if (approvedAny) {\r\n          db.save();`,
  `if (approvedAny) {\r\n          await db.syncToCloud();`
);

fs.writeFileSync('web_server/server.js', serverCode, 'utf8');
console.log('Patched web_server/server.js');
