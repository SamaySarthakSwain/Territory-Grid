const SUPABASE_URL = 'https://gfuufzlxskuratvqguof.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXVmemx4c2t1cmF0dnFndW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc5NzcsImV4cCI6MjA4NjczMzk3N30.jVCPESQvxOO9ExUTzyNZGyn8kBob4rj3aOZcxC2NLs8';

const STATIONS = [
  { _id: 'clue_zone_01', zoneId: 'ZONE_01', zoneLabel: 'Zone 1 - Library Arch', text: 'Search the Library Arch perimeter for the Beacon Cone!' },
  { _id: 'clue_zone_02', zoneId: 'ZONE_02', zoneLabel: 'Zone 2 - Solar Obelisk', text: 'Locate the Solar Obelisk plaza to find the Beacon Cone!' },
  { _id: 'clue_zone_03', zoneId: 'ZONE_03', zoneLabel: 'Zone 3 - Clocktower Terrace', text: 'Proceed to Clocktower Terrace and verify the Beacon Cone!' },
  { _id: 'clue_zone_04', zoneId: 'ZONE_04', zoneLabel: 'Zone 4 - Glasshouse Botanical', text: 'Investigate the Glasshouse Botanical grounds for the Beacon Cone!' },
  { _id: 'clue_zone_05', zoneId: 'ZONE_05', zoneLabel: 'Zone 5 - Skybridge Concourse', text: 'Cross to Skybridge Concourse and identify the Beacon Cone!' },
  { _id: 'clue_zone_06', zoneId: 'ZONE_06', zoneLabel: 'Zone 6 - Amphitheater Canopy', text: 'Search beneath Amphitheater Canopy for the Beacon Cone!' },
  { _id: 'clue_zone_07', zoneId: 'ZONE_07', zoneLabel: 'Zone 7 - Science Basin', text: 'Explore the Science Basin quad for the active Beacon Cone!' },
  { _id: 'clue_zone_08', zoneId: 'ZONE_08', zoneLabel: 'Zone 8 - Student Pavilion', text: 'Check the Student Pavilion perimeter for the Beacon Cone!' },
  { _id: 'clue_zone_09', zoneId: 'ZONE_09', zoneLabel: 'Zone 9 - North Telecom Pylon', text: 'Navigate to North Telecom Pylon to locate the Beacon Cone!' },
  { _id: 'clue_zone_10', zoneId: 'ZONE_10', zoneLabel: 'Zone 10 - Turf Perimeter', text: 'Inspect the Turf Perimeter boundaries for the Beacon Cone!' },
  { _id: 'clue_zone_11', zoneId: 'ZONE_11', zoneLabel: 'Zone 11 - Energy Innovation Hub', text: 'Enter Energy Innovation Hub forecourt to find the Beacon Cone!' },
  { _id: 'clue_zone_12', zoneId: 'ZONE_12', zoneLabel: 'Zone 12 - Innovation Arena', text: 'Advance to Innovation Arena entrance and secure the Beacon Cone!' }
];

async function seed12Stations() {
  const getRes = await fetch(`${SUPABASE_URL}/rest/v1/territory_store?key=eq.main_store&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const rows = await getRes.json();
  const current = (rows && rows[0] && rows[0].data) || {};
  current.clues = STATIONS;
  
  const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/territory_store`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      key: 'main_store',
      data: current,
      updated_at: new Date().toISOString()
    })
  });
  console.log('Seeded 12 stations to Supabase:', saveRes.ok);
}

seed12Stations().catch(console.error);
