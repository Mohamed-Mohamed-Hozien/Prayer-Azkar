// Android Notification & Pinned Live Lockscreen Widget Engine
import { LocalNotifications } from '@capacitor/local-notifications';

const ONGOING_NOTIFICATION_ID = 1001;

const TAG_ID_MAP = {
  'azan-fajr': 2001,
  'eqama-fajr': 2002,
  'pre-fajr': 2003,
  'pre-eqama-fajr': 2004,
  'azan-dhuhr': 2011,
  'eqama-dhuhr': 2012,
  'pre-dhuhr': 2013,
  'pre-eqama-dhuhr': 2014,
  'azan-asr': 2021,
  'eqama-asr': 2022,
  'pre-asr': 2023,
  'pre-eqama-asr': 2024,
  'azan-maghrib': 2031,
  'eqama-maghrib': 2032,
  'pre-maghrib': 2033,
  'pre-eqama-maghrib': 2034,
  'azan-isha': 2041,
  'eqama-isha': 2042,
  'pre-isha': 2043,
  'pre-eqama-isha': 2044
};

const getNotificationId = (tag) => {
  if (TAG_ID_MAP[tag]) return TAG_ID_MAP[tag];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  return 2100 + (Math.abs(hash) % 800);
};

class NotificationEngine {
  constructor() {
    this.permissionGranted = false;
    this.checkPermission();
  }

  async checkPermission() {
    try {
      const status = await LocalNotifications.checkPermissions();
      this.permissionGranted = status.display === 'granted';
    } catch (e) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        this.permissionGranted = Notification.permission === 'granted';
      }
    }
  }

  async requestPermission() {
    try {
      const status = await LocalNotifications.requestPermissions();
      this.permissionGranted = status.display === 'granted';
      return this.permissionGranted;
    } catch (e) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        this.permissionGranted = res === 'granted';
        return this.permissionGranted;
      }
      return false;
    }
  }

  /**
   * Dispatches a native Android local notification or browser notification
   * Uses deterministic IDs to update existing notifications rather than cluttering drawer
   */
  async sendNotification(title, body, tag = 'prayer-alert') {
    const notificationId = getNotificationId(tag);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: notificationId,
            sound: 'azan',
            smallIcon: 'ic_stat_icon_config_sample'
          }
        ]
      });
    } catch (e) {
      if (!this.permissionGranted) return;
      try {
        if ('Notification' in window) {
          new Notification(title, { body, icon: '/icons/icon-192.svg', tag });
        }
      } catch (err) {}
    }
  }

  /**
   * Updates Android Notification Shade, Lockscreen Live Activity, and Native Android Home Widget
   */
  updateLockscreenWidget(currentPrayer, nextPrayer, countdownStr, isEqamaWindow, eqamaCountdownStr, fullState = null) {
    let titleText = `الصلاة القادمة: ${nextPrayer?.nameAr || 'الفجر'}`;
    let subText = `متبقي على الأذان: ${countdownStr}`;

    if (isEqamaWindow && currentPrayer) {
      titleText = `حان وقت ${currentPrayer.nameAr} - وقت الإقامة`;
      subText = `متبقي على الإقامة: ${eqamaCountdownStr}`;
    }

    // 1. Android MediaSession Lockscreen Live Activity
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: titleText,
          artist: subText,
          album: isEqamaWindow ? `إقامة صلاة ${currentPrayer?.nameAr}` : (currentPrayer ? `الصلاة الحالية: ${currentPrayer.nameAr}` : 'مواقيت الصلاة والأذكار'),
          artwork: [
            { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
          ]
        });

        navigator.mediaSession.playbackState = 'playing';
      } catch (e) {}
    }

    // 2. Sync to Native Android Home Screen Widget (AndroidWidgetBridge)
    if (typeof window !== 'undefined' && window.AndroidWidgetBridge && fullState) {
      try {
        const { todayTimes, settings } = fullState;
        const timeFormat = settings?.widgetCustomizer?.timeFormat || settings?.timeFormat || '12h';
        const formatTime = (date) => {
          if (!date) return '--:--';
          let hours = date.getHours();
          const minutes = date.getMinutes();
          const minsStr = minutes < 10 ? '0' + minutes : minutes;
          if (timeFormat === '24h') {
            const hrsStr = hours < 10 ? '0' + hours : hours;
            return `${hrsStr}:${minsStr}`;
          }
          const isPM = hours >= 12;
          hours = hours % 12;
          hours = hours ? hours : 12;
          const suffix = isPM ? 'م' : 'ص';
          return `${hours}:${minsStr} ${suffix}`;
        };

        const widgetPayload = {
          title: `صلاتي وأذكاري • ${settings?.location?.nameAr || 'القاهرة'}`,
          nextPrayer: `${nextPrayer?.nameAr || 'الفجر'} (${countdownStr})`,
          footer: isEqamaWindow ? `الإقامة خلال: ${eqamaCountdownStr}` : 'المس لفتح مواقيت الصلاة والأذكار',
          fajr: formatTime(todayTimes?.fajr),
          dhuhr: formatTime(todayTimes?.dhuhr),
          asr: formatTime(todayTimes?.asr),
          maghrib: formatTime(todayTimes?.maghrib),
          isha: formatTime(todayTimes?.isha)
        };

        window.AndroidWidgetBridge.updateWidgetData(JSON.stringify(widgetPayload));
      } catch (err) {
        console.error('Failed to sync to AndroidWidgetBridge:', err);
      }
    }
  }

  /**
   * Pins an ongoing persistent notification in the Android status bar (cannot be swiped away)
   */
  async updatePinnedOngoingNotification(title, body) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: ONGOING_NOTIFICATION_ID,
            ongoing: true, // Pinned in Android status bar, cannot be dismissed
            autoCancel: false,
            smallIcon: 'ic_stat_icon_config_sample'
          }
        ]
      });
    } catch (e) {}
  }
}

export const notificationEngine = new NotificationEngine();
