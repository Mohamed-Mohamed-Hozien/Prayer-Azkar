/**
 * Auto Mosque Silence Engine (وضع صامت المسجد التلقائي)
 *
 * Automatically manages phone silence during congregation prayers in the mosque.
 * Configured via localStorage with customizable duration, Friday extension, and trigger points.
 */

export const SILENCE_STORAGE_KEY = 'prayer_mosque_silence';

export const DEFAULT_SILENCE_SETTINGS = {
  enabled: true,
  duration: 20,        // minutes for standard daily prayers
  fridayDuration: 35,  // minutes for Friday (Jumu'ah) prayer & khutbah
  triggerAt: 'iqamah'  // 'iqamah' | 'azan'
};

/**
 * Retrieves the current mosque silence settings from localStorage with safe defaults.
 * @returns {{ enabled: boolean, duration: number, fridayDuration: number, triggerAt: 'iqamah' | 'azan' }}
 */
export const getMosqueSilenceSettings = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SILENCE_STORAGE_KEY) : null;
    if (!raw) {
      return { ...DEFAULT_SILENCE_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SILENCE_SETTINGS.enabled,
      duration: typeof parsed.duration === 'number' && parsed.duration > 0 ? parsed.duration : DEFAULT_SILENCE_SETTINGS.duration,
      fridayDuration: typeof parsed.fridayDuration === 'number' && parsed.fridayDuration > 0 ? parsed.fridayDuration : DEFAULT_SILENCE_SETTINGS.fridayDuration,
      triggerAt: parsed.triggerAt === 'azan' ? 'azan' : DEFAULT_SILENCE_SETTINGS.triggerAt
    };
  } catch (err) {
    console.warn('[SilenceEngine] Failed to read settings from localStorage, using defaults:', err);
    return { ...DEFAULT_SILENCE_SETTINGS };
  }
};

/**
 * Persists updated mosque silence settings to localStorage.
 * @param {Partial<typeof DEFAULT_SILENCE_SETTINGS>} newSettings
 * @returns {typeof DEFAULT_SILENCE_SETTINGS}
 */
export const saveMosqueSilenceSettings = (newSettings) => {
  try {
    const current = getMosqueSilenceSettings();
    const updated = {
      ...current,
      ...newSettings
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SILENCE_STORAGE_KEY, JSON.stringify(updated));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prayer_mosque_silence_changed', { detail: updated }));
    }
    return updated;
  } catch (err) {
    console.error('[SilenceEngine] Failed to save settings to localStorage:', err);
    return { ...DEFAULT_SILENCE_SETTINGS, ...newSettings };
  }
};

/**
 * Returns comprehensive details about the active silence window if current time falls within one.
 * @param {Date | number | object} now Current date or prayerState if called with single argument
 * @param {object} [prayerState] Active prayer state containing todayTimes, currentPrayer, etc.
 * @returns {{ isActive: boolean, remainingMinutes: number, prayer: object | null, startTime: Date | null, endTime: Date | null, triggerAt: string, isFriday: boolean, duration: number }}
 */
export const getActiveSilenceInfo = (now, prayerState) => {
  let currentTime = now;
  let state = prayerState;

  // Handle single-argument invocation where prayerState was passed as first parameter
  if (
    currentTime &&
    typeof currentTime === 'object' &&
    !(currentTime instanceof Date) &&
    (currentTime.todayTimes || currentTime.currentPrayer || currentTime.prayers)
  ) {
    state = currentTime;
    currentTime = new Date();
  }

  const settings = getMosqueSilenceSettings();
  if (!settings.enabled || !state) {
    return {
      isActive: false,
      remainingMinutes: 0,
      prayer: null,
      startTime: null,
      endTime: null,
      triggerAt: settings.triggerAt,
      isFriday: false,
      duration: settings.duration
    };
  }

  const currentDate = currentTime instanceof Date ? currentTime : new Date(currentTime || Date.now());
  const nowMs = currentDate.getTime();
  if (isNaN(nowMs)) {
    return {
      isActive: false,
      remainingMinutes: 0,
      prayer: null,
      startTime: null,
      endTime: null,
      triggerAt: settings.triggerAt,
      isFriday: false,
      duration: settings.duration
    };
  }

  // Gather candidate prayers from prayerState
  const candidateList = [];
  if (state.currentPrayer) {
    candidateList.push(state.currentPrayer);
  }
  if (Array.isArray(state.todayTimes?.prayers)) {
    candidateList.push(...state.todayTimes.prayers);
  } else if (Array.isArray(state.prayers)) {
    candidateList.push(...state.prayers);
  }
  if (state.eqamaState?.prayer) {
    candidateList.push(state.eqamaState.prayer);
  }

  // Deduplicate and filter out non-congregational prayers (e.g. Sunrise / Shuruq)
  const seenKeys = new Set();
  const candidates = [];
  for (const p of candidateList) {
    if (!p || p.id === 'sunrise' || p.hasIqamah === false) continue;
    const timeVal = p.time instanceof Date ? p.time.getTime() : (p.time ? new Date(p.time).getTime() : 0);
    const key = `${p.id}_${timeVal}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      candidates.push(p);
    }
  }

  for (const p of candidates) {
    let startTime = null;

    if (settings.triggerAt === 'azan') {
      if (p.time) {
        startTime = p.time instanceof Date ? p.time : new Date(p.time);
      }
    } else {
      // Default: 'iqamah'
      if (p.eqamaTime) {
        startTime = p.eqamaTime instanceof Date ? p.eqamaTime : new Date(p.eqamaTime);
      } else if (p.time) {
        const baseTime = p.time instanceof Date ? p.time : new Date(p.time);
        const offsetMinutes = typeof p.eqamaOffset === 'number' ? p.eqamaOffset : 15;
        startTime = new Date(baseTime.getTime() + offsetMinutes * 60 * 1000);
      }
    }

    if (!startTime || isNaN(startTime.getTime())) continue;

    const startMs = startTime.getTime();
    const isFriday = startTime.getDay() === 5;
    const isJumuah = isFriday && p.id === 'dhuhr';
    const durationMins = isJumuah ? settings.fridayDuration : settings.duration;
    const endMs = startMs + durationMins * 60 * 1000;

    if (nowMs >= startMs && nowMs < endMs) {
      const remainingMs = endMs - nowMs;
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
      return {
        isActive: true,
        remainingMinutes,
        prayer: p,
        startTime,
        endTime: new Date(endMs),
        triggerAt: settings.triggerAt,
        isFriday,
        duration: durationMins
      };
    }
  }

  return {
    isActive: false,
    remainingMinutes: 0,
    prayer: null,
    startTime: null,
    endTime: null,
    triggerAt: settings.triggerAt,
    isFriday: false,
    duration: settings.duration
  };
};

/**
 * Determines whether current time is within the mosque silence window of the current prayer or iqamah.
 * @param {Date | number | object} now Current date or prayerState if called with single argument
 * @param {object} [prayerState] Active prayer state
 * @returns {boolean}
 */
export const isSilenceWindowActive = (now, prayerState) => {
  return getActiveSilenceInfo(now, prayerState).isActive;
};

/**
 * Returns the minutes left in the active mosque silence window (0 if inactive).
 * @param {Date | number | object} now Current date or prayerState if called with single argument
 * @param {object} [prayerState] Active prayer state
 * @returns {number}
 */
export const getSilenceRemainingMinutes = (now, prayerState) => {
  return getActiveSilenceInfo(now, prayerState).remainingMinutes;
};
