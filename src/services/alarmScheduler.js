// Background Exact Alarm Scheduler & Native Android Bridge Sync
// Guarantees offline exact prayer Azan alerts when app is completely killed or screen is off

import { calculatePrayerTimes } from './prayerEngine.js';
import { LocalNotifications } from '@capacitor/local-notifications';

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_NAMES_AR = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء'
};

const SOUND_RESOURCE_MAP = {
  makkah: 'azan_makkah',
  madinah: 'azan_madinah',
  alafasy: 'azan_alafasy',
  abdulbasit: 'azan_abdulbasit',
  alaqsa: 'azan_alaqsa',
  fajr: 'azan_fajr',
  takbeer: 'takbeer',
  eqama_beep: 'iqamah_beep'
};

export const normalizeSoundName = (soundKey) => {
  if (!soundKey) return 'azan_makkah';
  if (SOUND_RESOURCE_MAP[soundKey]) return SOUND_RESOURCE_MAP[soundKey];
  return soundKey.toLowerCase().replace(/[-]/g, '_');
};

/**
 * Computes exact future prayer alarms for the next N days
 */
export const generatePrayerAlarms = (settings, daysAhead = 7) => {
  if (!settings || !settings.location) return [];

  const alarms = [];
  const now = new Date();
  const baseTimeMs = now.getTime();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const targetDate = new Date(baseTimeMs + dayOffset * 24 * 60 * 60 * 1000);
    const prayerResults = calculatePrayerTimes(targetDate, settings, { includeNightTimes: false });

    if (!prayerResults || !prayerResults.prayers) continue;

    prayerResults.prayers.forEach((p, idx) => {
      if (!PRAYER_KEYS.includes(p.id) || !p.time) return;

      const pTime = p.time instanceof Date ? p.time : new Date(p.time);
      const timestamp = pTime.getTime();

      // Only schedule future prayers (at least 15s in the future)
      if (timestamp <= baseTimeMs + 15000) return;

      const alertMode = settings.prayerAlertModes?.[p.id] || 'full';
      if (alertMode === 'silent') return;

      const reciterKey = p.id === 'fajr'
        ? (settings.fajrReciter || 'fajr')
        : (settings.reciter || 'makkah');

      const sound = normalizeSoundName(reciterKey);
      const dateStr = pTime.toISOString().split('T')[0];
      const requestCode = 1000 + (dayOffset * 10) + idx;

      alarms.push({
        id: `${dateStr}-${p.id}`,
        requestCode,
        prayerId: p.id,
        prayerNameAr: p.nameAr || PRAYER_NAMES_AR[p.id] || 'الصلاة',
        timestamp,
        sound,
        alertMode
      });
    });
  }

  return alarms;
};

/**
 * Syncs the schedule to Native Android AlarmManager via AndroidPrayerAlarmBridge
 * and also configures Capacitor LocalNotifications as supplementary channel.
 */
export const syncPrayerAlarms = async (settings) => {
  if (!settings) return;

  const alarms = generatePrayerAlarms(settings, 7);

  // 1. Sync to Native Android AlarmManager (Runs when app is completely killed)
  if (typeof window !== 'undefined') {
    const bridge = window.AndroidPrayerAlarmBridge || window.AndroidWidgetBridge;
    if (bridge && typeof bridge.schedulePrayerAlarms === 'function') {
      try {
        bridge.schedulePrayerAlarms(JSON.stringify(alarms));
        console.log(`🕌 [منبه الصلوات]: تمت جدولة ${alarms.length} أذان قادم عبر Android AlarmManager`);
      } catch (e) {
        console.error('Failed to sync alarms with Android bridge:', e);
      }
    }
  }

  // 2. Supplementary sync via Capacitor LocalNotifications
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      // Create high priority notification channel for Azan
      try {
        await LocalNotifications.createChannel({
          id: 'azan_alarm_channel',
          name: 'أذان الصلوات وتنبيهات الإقامة',
          description: 'تنبيهات صوت الأذان في وقت الصلاة بدقة',
          importance: 5,
          visibility: 1,
          sound: 'azan_makkah.mp3',
          vibration: true
        });
      } catch (err) {}

      // Schedule next 5 upcoming notifications
      const nextUpcoming = alarms.slice(0, 5).map((a) => ({
        id: a.requestCode,
        title: `حان الآن موعد أذان ${a.prayerNameAr}`,
        body: 'الله أكبر • انقر لفتح صلاتي وأذكاري',
        channelId: 'azan_alarm_channel',
        sound: `${a.sound}.mp3`,
        schedule: { at: new Date(a.timestamp), allowWhileIdle: true },
        smallIcon: 'ic_stat_icon_config_sample'
      }));

      if (nextUpcoming.length > 0) {
        await LocalNotifications.schedule({ notifications: nextUpcoming });
      }
    }
  } catch (err) {}
};

/**
 * Stops background native Azan if playing
 */
export const stopNativeAzan = () => {
  if (typeof window !== 'undefined') {
    const bridge = window.AndroidPrayerAlarmBridge || window.AndroidWidgetBridge;
    if (bridge && typeof bridge.stopAzan === 'function') {
      try {
        bridge.stopAzan();
      } catch (e) {}
    }
  }
};

/**
 * Checks if native background Azan is currently playing
 */
export const isNativeAzanPlaying = () => {
  if (typeof window !== 'undefined') {
    const bridge = window.AndroidPrayerAlarmBridge || window.AndroidWidgetBridge;
    if (bridge && typeof bridge.isAzanPlaying === 'function') {
      try {
        return Boolean(bridge.isAzanPlaying());
      } catch (e) {
        return false;
      }
    }
  }
  return false;
};

/**
 * Returns current playing prayer name from native service
 */
export const getNativePlayingPrayer = () => {
  if (typeof window !== 'undefined') {
    const bridge = window.AndroidPrayerAlarmBridge || window.AndroidWidgetBridge;
    if (bridge && typeof bridge.getCurrentPlayingPrayer === 'function') {
      try {
        return bridge.getCurrentPlayingPrayer() || '';
      } catch (e) {
        return '';
      }
    }
  }
  return '';
};
