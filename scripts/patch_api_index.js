const fs = require('fs');

let code = fs.readFileSync('api/index.js', 'utf8');

// 1. Add Supabase config and CloudBacked MemoryStore
const oldMemStoreStart = '// In-Memory / File-based Document Engine (Fallback Mode)\r\n// ─────────────────────────────────────────────────────────────\r\nclass MemoryStore {';
const oldMemStoreStartLF = '// In-Memory / File-based Document Engine (Fallback Mode)\n// ─────────────────────────────────────────────────────────────\nclass MemoryStore {';

const newMemStore = `// Supabase Real-Time Cloud Store Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';

// ─────────────────────────────────────────────────────────────
// Cloud-Backed Persistent Document Engine (Zero Data Loss)
// ─────────────────────────────────────────────────────────────
class MemoryStore {
  constructor() {
    this.filePath = process.env.VERCEL ? '/tmp/territory_grid_mongodb.json' : path.join(__dirname, '..', 'web_server', 'data', 'territory_grid_mongodb.json');
    this.collections = {
      users: [DEFAULT_ADMIN],
      teams: [],
      clues: DEFAULT_CLUES,
      checkins: [],
      gameState: {
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
      },
      system_logs: [
        {
          _id: 'log_init',
          action: 'SYSTEM_INIT',
          details: 'Territory Grid Cloud Engine active.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    this.lastSynced = 0;
    this.load();
  }

  load() {
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
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {
      // ignore in read-only environments
    }
    // Asynchronously push to Supabase cloud store
    this.syncToCloud().catch(err => console.warn('[CloudStore background save warning]:', err.message));
  }

  async syncFromCloud(force = false) {
    const now = Date.now();
    // Use fast in-memory cache for GET polls within 600ms
    if (!force && (now - this.lastSynced < 600) && Array.isArray(this.collections.users) && this.collections.users.length > 0) {
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
          // Write to local cache
          try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
          } catch(e){}
          return this.collections;
        }
      }
    } catch (e) {
      console.warn('[CloudStore syncFromCloud]:', e.message);
    }
    this.load();
    return this.collections;
  }

  async syncToCloud() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.collections, null, 2), 'utf8');
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(\`\${SUPABASE_URL}/rest/v1/territory_store\`, {
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
      return res.ok;
    } catch (e) {
      console.warn('[CloudStore syncToCloud]:', e.message);
      return false;
    }
  }

  logEvent(action, details) {
    if (!Array.isArray(this.collections.system_logs)) {
      this.collections.system_logs = [];
    }
    this.collections.system_logs.unshift({
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (this.collections.system_logs.length > 300) this.collections.system_logs.pop();
    this.save();
  }
}`;

// Replace MemoryStore class
const memStoreRegex = /\/\/ In-Memory \/ File-based Document Engine[\s\S]*?const memoryStore = new MemoryStore\(\);/;
if (memStoreRegex.test(code)) {
  code = code.replace(memStoreRegex, newMemStore + '\n\nconst memoryStore = new MemoryStore();');
  console.log('Successfully replaced MemoryStore with CloudBackedStore!');
} else {
  console.error('Could not find MemoryStore block using regex');
}

// 2. Add cloud sync call at handler entry
const handlerEntryRegex = /(module\.exports\s*=\s*async\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{[\s\S]*?const parsedUrl = url\.parse\(req\.url, true\);[\s\S]*?let pathname = parsedUrl\.pathname \|\| '\/';[\s\S]*?if \(!pathname\.startsWith\('\/api'\)\) \{[\s\S]*?pathname = '\/api' \+ \(pathname\.startsWith\('\/'\) \? '' : '\/'\) \+ pathname;[\s\S]*?\})/;

const newSyncLine = `\n\n  // Sync fresh state from Supabase Cloud Store\n  const isWrite = req.method !== 'GET' && req.method !== 'HEAD';\n  await memoryStore.syncFromCloud(isWrite);`;

if (code.includes('await memoryStore.syncFromCloud(')) {
  console.log('Handler already has syncFromCloud');
} else {
  const targetStr = "pathname = '/api' + (pathname.startsWith('/') ? '' : '/') + pathname;\n  }";
  if (code.includes(targetStr)) {
    code = code.replace(targetStr, targetStr + newSyncLine);
    console.log('Added syncFromCloud to handler entry!');
  } else {
    // Try CRLF
    const targetStrCRLF = "pathname = '/api' + (pathname.startsWith('/') ? '' : '/') + pathname;\r\n  }";
    if (code.includes(targetStrCRLF)) {
      code = code.replace(targetStrCRLF, targetStrCRLF + newSyncLine);
      console.log('Added syncFromCloud to handler entry (CRLF)!');
    } else {
      console.error('Could not find pathname normalization target in handler');
    }
  }
}

// 3. Ensure memoryStore.syncToCloud() is called at key mutation points:
// a) After registration
code = code.replace(
  "memoryStore.collections.users.push(newUser);\n      memoryStore.save();",
  "memoryStore.collections.users.push(newUser);\n      await memoryStore.syncToCloud();"
);
code = code.replace(
  "memoryStore.collections.users.push(newUser);\r\n      memoryStore.save();",
  "memoryStore.collections.users.push(newUser);\r\n      await memoryStore.syncToCloud();"
);

// b) After approve
code = code.replace(
  "if (approvedAny) {\n        memoryStore.save();",
  "if (approvedAny) {\n        await memoryStore.syncToCloud();"
);
code = code.replace(
  "if (approvedAny) {\r\n        memoryStore.save();",
  "if (approvedAny) {\r\n        await memoryStore.syncToCloud();"
);

fs.writeFileSync('api/index.js', code, 'utf8');
console.log('api/index.js updated successfully!');
