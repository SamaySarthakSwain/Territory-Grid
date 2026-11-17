const url = "https://gfuufzlxskuratvqguof.supabase.co/rest/v1/territory_store?key=eq.main_store&select=*";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8";
const t0 = Date.now();
fetch(url, { headers: { apikey: anon, Authorization: "Bearer " + anon } })
  .then(r => r.json())
  .then(d => {
    console.log("Supabase fetch ok:", d.length, "rows in", Date.now() - t0, "ms");
    if (d[0] && d[0].data) {
      console.log("Users:", (d[0].data.users || []).length);
      console.log("Teams:", (d[0].data.teams || []).length);
      console.log("Clues:", (d[0].data.clues || []).length);
      console.log("Checkins:", (d[0].data.checkins || []).length);
    }
  })
  .catch(e => console.error("Supabase fetch failed:", e.message));
