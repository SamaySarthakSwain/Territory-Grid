const fs = require('fs');

let code = fs.readFileSync('web_server/server.js', 'utf8');

// 1. Add Supabase constants near top if not present
if (!code.includes('SUPABASE_URL')) {
  code = code.replace(
    "const DB_FILE = path.join(DATA_DIR, 'territory_grid_mongodb.json');",
    `const DB_FILE = path.join(DATA_DIR, 'territory_grid_mongodb.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';`
  );
}

// 2. Add lastSynced and cloud sync methods to MongoDatabase
if (!code.includes('syncFromCloud')) {
  const saveMethodTarget = `  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {
      console.error('[MongoDB Engine] Failed to save DB file:', e);
    }
  }`;

  const saveMethodTargetCRLF = `  save() {\r\n    try {\r\n      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');\r\n    } catch (e) {\r\n      console.error('[MongoDB Engine] Failed to save DB file:', e);\r\n    }\r\n  }`;

  const newSaveAndSync = `  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {
      console.error('[MongoDB Engine] Failed to save DB file:', e);
    }
    this.syncToCloud().catch(() => {});
  }

  async syncFromCloud(force = false) {
    const now = Date.now();
    if (!this.lastSynced) this.lastSynced = 0;
    if (!force && (now - this.lastSynced < 800) && Array.isArray(this.collections.users) && this.collections.users.length > 0) {
      return this.collections;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(\`\${SUPABASE_URL}/rest/v1/territory_store?key=eq.main_store&select=*\`, {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': \`Bearer \${SUPABASE_ANON}\`,
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data) {
          this.collections = rows[0].data;
          this.lastSynced = Date.now();
          this.ensureDefaults();
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
          } catch(e){}
          return this.collections;
        }
      }
    } catch(e) {}
    this.load();
    return this.collections;
  }

  async syncToCloud() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      await fetch(\`\${SUPABASE_URL}/rest/v1/territory_store\`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': \`Bearer \${SUPABASE_ANON}\`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'main_store',
          data: this.collections,
          updated_at: new Date().toISOString()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.lastSynced = Date.now();
    } catch(e){}
  }`;

  if (code.includes(saveMethodTarget)) {
    code = code.replace(saveMethodTarget, newSaveAndSync);
    console.log('Replaced save with save + sync in server.js');
  } else if (code.includes(saveMethodTargetCRLF)) {
    code = code.replace(saveMethodTargetCRLF, newSaveAndSync);
    console.log('Replaced save with save + sync in server.js (CRLF)');
  } else {
    console.error('Could not find saveMethodTarget in server.js');
  }
}

// 3. Add db.syncFromCloud to API route dispatcher
if (!code.includes('await db.syncFromCloud(')) {
  const apiDispatchTarget = "  if (pathname.startsWith('/api/')) {";
  const apiDispatchTargetCRLF = "  if (pathname.startsWith('/api/')) {\r\n";
  const newDispatch = `  if (pathname.startsWith('/api/')) {
    const isWrite = req.method !== 'GET' && req.method !== 'HEAD';
    await db.syncFromCloud(isWrite);`;

  if (code.includes(apiDispatchTargetCRLF)) {
    code = code.replace(apiDispatchTargetCRLF, newDispatch + '\r\n');
    console.log('Added db.syncFromCloud to server.js dispatcher (CRLF)');
  } else if (code.includes(apiDispatchTarget)) {
    code = code.replace(apiDispatchTarget, newDispatch + '\n');
    console.log('Added db.syncFromCloud to server.js dispatcher');
  } else {
    console.error('Could not find apiDispatchTarget in server.js');
  }
}

fs.writeFileSync('web_server/server.js', code, 'utf8');
console.log('web_server/server.js patched successfully!');
