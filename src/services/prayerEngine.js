import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
  HighLatitudeRule,
  Qibla
} from 'adhan';

export const PRAYER_NAMES = [
  { id: 'fajr', nameAr: 'الفَجْر', nameEn: 'Fajr', hasIqamah: true, icon: 'Sunrise' },
  { id: 'sunrise', nameAr: 'الشُّرُوق', nameEn: 'Sunrise', hasIqamah: false, icon: 'SunMedium' },
  { id: 'dhuhr', nameAr: 'الظُّهْر', nameEn: 'Dhuhr', hasIqamah: true, icon: 'Sun' },
  { id: 'asr', nameAr: 'العَصْر', nameEn: 'Asr', hasIqamah: true, icon: 'Sunset' },
  { id: 'maghrib', nameAr: 'المَغْرِب', nameEn: 'Maghrib', hasIqamah: true, icon: 'CloudSun' },
  { id: 'isha', nameAr: 'العِشَاء', nameEn: 'Isha', hasIqamah: true, icon: 'Moon' }
];

export const CALCULATION_METHODS = [
  { id: 'Egyptian', nameAr: 'الهيئة المصرية العامة للمساحة', desc: 'مصر، إفريقيا، معظم العالم العربي (فجر 19.5°، عشاء 17.5°)' },
  { id: 'UmmAlQura', nameAr: 'جامعة أم القرى - مكة المكرمة', desc: 'المملكة العربية السعودية والخليج العربي (فجر 18.5°، عشاء +90د)' },
  { id: 'MuslimWorldLeague', nameAr: 'رابطة العالم الإسلامي', desc: 'أوروبا، الشرق الأقصى، أجزاء من أمريكا (فجر 18°، عشاء 17°)' },
  { id: 'NorthAmerica', nameAr: 'أمريكا الشمالية (ISNA)', desc: 'الولايات المتحدة الأمريكية وكندا (فجر 15°، عشاء 15°)' },
  { id: 'Dubai', nameAr: 'دائرة الشؤون الإسلامية - دبي', desc: 'دولة الإمارات العربية المتحدة (فجر 18.2°، عشاء 18.2°)' },
  { id: 'Kuwait', nameAr: 'وزارة الأوقاف والشؤون الإسلامية - الكويت', desc: 'دولة الكويت (فجر 18°، عشاء 17.5°)' },
  { id: 'Qatar', nameAr: 'وزارة الأوقاف والشؤون الإسلامية - قطر', desc: 'دولة قطر (فجر 18°، عشاء +90د)' },
  { id: 'Karachi', nameAr: 'جامعة العلوم الإسلامية بكراتشي', desc: 'باكستان، الهند، بنغلاديش، أفغانستان (فجر 18°، عشاء 18°)' },
  { id: 'Singapore', nameAr: 'مجلس أوغاما إسلام سينغافورا (MUIS)', desc: 'سنغافورة، ماليزيا، إندونيسيا (فجر 20°، عشاء 18°)' },
  { id: 'Turkey', nameAr: 'رئاسة الشؤون الدينية التركية (Diyanet)', desc: 'تركيا وأوروبا الشرقية (فجر 18°، عشاء 17°)' },
  { id: 'France', nameAr: 'اتحاد المنظمات الإسلامية بفرنسا (UOIF)', desc: 'فرنسا ومعظم أوروبا الغربية (فجر 12°، عشاء 12°)' },
  { id: 'MoonsightingCommittee', nameAr: 'لجنة رؤية الهلال العالمية', desc: 'طريقة رؤية الهلال المعتمدة (فجر 18°، عشاء 18°)' }
];

export const getMethodParams = (methodKey) => {
  switch (methodKey) {
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'MuslimWorldLeague':
      return CalculationMethod.MuslimWorldLeague();
    case 'NorthAmerica':
      return CalculationMethod.NorthAmerica();
    case 'Dubai':
      return CalculationMethod.Dubai();
    case 'Kuwait':
      return CalculationMethod.Kuwait();
    case 'Qatar':
      return CalculationMethod.Qatar();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'Singapore':
      return CalculationMethod.Singapore();
    case 'Turkey': {
      const p = CalculationMethod.Other();
      p.fajrAngle = 18;
      p.ishaAngle = 17;
      return p;
    }
    case 'France': {
      const p = CalculationMethod.Other();
      p.fajrAngle = 12;
      p.ishaAngle = 12;
      return p;
    }
    case 'MoonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee();
    default:
      return CalculationMethod.Egyptian();
  }
};

/**
 * Computes prayer times for a specific date with all user custom offsets and Iqamah timings
 */
export const calculatePrayerTimes = (date, settings) => {
  const { location, calculationMethod, madhab, prayerOffsets, eqamaOffsets } = settings;
  const coordinates = new Coordinates(location.lat, location.lng);
  
  const params = getMethodParams(calculationMethod || 'Egyptian');
  if (madhab === 'hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }
  params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

  // Calculate standard astronomical times
  const prayerTimesObj = new PrayerTimes(coordinates, date, params);

  // Apply custom +/- minute offsets for each prayer
  const applyOffset = (baseTime, offsetMinutes = 0) => {
    if (!baseTime) return null;
    return new Date(baseTime.getTime() + (offsetMinutes || 0) * 60 * 1000);
  };

  const fajrTime = applyOffset(prayerTimesObj.fajr, prayerOffsets?.fajr);
  const sunriseTime = applyOffset(prayerTimesObj.sunrise, prayerOffsets?.sunrise);
  const dhuhrTime = applyOffset(prayerTimesObj.dhuhr, prayerOffsets?.dhuhr);
  const asrTime = applyOffset(prayerTimesObj.asr, prayerOffsets?.asr);
  const maghribTime = applyOffset(prayerTimesObj.maghrib, prayerOffsets?.maghrib);
  const ishaTime = applyOffset(prayerTimesObj.isha, prayerOffsets?.isha);

  // Calculate Iqamah times (Azan time + Iqamah offset minutes)
  const fajrEqama = new Date(fajrTime.getTime() + (eqamaOffsets?.fajr ?? 20) * 60 * 1000);
  const dhuhrEqama = new Date(dhuhrTime.getTime() + (eqamaOffsets?.dhuhr ?? 15) * 60 * 1000);
  const asrEqama = new Date(asrTime.getTime() + (eqamaOffsets?.asr ?? 15) * 60 * 1000);
  const maghribEqama = new Date(maghribTime.getTime() + (eqamaOffsets?.maghrib ?? 10) * 60 * 1000);
  const ishaEqama = new Date(ishaTime.getTime() + (eqamaOffsets?.isha ?? 15) * 60 * 1000);

  const prayers = [
    { id: 'fajr', nameAr: 'الفَجْر', time: fajrTime, eqamaTime: fajrEqama, eqamaOffset: eqamaOffsets?.fajr ?? 20, hasIqamah: true },
    { id: 'sunrise', nameAr: 'الشُّرُوق', time: sunriseTime, eqamaTime: null, eqamaOffset: 0, hasIqamah: false },
    { id: 'dhuhr', nameAr: 'الظُّهْر', time: dhuhrTime, eqamaTime: dhuhrEqama, eqamaOffset: eqamaOffsets?.dhuhr ?? 15, hasIqamah: true },
    { id: 'asr', nameAr: 'العَصْر', time: asrTime, eqamaTime: asrEqama, eqamaOffset: eqamaOffsets?.asr ?? 15, hasIqamah: true },
    { id: 'maghrib', nameAr: 'المَغْرِب', time: maghribTime, eqamaTime: maghribEqama, eqamaOffset: eqamaOffsets?.maghrib ?? 10, hasIqamah: true },
    { id: 'isha', nameAr: 'العِشَاء', time: ishaTime, eqamaTime: ishaEqama, eqamaOffset: eqamaOffsets?.isha ?? 15, hasIqamah: true }
  ];

  return {
    raw: prayerTimesObj,
    prayers,
    fajr: fajrTime,
    sunrise: sunriseTime,
    dhuhr: dhuhrTime,
    asr: asrTime,
    maghrib: maghribTime,
    isha: ishaTime
  };
};

/**
 * Determines current active prayer, next prayer, and live countdown info
 */
export const getActivePrayerState = (now, settings) => {
  const todayTimes = calculatePrayerTimes(now, settings);
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowTimes = calculatePrayerTimes(tomorrowDate, settings);
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayTimes = calculatePrayerTimes(yesterdayDate, settings);

  const nowMs = now.getTime();
  const prayers = todayTimes.prayers;

  let currentPrayer = null;
  let nextPrayer = null;
  let prevPrayerTime = null;

  if (nowMs < prayers[0].time.getTime()) {
    // Before today's Fajr -> current is yesterday's Isha, next is today's Fajr
    currentPrayer = { ...yesterdayTimes.prayers[5], isYesterday: true };
    nextPrayer = prayers[0];
    prevPrayerTime = yesterdayTimes.prayers[5].time;
  } else if (nowMs >= prayers[5].time.getTime()) {
    // After today's Isha -> current is today's Isha, next is tomorrow's Fajr
    currentPrayer = prayers[5];
    nextPrayer = { ...tomorrowTimes.prayers[0], isTomorrow: true };
    prevPrayerTime = prayers[5].time;
  } else {
    for (let i = 0; i < prayers.length - 1; i++) {
      const pCurrent = prayers[i];
      const pNext = prayers[i + 1];
      if (nowMs >= pCurrent.time.getTime() && nowMs < pNext.time.getTime()) {
        currentPrayer = pCurrent;
        nextPrayer = pNext;
        prevPrayerTime = pCurrent.time;
        break;
      }
    }
  }

  // Calculate live countdown to next prayer
  const diffMs = nextPrayer.time.getTime() - nowMs;
  const totalDurationMs = nextPrayer.time.getTime() - prevPrayerTime.getTime();
  const elapsedMs = nowMs - prevPrayerTime.getTime();
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  // Check if we are currently in an active Iqamah window
  // (i.e. between Azan and Eqama for a today's prayer that has an Iqamah)
  let isEqamaWindow = false;
  let eqamaCountdownSecs = 0;
  let activeEqamaPrayer = null;

  if (
    currentPrayer &&
    !currentPrayer.isYesterday &&
    !currentPrayer.isTomorrow &&
    currentPrayer.hasIqamah &&
    currentPrayer.eqamaTime
  ) {
    const eqamaDiffMs = currentPrayer.eqamaTime.getTime() - nowMs;
    if (nowMs >= currentPrayer.time.getTime() && eqamaDiffMs >= 0) {
      isEqamaWindow = true;
      eqamaCountdownSecs = Math.floor(eqamaDiffMs / 1000);
      activeEqamaPrayer = currentPrayer;
    }
  }

  return {
    todayTimes,
    currentPrayer,
    nextPrayer,
    countdown: {
      hours,
      minutes,
      seconds,
      totalSecs,
      progressPercent,
      formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },
    eqamaState: {
      isEqamaWindow,
      secondsRemaining: eqamaCountdownSecs,
      minutes: Math.floor(eqamaCountdownSecs / 60),
      seconds: eqamaCountdownSecs % 60,
      prayer: activeEqamaPrayer,
      formatted: `${String(Math.floor(eqamaCountdownSecs / 60)).padStart(2, '0')}:${String(eqamaCountdownSecs % 60).padStart(2, '0')}`
    }
  };
};

/**
 * Formats a Date object to Arabic 12-hour or 24-hour time string
 */
export const formatPrayerTime = (date, timeFormat = '12h') => {
  if (!date) return '--:--';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const minsStr = minutes < 10 ? '0' + minutes : minutes;

  if (timeFormat === '24h') {
    const hrsStr = hours < 10 ? '0' + hours : hours;
    return `${hrsStr}:${minsStr}`;
  }

  // 12-hour format with Arabic ص / م
  const isPM = hours >= 12;
  hours = hours % 12;
  hours = hours ? hours : 12;
  const suffix = isPM ? 'م' : 'ص';
  return `${hours}:${minsStr} ${suffix}`;
};

/**
 * Computes authentic Hijri Date string with optional day offset
 */
export const getHijriDate = (date = new Date(), offsetDays = 0) => {
  try {
    const targetDate = new Date(date.getTime() + (offsetDays || 0) * 24 * 60 * 60 * 1000);
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(targetDate);
  } catch (e) {
    return 'التاريخ الهجري';
  }
};

/**
 * Calculates Qibla direction bearing in degrees from North
 */
export const getQiblaBearing = (lat, lng) => {
  try {
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;
    if (Math.abs(lat - KAABA_LAT) < 0.0002 && Math.abs(lng - KAABA_LNG) < 0.0002) {
      return 0; // Directly at Kaaba
    }
    const coordinates = new Coordinates(lat, lng);
    const bearing = Qibla(coordinates);
    if (isNaN(bearing) || bearing === null || typeof bearing === 'undefined') {
      return 0;
    }
    return (Math.round(bearing) % 360 + 360) % 360;
  } catch (e) {
    return 135;
  }
};

/**
 * Calculates Great-Circle distance to the Kaaba in kilometers
 */
export const getDistanceToKaabaKm = (lat, lng) => {
  const KAABA_LAT = 21.422487;
  const KAABA_LNG = 39.826206;
  const R = 6371; // Earth radius in km

  const dLat = (KAABA_LAT - lat) * (Math.PI / 180);
  const dLng = (KAABA_LNG - lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat * (Math.PI / 180)) *
      Math.cos(KAABA_LAT * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};
