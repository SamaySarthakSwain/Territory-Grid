const { getBalancedMarshalAllocation, INITIAL_CAMPUS_PLACES, CONE_OPTIONS } = require('../api/index.js');

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║   TEST: PLACES INTEGRITY & BALANCED MARSHAL ALLOCATION ENGINE       ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

// 1. Initial places verification
console.log('⚡ [CHECK 1] Verifying canonical initial places...');
console.log(`Initial places count: ${INITIAL_CAMPUS_PLACES.length}`);
INITIAL_CAMPUS_PLACES.forEach(p => console.log(`  - ${p.zoneLabel} (${p.zoneId}): ${p.text}`));
if (INITIAL_CAMPUS_PLACES.length !== 3) {
  throw new Error(`Expected exactly 3 initial places, got ${INITIAL_CAMPUS_PLACES.length}`);
}

// 2. Balanced & distinct allocation for 3 marshals (M <= P)
console.log('\n⚡ [CHECK 2] Testing 3 marshals across 3 places (must have strictly distinct locations)...');
let marshals = [];
for (let i = 1; i <= 3; i++) {
  const alloc = getBalancedMarshalAllocation(marshals, INITIAL_CAMPUS_PLACES, 'AUTO', 'AUTO');
  marshals.push({ callsign: `marshal_${i}`, isApproved: true, zoneId: alloc.zoneId, coneColor: alloc.coneColor });
  console.log(`  Marshal ${i} -> Area: ${alloc.zoneId}, Cone: ${alloc.coneColor} (${alloc.conePoints} pts)`);
}

const assignedZones3 = new Set(marshals.map(m => m.zoneId));
const assignedColors3 = new Set(marshals.map(m => m.coneColor));
console.log(`Unique zones assigned: ${assignedZones3.size}/3, Unique colors: ${assignedColors3.size}/3`);
if (assignedZones3.size !== 3) throw new Error('Marshals 1..3 should have 3 completely distinct locations!');
if (assignedColors3.size !== 3) throw new Error('Marshals 1..3 should have 3 completely distinct cone colours!');

// 3. Balanced allocation for 12 marshals across 3 places (M > P)
console.log('\n⚡ [CHECK 3] Testing 12 marshals across 3 places (must be equally distributed 4-4-4 and 4-4-4 colors)...');
marshals = [];
for (let i = 1; i <= 12; i++) {
  const alloc = getBalancedMarshalAllocation(marshals, INITIAL_CAMPUS_PLACES, 'AUTO', 'AUTO');
  marshals.push({ callsign: `marshal_${i}`, isApproved: true, zoneId: alloc.zoneId, coneColor: alloc.coneColor });
}
const zoneCounts = {};
const colorCounts = {};
marshals.forEach(m => {
  zoneCounts[m.zoneId] = (zoneCounts[m.zoneId] || 0) + 1;
  colorCounts[m.coneColor] = (colorCounts[m.coneColor] || 0) + 1;
});
console.log('Zone Distribution across 12 marshals:', zoneCounts);
console.log('Color Distribution across 12 marshals:', colorCounts);

const allZonesFour = Object.values(zoneCounts).every(c => c === 4);
const allColorsFour = Object.values(colorCounts).every(c => c === 4);
if (!allZonesFour) throw new Error('Zone distribution across 12 marshals is not equally 4 each!');
if (!allColorsFour) throw new Error('Color distribution across 12 marshals is not equally 4 each!');

console.log('\n🎉 ALL ALLOCATION CHECKS PASSED WITH 100% MATHEMATICAL UNIFORMITY & DISTINCTNESS!');
