// Robust Engine State & Lifecycle Verification Test Runner
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { DEFAULT_SETTINGS, DEFAULT_TASBEEH_STATE } from '../../../../src/services/storageEngine.js';
import { audioEngine } from '../../../../src/services/audioEngine.js';
import { notificationEngine } from '../../../../src/services/notificationEngine.js';

console.log('⚙️ [Engine State, Lifecycle & Logic Test Runner]\n');

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
// 1. Storage Engine Defaults & Schema
// ----------------------------------------------------
console.log('💾 1. Testing Storage Engine Defaults & Schema:');

assert(
  DEFAULT_SETTINGS.location && typeof DEFAULT_SETTINGS.location.lat === 'number' && typeof DEFAULT_SETTINGS.location.lng === 'number',
  'DEFAULT_SETTINGS includes valid location coordinates'
);

const expectedPrayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const hasAllOffsets = expectedPrayerKeys.every(k => k in DEFAULT_SETTINGS.eqamaOffsets);
assert(hasAllOffsets, 'DEFAULT_SETTINGS includes eqama offsets for all 5 daily prayers');

const hasAllAlertModes = expectedPrayerKeys.every(k => k in DEFAULT_SETTINGS.prayerAlertModes);
assert(hasAllAlertModes, 'DEFAULT_SETTINGS includes prayerAlertModes for all 5 daily prayers');

assert(
  DEFAULT_SETTINGS.widgetCustomizer && typeof DEFAULT_SETTINGS.widgetCustomizer.borderRadius === 'number',
  'DEFAULT_SETTINGS includes widgetCustomizer options'
);

assert(
  DEFAULT_TASBEEH_STATE.currentZikrId && DEFAULT_TASBEEH_STATE.target > 0 && typeof DEFAULT_TASBEEH_STATE.dailyTotal === 'number',
  'DEFAULT_TASBEEH_STATE has valid defaults (currentZikrId, target, dailyTotal)'
);

// ----------------------------------------------------
// 2. Audio Engine Volume Clamping & Oscillator Cleanup
// ----------------------------------------------------
console.log('\n🔊 2. Testing Audio Engine Lifecycle & Volume Bounds:');

audioEngine.setVolume(1.5);
assert(audioEngine.volume === 1, 'setVolume(1.5) clamped to max 1.0');

audioEngine.setVolume(-0.5);
assert(audioEngine.volume === 0, 'setVolume(-0.5) clamped to min 0.0');

audioEngine.setVolume(0.85);
assert(audioEngine.volume === 0.85, 'setVolume(0.85) sets volume accurately');

// Test timer tracking and stopSynth cleanup
let timerExecuted = false;
const timerId = audioEngine.scheduleTimeout(() => { timerExecuted = true; }, 500);
assert(audioEngine.activeTimeouts.has(timerId), 'scheduleTimeout registers timer in activeTimeouts');

audioEngine.stopSynth();
assert(audioEngine.activeTimeouts.size === 0, 'stopSynth clears all pending active timeouts');
assert(audioEngine.synthOscillators.length === 0, 'stopSynth clears all tracked oscillators');

// ----------------------------------------------------
// 3. Notification Engine IDs & Determinism
// ----------------------------------------------------
console.log('\n🔔 3. Testing Notification Engine Deterministic Tag ID Mapping:');

const notifFilePath = resolve(process.cwd(), 'src', 'services', 'notificationEngine.js');
const notifContent = readFileSync(notifFilePath, 'utf-8');

assert(
  notifContent.includes("'azan-fajr': 2001") && notifContent.includes("'eqama-fajr': 2002"),
  'Deterministic TAG_ID_MAP includes Fajr Azan (2001) and Iqamah (2002)'
);

assert(
  notifContent.includes("'azan-isha': 2041") && notifContent.includes("'eqama-isha': 2042"),
  'Deterministic TAG_ID_MAP includes Isha Azan (2041) and Iqamah (2042)'
);

// ----------------------------------------------------
// 4. Android Widget Sync Throttling
// ----------------------------------------------------
console.log('\n📱 4. Testing Android Widget Battery-Optimized Throttling:');

let bridgeCallCount = 0;
let lastPayload = null;
globalThis.window = globalThis.window || {};
globalThis.window.AndroidWidgetBridge = {
  updateWidgetData: (jsonStr) => {
    bridgeCallCount++;
    lastPayload = JSON.parse(jsonStr);
  }
};

const mockCurrent = { id: 'dhuhr', nameAr: 'الظهر' };
const mockNext = { id: 'asr', nameAr: 'العصر' };
const mockState = {
  todayTimes: {
    fajr: new Date(),
    dhuhr: new Date(),
    asr: new Date(),
    maghrib: new Date(),
    isha: new Date()
  },
  settings: DEFAULT_SETTINGS,
  audioState: { isPlaying: false }
};

// First call should sync to AndroidWidgetBridge
notificationEngine.lastWidgetSyncKey = null; // reset
notificationEngine.updateLockscreenWidget(mockCurrent, mockNext, '02:45:30', false, '', mockState);
assert(bridgeCallCount === 1, 'First call invokes AndroidWidgetBridge once');
assert(lastPayload && lastPayload.nextPrayer.includes('02:45'), 'Widget payload uses HH:MM countdown format');

// Second call within same minute should be throttled (zero additional bridge calls)
notificationEngine.updateLockscreenWidget(mockCurrent, mockNext, '02:45:29', false, '', mockState);
assert(bridgeCallCount === 1, 'Consecutive call within same minute is throttled (battery saved)');

// Force sync should bypass throttle
notificationEngine.updateLockscreenWidget(mockCurrent, mockNext, '02:45:28', false, '', mockState, true);
assert(bridgeCallCount === 2, 'Force sync parameter bypasses throttle on user demand');

console.log('\n========================================');
console.log(`🎉 Engine State & Lifecycle Verification:`);
console.log(`  - Total Tests  : ${totalTests}`);
console.log(`  - Passed       : ${passedTests}`);
console.log(`  - Failed       : ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
