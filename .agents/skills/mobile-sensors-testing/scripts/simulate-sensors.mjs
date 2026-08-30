// Robust Mobile Sensor Fusion, Qibla Bearing & Offline Cache Test Runner
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { getQiblaBearing, getDistanceToKaabaKm } from '../../../../src/services/prayerEngine.js';

console.log('🧪 [Mobile Sensors, Qibla Math & Offline Test Runner]\n');

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
// 1. Direct Qibla Bearing Calculation (Imported from Engine)
// ----------------------------------------------------
console.log('🧭 1. Testing Great-Circle Qibla Bearing (from prayerEngine.js):');

const BEARING_BENCHMARKS = [
  { city: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, expected: 136 },
  { city: 'London, UK', lat: 51.5074, lng: -0.1278, expected: 119 },
  { city: 'New York, USA', lat: 40.7128, lng: -74.0060, expected: 58 },
  { city: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456, expected: 295 },
  { city: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, expected: 293 },
  { city: 'Cape Town, SA', lat: -33.9249, lng: 18.4241, expected: 24 }
];

for (const b of BEARING_BENCHMARKS) {
  const calculated = getQiblaBearing(b.lat, b.lng);
  const diff = Math.abs(calculated - b.expected);
  assert(
    diff <= 1,
    `${b.city}: Calculated ${calculated}° (Expected ${b.expected}°)`,
    `Diff: ${diff}°`
  );
}

// ----------------------------------------------------
// 2. Kaaba Boundary & NaN Edge Cases
// ----------------------------------------------------
console.log('\n🕋 2. Testing Kaaba Coordinates & Singularities:');

const KAABA = { lat: 21.422487, lng: 39.826206 };
const kaabaBearing = getQiblaBearing(KAABA.lat, KAABA.lng);
assert(
  !isNaN(kaabaBearing) && kaabaBearing === 0,
  `At Kaaba Coordinates (${KAABA.lat}, ${KAABA.lng}): Bearing is 0° (No NaN Crash)`
);

const kaabaDist = getDistanceToKaabaKm(KAABA.lat, KAABA.lng);
assert(
  kaabaDist === 0,
  `At Kaaba Coordinates: Distance is 0 km`
);

// ----------------------------------------------------
// 3. Great-Circle Distance Accuracy
// ----------------------------------------------------
console.log('\n📏 3. Testing Great-Circle Distance to Kaaba:');

const DISTANCE_BENCHMARKS = [
  { city: 'Cairo', lat: 30.0444, lng: 31.2357, min: 1200, max: 1350 },
  { city: 'London', lat: 51.5074, lng: -0.1278, min: 4700, max: 4900 },
  { city: 'New York', lat: 40.7128, lng: -74.0060, min: 10100, max: 10400 }
];

for (const d of DISTANCE_BENCHMARKS) {
  const km = getDistanceToKaabaKm(d.lat, d.lng);
  assert(
    km >= d.min && km <= d.max,
    `${d.city}: Distance calculated at ${km.toLocaleString()} km (Range: ${d.min}-${d.max} km)`
  );
}

// ----------------------------------------------------
// 4. Sensor Alignment Threshold Simulation (±3°)
// ----------------------------------------------------
console.log('\n🎯 4. Testing Compass Alignment Threshold (±3°):');

function checkAlignment(heading, qibla, tolerance = 3) {
  let offset = (qibla - heading + 360) % 360;
  if (offset > 180) offset -= 360;
  return Math.abs(offset) <= tolerance;
}

const ALIGNMENT_TESTS = [
  { heading: 136, qibla: 136, expected: true },
  { heading: 138, qibla: 136, expected: true },
  { heading: 133, qibla: 136, expected: true },
  { heading: 140, qibla: 136, expected: false },
  { heading: 130, qibla: 136, expected: false },
  { heading: 1, qibla: 359, expected: true },
  { heading: 359, qibla: 1, expected: true }
];

for (const a of ALIGNMENT_TESTS) {
  const isAligned = checkAlignment(a.heading, a.qibla);
  assert(
    isAligned === a.expected,
    `Heading ${a.heading}° vs Qibla ${a.qibla}° -> Aligned: ${isAligned} (Expected ${a.expected})`
  );
}

// ----------------------------------------------------
// 5. Service Worker Offline Asset Verification
// ----------------------------------------------------
console.log('\n📦 5. Testing Service Worker Offline Asset Coverage:');

const swPath = resolve(process.cwd(), 'sw.js');
if (existsSync(swPath)) {
  const swContent = readFileSync(swPath, 'utf-8');
  const REQUIRED_OFFLINE_ASSETS = [
    '/index.html',
    '/manifest.json',
    '/fonts/fonts.css',
    '/audio/azan-makkah.mp3',
    '/audio/azan-madinah.mp3',
    '/audio/azan-alafasy.mp3',
    '/audio/azan-abdulbasit.mp3',
    '/audio/azan-alaqsa.mp3',
    '/audio/azan-fajr.mp3',
    '/audio/takbeer.mp3',
    '/audio/iqamah-beep.wav',
    '/icons/mosque-icon.svg',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg'
  ];

  for (const asset of REQUIRED_OFFLINE_ASSETS) {
    const isCached = swContent.includes(`'${asset}'`) || swContent.includes(`"${asset}"`);
    assert(isCached, `Pre-cache list includes: ${asset}`);
  }
} else {
  assert(false, 'sw.js exists at workspace root');
}

console.log('\n========================================');
console.log(`🎉 Mobile Sensors & Offline Test Summary:`);
console.log(`  - Total Tests  : ${totalTests}`);
console.log(`  - Passed       : ${passedTests}`);
console.log(`  - Failed       : ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
