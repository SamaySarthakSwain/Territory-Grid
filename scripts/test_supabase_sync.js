const https = require('https');

const SUPABASE_URL = 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';

async function testFetch() {
  const url = `${SUPABASE_URL}/rest/v1/territory_store?key=eq.main_store&select=*`;
  console.log('Fetching from Supabase...');
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Cache-Control': 'no-cache'
    }
  });
  console.log('Fetch status:', res.status);
  const data = await res.json();
  console.log('Got rows:', data.length);
  if (data[0] && data[0].data) {
    console.log('Collections present:', Object.keys(data[0].data));
    console.log('Users count:', data[0].data.users.length);
    console.log('Clues count:', data[0].data.clues.length);
    console.log('Game state:', data[0].data.gameState);
  }
}

testFetch().catch(console.error);
