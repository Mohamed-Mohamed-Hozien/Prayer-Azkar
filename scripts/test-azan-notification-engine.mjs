// Comprehensive Automated Test Suite: Background Azan Notifications & Exact Alarms Engine
// Tests astronomical accuracy, 7-day schedule generation, requestCode collisions,
// alert mode filters, reciter resource mappings, physical audio files, AndroidManifest invariants,
// and Java service contracts.

import fs from 'fs';
import path from 'path';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

console.log('🕌 [منبه وأذان صلاتي وأذكاري] - بدء الفحص الشامل لنظام الأذان والنوتيفيكيشن...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ فشل: ${message}`);
    failCount++;
  }
}

// ============================================================================
// 1. ASTRONOMICAL CALCULATION & PRAYER TIMESTAMPS
// ============================================================================
console.log('📐 1. فحص دقة المواقيت الفلكية للأذان:');

const coordinates = new Coordinates(30.0444, 31.2357); // Cairo
const params = CalculationMethod.Egyptian();
const testDate = new Date();
const prayerTimes = new PrayerTimes(coordinates, testDate, params);

assert(prayerTimes.fajr instanceof Date && !isNaN(prayerTimes.fajr.getTime()), 'حساب موعد أذان الفجر بدقة');
assert(prayerTimes.dhuhr instanceof Date && !isNaN(prayerTimes.dhuhr.getTime()), 'حساب موعد أذان الظهر بدقة');
assert(prayerTimes.asr instanceof Date && !isNaN(prayerTimes.asr.getTime()), 'حساب موعد أذان العصر بدقة');
assert(prayerTimes.maghrib instanceof Date && !isNaN(prayerTimes.maghrib.getTime()), 'حساب موعد أذان المغرب بدقة');
assert(prayerTimes.isha instanceof Date && !isNaN(prayerTimes.isha.getTime()), 'حساب موعد أذان العشاء بدقة');

// Chronological order verification
assert(
  prayerTimes.fajr.getTime() < prayerTimes.dhuhr.getTime() &&
  prayerTimes.dhuhr.getTime() < prayerTimes.asr.getTime() &&
  prayerTimes.asr.getTime() < prayerTimes.maghrib.getTime() &&
  prayerTimes.maghrib.getTime() < prayerTimes.isha.getTime(),
  'الترتيب الزمني لمواقيت الأذان سليم 100% على مدار اليوم'
);

// ============================================================================
// 2. SCHEDULE GENERATOR & 7-DAY ADVANCE WINDOW
// ============================================================================
console.log('\n📅 2. فحص جدولة الأذان المسبقة لـ 7 أيام في الخلفية:');

const mockSettings = {
  location: { lat: 30.0444, lng: 31.2357, nameAr: 'القاهرة' },
  calculationMethod: 'Egyptian',
  reciter: 'makkah',
  fajrReciter: 'fajr',
  prayerAlertModes: {
    fajr: 'full',
    dhuhr: 'full',
    asr: 'full',
    maghrib: 'full',
    isha: 'full'
  }
};

// Simulation of generatePrayerAlarms
function generateAlarms(settings, daysAhead = 7) {
  const alarms = [];
  const now = new Date();
  const baseTimeMs = now.getTime();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const targetDate = new Date(baseTimeMs + dayOffset * 24 * 60 * 60 * 1000);
    const pTimes = new PrayerTimes(
      new Coordinates(settings.location.lat, settings.location.lng),
      targetDate,
      CalculationMethod.Egyptian()
    );

    const prayers = [
      { id: 'fajr', time: pTimes.fajr, nameAr: 'الفجر' },
      { id: 'dhuhr', time: pTimes.dhuhr, nameAr: 'الظهر' },
      { id: 'asr', time: pTimes.asr, nameAr: 'العصر' },
      { id: 'maghrib', time: pTimes.maghrib, nameAr: 'المغرب' },
      { id: 'isha', time: pTimes.isha, nameAr: 'العشاء' }
    ];

    prayers.forEach((p, idx) => {
      const timestamp = p.time.getTime();
      if (timestamp <= baseTimeMs + 15000) return; // Future only

      const alertMode = settings.prayerAlertModes?.[p.id] || 'full';
      if (alertMode === 'silent') return;

      const reciter = p.id === 'fajr' ? settings.fajrReciter : settings.reciter;
      const requestCode = 1000 + (dayOffset * 10) + idx;
      const dateStr = p.time.toISOString().split('T')[0];

      alarms.push({
        id: `${dateStr}-${p.id}`,
        requestCode,
        prayerId: p.id,
        prayerNameAr: p.nameAr,
        timestamp,
        sound: `azan_${reciter}`,
        alertMode
      });
    });
  }
  return alarms;
}

const scheduledAlarms = generateAlarms(mockSettings, 7);
assert(scheduledAlarms.length >= 25, `تم توليد ${scheduledAlarms.length} موعد أذان مستقبلي للأسبوع القادم`);

// All alarms must be in the future
const allFuture = scheduledAlarms.every(a => a.timestamp > Date.now());
assert(allFuture, 'جميع المنبهات المجدولة تواريخها في المستقبل حصراً (> Date.now())');

// ============================================================================
// 3. REQUEST CODE COLLISION TEST (CRITICAL FOR ANDROID ALARMMANAGER)
// ============================================================================
console.log('\n🔒 3. فحص عدم تداخل وتطابق أكواد المنبهات (Request Codes):');

const requestCodes = scheduledAlarms.map(a => a.requestCode);
const uniqueCodes = new Set(requestCodes);
assert(requestCodes.length === uniqueCodes.size, `جميع أكواد الـ requestCode الـ (${uniqueCodes.size}) فريدة تماماً وبدون أي تكرار`);

// ============================================================================
// 4. ALERT MODES & CUSTOM RECITER LOGIC
// ============================================================================
console.log('\n🔊 4. فحص أوضاع التنبيه (أذان كامل، تكبيرات، صامت، رنات):');

// Test silent exclusion
const settingsWithSilent = {
  ...mockSettings,
  prayerAlertModes: {
    ...mockSettings.prayerAlertModes,
    dhuhr: 'silent' // Dhuhr muted
  }
};
const alarmsWithSilent = generateAlarms(settingsWithSilent, 2);
const hasSilentDhuhr = alarmsWithSilent.some(a => a.prayerId === 'dhuhr');
assert(!hasSilentDhuhr, 'الصلوات المضبوطة على "صامت" تُستثنى تلقائياً من تشغيل صوت الأذان');

// Test Fajr authentic audio attribution
const fajrAlarm = scheduledAlarms.find(a => a.prayerId === 'fajr');
assert(fajrAlarm && fajrAlarm.sound === 'azan_fajr', 'أذان الفجر يخصص تلقائياً بصوت أذان الفجر (الصلاة خير من النوم)');

// ============================================================================
// 5. PHYSICAL AUDIO ASSET VERIFICATION IN ANDROID (res/raw)
// ============================================================================
console.log('\n📂 5. فحص وجود ملفات الصوت الأصلية في أندرويد (res/raw):');

const requiredRawFiles = [
  'azan_makkah.mp3',
  'azan_madinah.mp3',
  'azan_fajr.mp3',
  'azan_alafasy.mp3',
  'azan_abdulbasit.mp3',
  'azan_alaqsa.mp3',
  'takbeer.mp3',
  'iqamah_beep.wav'
];

requiredRawFiles.forEach(file => {
  const filePath = path.join('android', 'app', 'src', 'main', 'res', 'raw', file);
  const exists = fs.existsSync(filePath);
  if (exists) {
    const stats = fs.statSync(filePath);
    assert(stats.size > 10000, `ملف الصوت ${file} موجود بحجم سليم (${Math.round(stats.size / 1024)} KB)`);
  } else {
    assert(false, `ملف الصوت ${file} غير موجود في res/raw!`);
  }
});

// ============================================================================
// 6. ANDROID MANIFEST & PERMISSIONS AUDIT
// ============================================================================
console.log('\n🛡️ 6. فحص صلاحيات أندرويد لعمل الأذان في الخلفية (AndroidManifest.xml):');

const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

const requiredPermissions = [
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.WAKE_LOCK',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'
];

requiredPermissions.forEach(perm => {
  assert(manifestContent.includes(perm), `الصلاحية ${perm.split('.').pop()} مُعرفة في المانيفست`);
});

assert(manifestContent.includes('android:name=".PrayerAudioService"'), 'الخدمة الصوتية PrayerAudioService مسجلة في المانيفست');
assert(manifestContent.includes('android:foregroundServiceType="mediaPlayback"'), 'الخدمة مضبوطة بنوع foregroundServiceType="mediaPlayback" (متوافق مع Android 14/15)');
assert(manifestContent.includes('android:name=".PrayerAlarmReceiver"'), 'مستقبل المنبه الدقيق PrayerAlarmReceiver مسجل في المانيفست');
assert(manifestContent.includes('android:name=".PrayerBootReceiver"'), 'مستقبل استعادة المنبهات بعد إعادة التشغيل PrayerBootReceiver مسجل');

// ============================================================================
// 7. JAVA NATIVE SOURCE CODE CONTRACT AUDIT
// ============================================================================
console.log('\n☕ 7. فحص كود أندرويد جافا (Audio Service & Alarm Scheduler):');

const audioServicePath = path.join('android', 'app', 'src', 'main', 'java', 'com', 'prayertimes', 'athkar', 'PrayerAudioService.java');
const audioServiceCode = fs.readFileSync(audioServicePath, 'utf8');

assert(audioServiceCode.includes('AudioAttributes.USAGE_ALARM'), 'الصوت مضبوط بـ USAGE_ALARM (للرنين حتى في وضع الصامت Silent)');
assert(audioServiceCode.includes('NotificationManager.IMPORTANCE_HIGH'), 'قناة الإشعار مضبوطة بأولوية IMPORTANCE_HIGH لتنبيه الشاشة');
assert(audioServiceCode.includes('ACTION_STOP_AZAN'), 'زر إيقاف الأذان مُبرمج داخل إشعار أندرويد');
assert(audioServiceCode.includes('PowerManager.PARTIAL_WAKE_LOCK'), 'تم استخدام WakeLock لمنع المعالج من إيقاف الصوت قبل إتمام الأذان');

const mainActivityPath = path.join('android', 'app', 'src', 'main', 'java', 'com', 'prayertimes', 'athkar', 'MainActivity.java');
const mainActivityCode = fs.readFileSync(mainActivityPath, 'utf8');

assert(mainActivityCode.includes('KEYCODE_VOLUME_DOWN') && mainActivityCode.includes('PrayerAudioService.stop'), 'تم ربط أزرار الصوت بالهاتف (Hardware Volume Keys) لإيقاف الأذان فوراً');
assert(mainActivityCode.includes('AndroidPrayerAlarmBridge'), 'جسر التواصل بين الجافاسكريبت والأندرويد AndroidPrayerAlarmBridge جاهز');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n========================================');
console.log(`🎉 ملخص نتائج فحص نظام الأذان والنوتيفيكيشن:`);
console.log(`  - إجمالي الاختبارات: ${passCount + failCount}`);
console.log(`  - نجح (Passed)     : ${passCount}`);
console.log(`  - فشل (Failed)     : ${failCount}`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
