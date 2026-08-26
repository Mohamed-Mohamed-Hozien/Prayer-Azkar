/**
 * Islamic Calendar & Sunnah Fasting Helpers
 */

export const ISLAMIC_MONTHS = [
  'المحرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

/**
 * Gets approximate/calculated Hijri date components
 */
export const getHijriComponents = (date = new Date(), offsetDays = 0) => {
  const adjustedDate = new Date(date.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  
  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    
    const parts = formatter.formatToParts(adjustedDate);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1446', 10);
    const monthName = ISLAMIC_MONTHS[month - 1] || 'رمضان';

    return { day, month, year, monthName, adjustedDate };
  } catch (e) {
    return { day: 1, month: 1, year: 1446, monthName: 'المحرم', adjustedDate };
  }
};

/**
 * Checks for Sunnah Fasting days (Mondays, Thursdays, White Days, Arafah, Ashura)
 */
export const getSunnahFastingInfo = (date = new Date(), offsetDays = 0) => {
  const { day, month, monthName } = getHijriComponents(date, offsetDays);
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  const fastingReasons = [];
  let isSunnahFastingToday = false;

  // 1. Mondays & Thursdays
  if (dayOfWeek === 1) {
    isSunnahFastingToday = true;
    fastingReasons.push('صيام يوم الإثنين سنة عن النبي ﷺ (تُعرض فيه الأعمال)');
  } else if (dayOfWeek === 4) {
    isSunnahFastingToday = true;
    fastingReasons.push('صيام يوم الخميس سنة عن النبي ﷺ (تُعرض فيه الأعمال)');
  }

  // 2. White Days (13, 14, 15 of Hijri Month, except Ramadan where it's mandatory fasting, and 13 Dhu al-Hijjah - Tashreeq)
  if (month !== 9) { // Not Ramadan
    if (day >= 13 && day <= 15) {
      if (!(month === 12 && day === 13)) { // Not 13 Dhu al-Hijjah
        isSunnahFastingToday = true;
        fastingReasons.push(`صيام الأيام البيض (${day} ${monthName})`);
      }
    }
  }

  // 3. Ashura & Tasu'a (9 & 10 Muharram)
  if (month === 1) {
    if (day === 9) {
      isSunnahFastingToday = true;
      fastingReasons.push('صيام تاسوعاء (المحرم)');
    } else if (day === 10) {
      isSunnahFastingToday = true;
      fastingReasons.push('صيام يوم عاشوراء (يُكفّر السنة الماضية)');
    }
  }

  // 4. Day of Arafah (9 Dhu al-Hijjah for non-pilgrims)
  if (month === 12 && day === 9) {
    isSunnahFastingToday = true;
    fastingReasons.push('صيام يوم عرفة (يُكفّر السنة الماضية والباقية)');
  }

  // 5. Ramadan Mandatory Fasting
  const isRamadan = month === 9;

  return {
    isSunnahFastingToday,
    isRamadan,
    reasons: fastingReasons,
    primaryReason: isRamadan ? `شهر رمضان المبارك - اليوم ${day}` : fastingReasons[0] || null,
    hijriDay: day,
    hijriMonth: month,
    hijriMonthName: monthName
  };
};

/**
 * Gets upcoming Islamic events
 */
export const getUpcomingIslamicEvents = (date = new Date(), offsetDays = 0) => {
  const { day, month, year } = getHijriComponents(date, offsetDays);

  const events = [
    { name: 'بداية شهر رمضان المبارك', month: 9, day: 1 },
    { name: 'عيد الفطر المبارك', month: 10, day: 1 },
    { name: 'يوم عرفة', month: 12, day: 9 },
    { name: 'عيد الأضحى المبارك', month: 12, day: 10 },
    { name: 'يوم عاشوراء', month: 1, day: 10 },
    { name: 'المولد النبوي الشريف', month: 3, day: 12 },
    { name: 'ليلة الإسراء والمعراج', month: 7, day: 27 },
    { name: 'ليلة النصف من شعبان', month: 8, day: 15 }
  ];

  return events.map(evt => {
    let monthsLeft = evt.month - month;
    if (monthsLeft < 0 || (monthsLeft === 0 && day > evt.day)) {
      monthsLeft += 12;
    }
    return {
      ...evt,
      monthsLeft
    };
  }).sort((a, b) => a.monthsLeft - b.monthsLeft);
};
