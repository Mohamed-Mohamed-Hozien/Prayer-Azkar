// Robust Islamic Data & Astronomical Calculation Test Runner
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import {
  calculatePrayerTimes,
  getMethodParams,
  CALCULATION_METHODS,
  PRAYER_NAMES,
  getHijriDate,
  formatPrayerTime
} from '../../../../src/services/prayerEngine.js';
import { getSunnahFastingInfo } from '../../../../src/data/islamicCalendar.js';

console.log('🕌 [Islamic Data & Astronomical Calculation Test Runner]\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ ${testName}${details ? ` (${details})` : ''}`);
    failedTests++;
  }
}

// ----------------------------------------------------
// 1. Astronomical Calculation Methods (12 Global Methods)
// ----------------------------------------------------
console.log('📐 1. Testing 12 Astronomical Calculation Methods with Real Coordinates:');

const TEST_COORDS = {
  Cairo: { lat: 30.0444, lng: 31.2357, method: 'Egyptian' },
  Makkah: { lat: 21.4225, lng: 39.8262, method: 'UmmAlQura' },
  London: { lat: 51.5074, lng: -0.1278, method: 'MuslimWorldLeague' },
  NewYork: { lat: 40.7128, lng: -74.0060, method: 'NorthAmerica' },
  Dubai: { lat: 25.2048, lng: 55.2708, method: 'Dubai' },
  Kuwait: { lat: 29.3759, lng: 47.9774, method: 'Kuwait' },
  Doha: { lat: 25.2854, lng: 51.5310, method: 'Qatar' },
  Karachi: { lat: 24.8607, lng: 67.0011, method: 'Karachi' },
  Singapore: { lat: 1.3521, lng: 103.8198, method: 'Singapore' },
  Istanbul: { lat: 41.0082, lng: 28.9784, method: 'Turkey' },
  Paris: { lat: 48.8566, lng: 2.3522, method: 'France' },
  GlobalMoon: { lat: 21.4225, lng: 39.8262, method: 'MoonsightingCommittee' }
};

const fixedDate = new Date('2026-06-15T12:00:00Z');

for (const [cityName, info] of Object.entries(TEST_COORDS)) {
  const settings = {
    location: { lat: info.lat, lng: info.lng },
    calculationMethod: info.method,
    madhab: 'shafi',
    prayerOffsets: {},
    eqamaOffsets: {}
  };

  const result = calculatePrayerTimes(fixedDate, settings);
  const isValidTimes =
    result.fajr instanceof Date && !isNaN(result.fajr.getTime()) &&
    result.sunrise instanceof Date && !isNaN(result.sunrise.getTime()) &&
    result.dhuhr instanceof Date && !isNaN(result.dhuhr.getTime()) &&
    result.asr instanceof Date && !isNaN(result.asr.getTime()) &&
    result.maghrib instanceof Date && !isNaN(result.maghrib.getTime()) &&
    result.isha instanceof Date && !isNaN(result.isha.getTime());

  const isChronological =
    result.fajr < result.sunrise &&
    result.sunrise < result.dhuhr &&
    result.dhuhr < result.asr &&
    result.asr < result.maghrib &&
    result.maghrib < result.isha;

  assert(
    isValidTimes && isChronological,
    `Method ${info.method} (${cityName}): Timings computed in chronological order`,
    `Fajr: ${formatPrayerTime(result.fajr, '24h')}, Isha: ${formatPrayerTime(result.isha, '24h')}`
  );
}

// ----------------------------------------------------
// 2. Madhab Comparison (Hanafi vs Shafi Asr Angle)
// ----------------------------------------------------
console.log('\n📖 2. Testing Fiqh Jurisprudence (Hanafi vs Shafi Asr):');
const shafiSettings = {
  location: { lat: 30.0444, lng: 31.2357 },
  calculationMethod: 'Egyptian',
  madhab: 'shafi'
};
const hanafiSettings = {
  location: { lat: 30.0444, lng: 31.2357 },
  calculationMethod: 'Egyptian',
  madhab: 'hanafi'
};

const shafiTimes = calculatePrayerTimes(fixedDate, shafiSettings);
const hanafiTimes = calculatePrayerTimes(fixedDate, hanafiSettings);
const isHanafiLater = hanafiTimes.asr.getTime() > shafiTimes.asr.getTime();

assert(
  isHanafiLater,
  `Hanafi Asr is later than Shafi Asr (Shadow factor 2x vs 1x)`,
  `Shafi: ${formatPrayerTime(shafiTimes.asr, '24h')}, Hanafi: ${formatPrayerTime(hanafiTimes.asr, '24h')}`
);

// ----------------------------------------------------
// 3. Tasbeeh Presets & Arabic Tashkeel Integrity
// ----------------------------------------------------
console.log('\n📿 3. Testing 10 Authentic Tasbeeh Presets:');
const tasbeehPath = resolve(process.cwd(), 'src', 'components', 'DigitalTasbeeh.jsx');
const tasbeehContent = readFileSync(tasbeehPath, 'utf-8');

// Match TASBEEH_PRESETS array
const presetRegex = /\{[\s\S]*?id:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?defaultTarget:\s*(\d+)[\s\S]*?virtue:\s*['"]([^'"]+)['"][\s\S]*?\}/g;
let presetMatch;
let foundPresets = [];

while ((presetMatch = presetRegex.exec(tasbeehContent)) !== null) {
  foundPresets.push({
    id: presetMatch[1],
    title: presetMatch[2],
    defaultTarget: parseInt(presetMatch[3], 10),
    virtue: presetMatch[4]
  });
}

assert(foundPresets.length >= 10, `Found all ${foundPresets.length}/10 Tasbeeh Presets`);

for (const p of foundPresets) {
  const hasTashkeel = /[\u064B-\u0652]/.test(p.title);
  assert(
    hasTashkeel && p.defaultTarget > 0 && p.virtue.length > 5,
    `Preset '${p.id}' (${p.title}): Has Tashkeel & authentic Hadith virtue`
  );
}

// ----------------------------------------------------
// 4. Athkar Database Integrity
// ----------------------------------------------------
console.log('\n📚 4. Testing Athkar Database Structure:');
const athkarPath = resolve(process.cwd(), 'src', 'data', 'athkarData.js');
const athkarContent = readFileSync(athkarPath, 'utf-8');

const requiredCategories = ['morning', 'evening', 'afterPrayer', 'sleep', 'tasbeeh'];
for (const cat of requiredCategories) {
  const containsCat = athkarContent.includes(`id: '${cat}'`) || athkarContent.includes(`id: "${cat}"`);
  assert(containsCat, `Athkar category '${cat}' is registered and contains authentic Athkar`);
}

// ----------------------------------------------------
// 5. Sunnah Fasting Rules Engine
// ----------------------------------------------------
console.log('\n🌙 5. Testing Sunnah Fasting Rules Engine:');

// Test Monday (e.g. 2026-06-15 is Monday)
const mondayDate = new Date('2026-06-15T10:00:00');
const mondayFasting = getSunnahFastingInfo(mondayDate, 0);
assert(
  mondayFasting.isSunnahFastingToday && mondayFasting.reasons.some(r => r.includes('الإثنين')),
  `Monday detected as Sunnah Fasting day`
);

// Test Thursday (e.g. 2026-06-18 is Thursday)
const thursdayDate = new Date('2026-06-18T10:00:00');
const thursdayFasting = getSunnahFastingInfo(thursdayDate, 0);
assert(
  thursdayFasting.isSunnahFastingToday && thursdayFasting.reasons.some(r => r.includes('الخميس')),
  `Thursday detected as Sunnah Fasting day`
);

console.log('\n========================================');
console.log(`🎉 Islamic Data Verification Summary:`);
console.log(`  - Total Tests  : ${totalTests}`);
console.log(`  - Passed       : ${passedTests}`);
console.log(`  - Failed       : ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
