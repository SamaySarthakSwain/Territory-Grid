const SUPABASE_URL = 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';

class CloudBackedStore {
  constructor() {
    this.collections = {
      users: [],
      teams: [],
      clues: [],
      checkins: [],
      gameState: {},
      system_logs: []
    };
    this.lastSynced = 0;
  }

  async loadFromCloud() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/territory_store?key=eq.main_store&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (!res.ok) {
        console.error('Fetch failed with status', res.status);
        return false;
      }
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].data) {
        this.collections = rows[0].data;
        this.lastSynced = Date.now();
        return true;
      }
    } catch (e) {
      console.error('Error loading from cloud:', e.message);
    }
    return false;
  }

  async saveToCloud() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/territory_store`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: 'main_store',
          data: this.collections,
          updated_at: new Date().toISOString()
        })
      });
      return res.ok;
    } catch (e) {
      console.error('Error saving to cloud:', e.message);
      return false;
    }
  }
}

async function runTest() {
  const store = new CloudBackedStore();
  const startLoad = Date.now();
  await store.loadFromCloud();
  console.log(`Loaded in ${Date.now() - startLoad}ms. Users count: ${store.collections.users.length}`);

  // Simulate mobile registration
  const testId = 'test_marshal_' + Date.now();
  store.collections.users.push({
    _id: testId,
    callsign: 'test_marshal',
    name: 'Field Marshal Test',
    role: 'MEMBER',
    isApproved: false,
    createdAt: new Date().toISOString()
  });

  const startSave = Date.now();
  const saved = await store.saveToCloud();
  console.log(`Saved in ${Date.now() - startSave}ms. Success: ${saved}`);

  // Simulate another instance loading
  const store2 = new CloudBackedStore();
  await store2.loadFromCloud();
  const found = store2.collections.users.find(u => u._id === testId);
  console.log('Instance 2 found registered user:', !!found, found ? found.name : 'null');

  // Simulate admin approving
  if (found) {
    found.isApproved = true;
    await store2.saveToCloud();
  }

  // Simulate mobile checking approval
  const store3 = new CloudBackedStore();
  await store3.loadFromCloud();
  const verifiedUser = store3.collections.users.find(u => u._id === testId);
  console.log('Mobile device sees approved status:', verifiedUser ? verifiedUser.isApproved : false);

  // Clean up test user
  store3.collections.users = store3.collections.users.filter(u => u._id !== testId);
  await store3.saveToCloud();
  console.log('Cleaned up test user.');
}

runTest().catch(console.error);
