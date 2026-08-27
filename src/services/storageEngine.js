// LocalStorage & IndexedDB Persistence Engine with Default Islamic Configurations

const STORAGE_KEYS = {
  SETTINGS: 'prayer_app_settings_v2',
  CUSTOM_ATHKAR: 'prayer_app_custom_athkar_v2',
  ATHKAR_PROGRESS: 'prayer_app_athkar_progress_v2',
  TASBEEH_DATA: 'prayer_app_tasbeeh_v2',
  WIDGET_CONFIG: 'prayer_app_widget_config_v2'
};

export const DEFAULT_SETTINGS = {
  location: {
    id: 'cairo',
    nameAr: 'القاهرة',
    countryAr: 'مصر',
    lat: 30.0444,
    lng: 31.2357,
    isManual: false
  },
  calculationMethod: 'Egyptian', // Egyptian, UmmAlQura, MuslimWorldLeague, NorthAmerica, Dubai, Kuwait, Qatar, Karachi, Singapore, Turkey, France, MoonsightingCommittee
  madhab: 'shafi', // 'shafi' (Standard) or 'hanafi'
  highLatitudeRule: 'MiddleOfTheNight',
  hijriOffset: 0, // -2 to +2 days
  
  // Custom manual time offsets (+/- minutes per prayer)
  prayerOffsets: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  },

  // Custom Eqama delays after Azan (in minutes)
  eqamaOffsets: {
    fajr: 20,
    dhuhr: 15,
    asr: 15,
    maghrib: 10,
    isha: 15
  },

  // Audio settings
  reciter: 'makkah', // makkah, madinah, alafasy, abdulbasit, alhussary, alqatami, alaqsa, fajr
  fajrReciter: 'fajr', // Fajr-specific Azan
  eqamaSound: 'double_beep', // double_beep, tone, voice
  volume: 0.9,
  
  // Voiced Pre-Iqamah 5-minute reminder
  preIqamahVoiceEnabled: true,
  preIqamahVoiceMinutes: 5,
  
  // Per-prayer alert mode: 'full' | 'takbeer' | 'beep' | 'silent'
  prayerAlertModes: {
    fajr: 'full',
    sunrise: 'silent',
    dhuhr: 'full',
    asr: 'full',
    maghrib: 'full',
    isha: 'full'
  },

  // Eqama alert enabled per prayer
  eqamaAlertEnabled: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true
  },

  // Pre-Azan preparation reminder (minutes before Azan)
  preReminderMinutes: 10,
  preReminderEnabled: {
    fajr: true,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false
  },

  // Sunnah Fasting Gentle Reminders
  fastingReminderEnabled: true,

  // Features & Display
  theme: 'dark', // 'dark' | 'oled' | 'sapphire' | 'desert' | 'light'
  timeFormat: '12h', // '12h' | '24h'
  hapticEnabled: true,
  wakeLockEnabled: true,
  audioUnmuted: false,
  showLockscreenWidget: true,

  // Widget Customization inside Settings
  widgetCustomizer: {
    layout: '4x1', // '4x1' | '4x2' | '2x2'
    timeFormat: '12h', // '12h' | '24h'
    borderRadius: 16, // 0 to 32px
    paddingMode: 'normal', // 'compact' | 'normal' | 'spacious'
    bgStyle: 'glass', // 'oled' | 'glass' | 'sapphire' | 'outline'
    showIqamah: true,
    showHijri: true,
    showNextTag: true
  }
};

export const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      location: { ...DEFAULT_SETTINGS.location, ...parsed.location },
      prayerOffsets: { ...DEFAULT_SETTINGS.prayerOffsets, ...parsed.prayerOffsets },
      eqamaOffsets: { ...DEFAULT_SETTINGS.eqamaOffsets, ...parsed.eqamaOffsets },
      prayerAlertModes: { ...DEFAULT_SETTINGS.prayerAlertModes, ...parsed.prayerAlertModes },
      eqamaAlertEnabled: { ...DEFAULT_SETTINGS.eqamaAlertEnabled, ...parsed.eqamaAlertEnabled },
      preReminderEnabled: { ...DEFAULT_SETTINGS.preReminderEnabled, ...parsed.preReminderEnabled },
      widgetCustomizer: { ...DEFAULT_SETTINGS.widgetCustomizer, ...(parsed.widgetCustomizer || {}) }
    };
  } catch (err) {
    console.error('Error loading stored settings:', err);
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
};

export const getStoredCustomAthkar = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ATHKAR);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading custom athkar:', err);
    return [];
  }
};

export const saveStoredCustomAthkar = (athkarList) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_ATHKAR, JSON.stringify(athkarList));
  } catch (err) {
    console.error('Error saving custom athkar:', err);
  }
};

export const getStoredAthkarProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATHKAR_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
};

export const saveStoredAthkarProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ATHKAR_PROGRESS, JSON.stringify(progress));
  } catch (err) {
    console.error('Error saving athkar progress:', err);
  }
};

// Tasbeeh persistence
export const DEFAULT_TASBEEH_STATE = {
  currentZikrId: 'subhanallah',
  currentCount: 0,
  target: 33,
  dailyTotal: 0,
  lastResetDate: '',
  history: {}
};

export const getStoredTasbeeh = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASBEEH_DATA);
    if (!raw) return DEFAULT_TASBEEH_STATE;
    return { ...DEFAULT_TASBEEH_STATE, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_TASBEEH_STATE;
  }
};

export const saveStoredTasbeeh = (data) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASBEEH_DATA, JSON.stringify(data));
  } catch (e) {}
};

// IndexedDB for storing custom user-uploaded Azan MP3 audio files
const DB_NAME = 'prayer_custom_audio_db';
const DB_STORE = 'custom_azans';

function openAudioDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveCustomAzanAudio(id, name, blob) {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const record = { id, name, blob, dateAdded: new Date().toISOString() };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to save custom audio to IndexedDB:', err);
    throw err;
  }
}

export async function getCustomAzanAudios() {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    return [];
  }
}

export async function deleteCustomAzanAudio(id) {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    return false;
  }
}
