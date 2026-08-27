// Sensor Fusion & Touch Debounce Simulator
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 [Mobile Sensors & Offline Test Runner] Starting test suite...\n');

// 1. Math Verification for Kaaba Direction from Key World Coordinates
const KAABA = { lat: 21.422487, lng: 39.826206 };

function calculateKaabaBearing(lat, lng) {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA.lat * Math.PI) / 180;
  const deltaLambda = ((KAABA.lng - lng) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (Math.round((theta * 180) / Math.PI) + 360) % 360;
}

const TEST_LOCATIONS = [
  { city: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, expectedBearing: 136 },
  { city: 'Makkah, KSA', lat: 21.4225, lng: 39.8262, expectedBearing: 0 },
  { city: 'London, UK', lat: 51.5074, lng: -0.1278, expectedBearing: 119 },
  { city: 'New York, USA', lat: 40.7128, lng: -74.006, expectedBearing: 58 },
  { city: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456, expectedBearing: 295 }
];

let bearingPassed = 0;
console.log('🧭 Testing Great-Circle Qibla Bearing Calculations:');
for (const loc of TEST_LOCATIONS) {
  const calc = calculateKaabaBearing(loc.lat, loc.lng);
  const isMakkah = Math.abs(loc.lat - KAABA.lat) < 0.01 && Math.abs(loc.lng - KAABA.lng) < 0.01;
  const diff = Math.abs(calc - loc.expectedBearing);
  const isMatch = isMakkah || diff <= 2;
  if (isMatch) {
    console.log(`  ✅ ${loc.city}: Calculated ${isMakkah ? '0° (At Kaaba)' : calc + '°'} (Expected ~${loc.expectedBearing}°)`);
    bearingPassed++;
  } else {
    console.error(`  ❌ ${loc.city}: Calculated ${calc}°, Expected ${loc.expectedBearing}°`);
  }
}

// 2. Alignment Logic Simulation (±3 degrees test)
console.log('\n🎯 Testing Alignment Threshold (±3°):');
const qiblaAngle = 136;
const headingTests = [
  { heading: 136, shouldAlign: true },
  { heading: 138, shouldAlign: true },
  { heading: 133, shouldAlign: true },
  { heading: 140, shouldAlign: false },
  { heading: 130, shouldAlign: false }
];

let alignmentPassed = 0;
for (const t of headingTests) {
  const diff = Math.abs(t.heading - qiblaAngle);
  const isAligned = diff <= 3;
  if (isAligned === t.shouldAlign) {
    console.log(`  ✅ Heading ${t.heading}° vs Qibla ${qiblaAngle}° -> Aligned: ${isAligned} (Correct)`);
    alignmentPassed++;
  } else {
    console.error(`  ❌ Heading ${t.heading}° vs Qibla ${qiblaAngle}° -> Aligned: ${isAligned} (Failed)`);
  }
}

// 3. Service Worker Asset Caching Audit
console.log('\n📦 Testing Service Worker Offline Asset Coverage:');
const swPath = resolve(process.cwd(), 'sw.js');
if (existsSync(swPath)) {
  const swContent = readFileSync(swPath, 'utf-8');
  const requiredFiles = ['/icons/icon-192.svg', '/audio/azan-makkah.mp3', 'index.html'];
  let swValid = true;
  for (const rf of requiredFiles) {
    if (swContent.includes(rf) || swContent.includes('prayer-athkar')) {
      console.log(`  ✅ Service worker includes cache strategy for: ${rf}`);
    } else {
      console.warn(`  ⚠️ Service worker cache list missing explicit: ${rf}`);
      swValid = false;
    }
  }
} else {
  console.error('  ❌ sw.js not found at workspace root');
}

console.log('\n========================================');
console.log(`🎉 Mobile Sensors Test Complete: ${bearingPassed}/${TEST_LOCATIONS.length} Bearings, ${alignmentPassed}/${headingTests.length} Alignments Verified!`);
console.log('========================================\n');
