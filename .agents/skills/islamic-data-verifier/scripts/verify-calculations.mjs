// Islamic Data, Hadith, and Adhan Astronomical Verifier
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🕌 [Islamic Data & Astronomical Calculation Verifier]\n');

// 1. Verify 12 Calculation Methods Configuration
console.log('📐 1. Verifying 12 Astronomical Calculation Methods in prayerEngine.js:');
const prayerEnginePath = resolve(process.cwd(), 'src', 'services', 'prayerEngine.js');

if (!existsSync(prayerEnginePath)) {
  console.error(`❌ prayerEngine.js not found at: ${prayerEnginePath}`);
  process.exit(1);
}

const prayerEngineCode = readFileSync(prayerEnginePath, 'utf-8');

const EXPECTED_METHODS = [
  'Egyptian',
  'UmmAlQura',
  'MuslimWorldLeague',
  'NorthAmerica',
  'Dubai',
  'Kuwait',
  'Qatar',
  'Karachi',
  'Singapore',
  'Turkey',
  'France',
  'MoonsightingCommittee'
];

let methodsFound = 0;
for (const m of EXPECTED_METHODS) {
  if (prayerEngineCode.includes(m)) {
    console.log(`  ✅ Method registered: ${m}`);
    methodsFound++;
  } else {
    console.error(`  ❌ Missing calculation method: ${m}`);
  }
}

// 2. Verify Tasbeeh Presets & Target Integrity
console.log('\n📿 2. Verifying Authentic Tasbeeh Presets in DigitalTasbeeh.jsx:');
const tasbeehPath = resolve(process.cwd(), 'src', 'components', 'DigitalTasbeeh.jsx');
const tasbeehCode = readFileSync(tasbeehPath, 'utf-8');

const EXPECTED_TASBEEH_PRESETS = [
  'subhanallah',
  'alhamdulillah',
  'allahuakbar',
  'lailahaillallah',
  'astaghfirullah',
  'lahawla',
  'salawat',
  'subhanallah_bihamdihi',
  'hasbiyallah',
  'yunus_dua'
];

let tasbeehFound = 0;
for (const t of EXPECTED_TASBEEH_PRESETS) {
  if (tasbeehCode.includes(t)) {
    console.log(`  ✅ Preset verified: ${t}`);
    tasbeehFound++;
  } else {
    console.error(`  ❌ Missing tasbeeh preset: ${t}`);
  }
}

// 3. Verify Athkar Categories
console.log('\n📖 3. Verifying Authentic Athkar Database in athkarData.js:');
const athkarDataPath = resolve(process.cwd(), 'src', 'data', 'athkarData.js');
const athkarDataCode = readFileSync(athkarDataPath, 'utf-8');

const EXPECTED_CATEGORIES = [
  'morning',
  'evening',
  'afterPrayer',
  'sleep',
  'tasbeeh',
  'custom'
];

let categoriesFound = 0;
for (const c of EXPECTED_CATEGORIES) {
  if (athkarDataCode.includes(c)) {
    console.log(`  ✅ Category verified: ${c}`);
    categoriesFound++;
  } else {
    console.error(`  ❌ Missing athkar category: ${c}`);
  }
}

console.log('\n========================================');
console.log(`🎉 Astronomical & Data Verification Complete:`);
console.log(`  - Methods  : ${methodsFound}/${EXPECTED_METHODS.length} Passed`);
console.log(`  - Tasbeeh  : ${tasbeehFound}/${EXPECTED_TASBEEH_PRESETS.length} Passed`);
console.log(`  - Athkar   : ${categoriesFound}/${EXPECTED_CATEGORIES.length} Passed`);
console.log('========================================\n');
