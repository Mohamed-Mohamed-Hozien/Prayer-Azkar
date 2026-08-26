// Offline Database of Major Arab and Global Cities with Recommended Calculation Methods

export const CITIES_DATABASE = [
  // Egypt
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', countryAr: 'مصر', lat: 30.0444, lng: 31.2357, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', countryAr: 'مصر', lat: 31.2001, lng: 29.9187, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza', countryAr: 'مصر', lat: 30.0131, lng: 31.2089, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'tanta', nameAr: 'طنطا', nameEn: 'Tanta', countryAr: 'مصر', lat: 30.7865, lng: 31.0004, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'mansoura', nameAr: 'المنصورة', nameEn: 'Mansoura', countryAr: 'مصر', lat: 31.0409, lng: 31.3785, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut', countryAr: 'مصر', lat: 27.1783, lng: 31.1859, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', countryAr: 'مصر', lat: 25.6872, lng: 32.6396, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', countryAr: 'مصر', lat: 24.0889, lng: 32.8998, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'port_said', nameAr: 'بورسعيد', nameEn: 'Port Said', countryAr: 'مصر', lat: 31.2653, lng: 32.3019, method: 'Egyptian', timezone: 'Africa/Cairo' },
  { id: 'suez', nameAr: 'السويس', nameEn: 'Suez', countryAr: 'مصر', lat: 29.9668, lng: 32.5498, method: 'Egyptian', timezone: 'Africa/Cairo' },

  // Saudi Arabia
  { id: 'makkah', nameAr: 'مكة المكرمة', nameEn: 'Makkah', countryAr: 'السعودية', lat: 21.3891, lng: 39.8579, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'madinah', nameAr: 'المدينة المنورة', nameEn: 'Madinah', countryAr: 'السعودية', lat: 24.5247, lng: 39.5692, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'riyadh', nameAr: 'الرياض', nameEn: 'Riyadh', countryAr: 'السعودية', lat: 24.7136, lng: 46.6753, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'jeddah', nameAr: 'جدة', nameEn: 'Jeddah', countryAr: 'السعودية', lat: 21.4858, lng: 39.1925, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'dammam', nameAr: 'الدمام', nameEn: 'Dammam', countryAr: 'السعودية', lat: 26.4207, lng: 50.0888, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'khobar', nameAr: 'الخبر', nameEn: 'Khobar', countryAr: 'السعودية', lat: 26.2172, lng: 50.1971, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'taif', nameAr: 'الطائف', nameEn: 'Taif', countryAr: 'السعودية', lat: 21.4373, lng: 40.5127, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'tabuk', nameAr: 'تبوك', nameEn: 'Tabuk', countryAr: 'السعودية', lat: 28.3835, lng: 36.5662, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },
  { id: 'abha', nameAr: 'أبها', nameEn: 'Abha', countryAr: 'السعودية', lat: 18.2164, lng: 42.5053, method: 'UmmAlQura', timezone: 'Asia/Riyadh' },

  // UAE
  { id: 'dubai', nameAr: 'دبي', nameEn: 'Dubai', countryAr: 'الإمارات', lat: 25.2048, lng: 55.2708, method: 'Dubai', timezone: 'Asia/Dubai' },
  { id: 'abu_dhabi', nameAr: 'أبو ظبي', nameEn: 'Abu Dhabi', countryAr: 'الإمارات', lat: 24.4539, lng: 54.3773, method: 'Dubai', timezone: 'Asia/Dubai' },
  { id: 'sharjah', nameAr: 'الشارقة', nameEn: 'Sharjah', countryAr: 'الإمارات', lat: 25.3463, lng: 55.4209, method: 'Dubai', timezone: 'Asia/Dubai' },
  { id: 'ajman', nameAr: 'عجمان', nameEn: 'Ajman', countryAr: 'الإمارات', lat: 25.4052, lng: 55.5136, method: 'Dubai', timezone: 'Asia/Dubai' },

  // Kuwait, Qatar, Bahrain, Oman
  { id: 'kuwait_city', nameAr: 'مدينة الكويت', nameEn: 'Kuwait City', countryAr: 'الكويت', lat: 29.3759, lng: 47.9774, method: 'Kuwait', timezone: 'Asia/Kuwait' },
  { id: 'doha', nameAr: 'الدوحة', nameEn: 'Doha', countryAr: 'قطر', lat: 25.2854, lng: 51.5310, method: 'Qatar', timezone: 'Asia/Qatar' },
  { id: 'manama', nameAr: 'المنامة', nameEn: 'Manama', countryAr: 'البحرين', lat: 26.2285, lng: 50.5860, method: 'UmmAlQura', timezone: 'Asia/Bahrain' },
  { id: 'muscat', nameAr: 'مسقط', nameEn: 'Muscat', countryAr: 'سلطنة عمان', lat: 23.5880, lng: 58.3829, method: 'UmmAlQura', timezone: 'Asia/Muscat' },

  // Levant
  { id: 'jerusalem', nameAr: 'القدس الشريف', nameEn: 'Jerusalem', countryAr: 'فلسطين', lat: 31.7683, lng: 35.2137, method: 'MuslimWorldLeague', timezone: 'Asia/Jerusalem' },
  { id: 'gaza', nameAr: 'غزة', nameEn: 'Gaza', countryAr: 'فلسطين', lat: 31.5017, lng: 34.4668, method: 'Egyptian', timezone: 'Asia/Gaza' },
  { id: 'amman', nameAr: 'عمّان', nameEn: 'Amman', countryAr: 'الأردن', lat: 31.9454, lng: 35.9284, method: 'MuslimWorldLeague', timezone: 'Asia/Amman' },
  { id: 'zarqa', nameAr: 'الزرقاء', nameEn: 'Zarqa', countryAr: 'الأردن', lat: 32.0608, lng: 36.0942, method: 'MuslimWorldLeague', timezone: 'Asia/Amman' },
  { id: 'damascus', nameAr: 'دمشق', nameEn: 'Damascus', countryAr: 'سوريا', lat: 33.5138, lng: 36.2765, method: 'MuslimWorldLeague', timezone: 'Asia/Damascus' },
  { id: 'aleppo', nameAr: 'حلب', nameEn: 'Aleppo', countryAr: 'سوريا', lat: 36.2021, lng: 37.1343, method: 'MuslimWorldLeague', timezone: 'Asia/Damascus' },
  { id: 'beirut', nameAr: 'بيروت', nameEn: 'Beirut', countryAr: 'لبنان', lat: 33.8938, lng: 35.5018, method: 'MuslimWorldLeague', timezone: 'Asia/Beirut' },

  // Iraq, Yemen
  { id: 'baghdad', nameAr: 'بغداد', nameEn: 'Baghdad', countryAr: 'العراق', lat: 33.3152, lng: 44.3661, method: 'MuslimWorldLeague', timezone: 'Asia/Baghdad' },
  { id: 'basra', nameAr: 'البصرة', nameEn: 'Basra', countryAr: 'العراق', lat: 30.5081, lng: 47.7835, method: 'MuslimWorldLeague', timezone: 'Asia/Baghdad' },
  { id: 'erbil', nameAr: 'أربيل', nameEn: 'Erbil', countryAr: 'العراق', lat: 36.1901, lng: 44.0091, method: 'MuslimWorldLeague', timezone: 'Asia/Baghdad' },
  { id: 'sanaa', nameAr: 'صنعاء', nameEn: 'Sanaa', countryAr: 'اليمن', lat: 15.3694, lng: 44.1910, method: 'UmmAlQura', timezone: 'Asia/Aden' },
  { id: 'aden', nameAr: 'عدن', nameEn: 'Aden', countryAr: 'اليمن', lat: 12.7855, lng: 45.0187, method: 'UmmAlQura', timezone: 'Asia/Aden' },

  // North Africa
  { id: 'khartoum', nameAr: 'الخرطوم', nameEn: 'Khartoum', countryAr: 'السودان', lat: 15.5007, lng: 32.5599, method: 'Egyptian', timezone: 'Africa/Khartoum' },
  { id: 'tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli', countryAr: 'ليبيا', lat: 32.8872, lng: 13.1913, method: 'MuslimWorldLeague', timezone: 'Africa/Tripoli' },
  { id: 'benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi', countryAr: 'ليبيا', lat: 32.1167, lng: 20.0667, method: 'MuslimWorldLeague', timezone: 'Africa/Tripoli' },
  { id: 'tunis', nameAr: 'تونس', nameEn: 'Tunis', countryAr: 'تونس', lat: 36.8065, lng: 10.1815, method: 'MuslimWorldLeague', timezone: 'Africa/Tunis' },
  { id: 'algiers', nameAr: 'الجزائر العاصمة', nameEn: 'Algiers', countryAr: 'الجزائر', lat: 36.7538, lng: 3.0588, method: 'MuslimWorldLeague', timezone: 'Africa/Algiers' },
  { id: 'oran', nameAr: 'وهران', nameEn: 'Oran', countryAr: 'الجزائر', lat: 35.6987, lng: -0.6349, method: 'MuslimWorldLeague', timezone: 'Africa/Algiers' },
  { id: 'casablanca', nameAr: 'الدار البيضاء', nameEn: 'Casablanca', countryAr: 'المغرب', lat: 33.5731, lng: -7.5898, method: 'MuslimWorldLeague', timezone: 'Africa/Casablanca' },
  { id: 'rabat', nameAr: 'الرباط', nameEn: 'Rabat', countryAr: 'المغرب', lat: 34.0209, lng: -6.8416, method: 'MuslimWorldLeague', timezone: 'Africa/Casablanca' },
  { id: 'marrakech', nameAr: 'مراكش', nameEn: 'Marrakech', countryAr: 'المغرب', lat: 31.6295, lng: -7.9811, method: 'MuslimWorldLeague', timezone: 'Africa/Casablanca' },

  // International & Turkey
  { id: 'istanbul', nameAr: 'إسطنبول', nameEn: 'Istanbul', countryAr: 'تركيا', lat: 41.0082, lng: 28.9784, method: 'MuslimWorldLeague', timezone: 'Europe/Istanbul' },
  { id: 'ankara', nameAr: 'أنقرة', nameEn: 'Ankara', countryAr: 'تركيا', lat: 39.9334, lng: 32.8597, method: 'MuslimWorldLeague', timezone: 'Europe/Istanbul' },
  { id: 'london', nameAr: 'لندن', nameEn: 'London', countryAr: 'بريطانيا', lat: 51.5074, lng: -0.1278, method: 'MuslimWorldLeague', timezone: 'Europe/London' },
  { id: 'paris', nameAr: 'باريس', nameEn: 'Paris', countryAr: 'فرنسا', lat: 48.8566, lng: 2.3522, method: 'MuslimWorldLeague', timezone: 'Europe/Paris' },
  { id: 'berlin', nameAr: 'برلين', nameEn: 'Berlin', countryAr: 'ألمانيا', lat: 52.5200, lng: 13.4050, method: 'MuslimWorldLeague', timezone: 'Europe/Berlin' },
  { id: 'new_york', nameAr: 'نيويورك', nameEn: 'New York', countryAr: 'أمريكا', lat: 40.7128, lng: -74.0060, method: 'NorthAmerica', timezone: 'America/New_York' },
  { id: 'chicago', nameAr: 'شيكاغو', nameEn: 'Chicago', countryAr: 'أمريكا', lat: 41.8781, lng: -87.6298, method: 'NorthAmerica', timezone: 'America/Chicago' },
  { id: 'toronto', nameAr: 'تورونتو', nameEn: 'Toronto', countryAr: 'كندا', lat: 43.6532, lng: -79.3832, method: 'NorthAmerica', timezone: 'America/Toronto' },
  { id: 'sydney', nameAr: 'سيدني', nameEn: 'Sydney', countryAr: 'أستراليا', lat: -33.8688, lng: 151.2093, method: 'MuslimWorldLeague', timezone: 'Australia/Sydney' },
  { id: 'jakarta', nameAr: 'جاكرتا', nameEn: 'Jakarta', countryAr: 'إندونيسيا', lat: -6.2088, lng: 106.8456, method: 'MuslimWorldLeague', timezone: 'Asia/Jakarta' },
  { id: 'kuala_lumpur', nameAr: 'كوالالمبور', nameEn: 'Kuala Lumpur', countryAr: 'ماليزيا', lat: 3.1390, lng: 101.6869, method: 'MuslimWorldLeague', timezone: 'Asia/Kuala_Lumpur' }
];

export const CALCULATION_METHODS = [
  { id: 'Egyptian', nameAr: 'الهيئة المصرية العامة للمساحة', desc: 'زاوية الفجر ١٩.٥°، العشاء ١٧.٥°' },
  { id: 'UmmAlQura', nameAr: 'جامعة أم القرى - مكة المكرمة', desc: 'زاوية الفجر ١٨.٥°، العشاء ٩٠ دقيقة' },
  { id: 'MuslimWorldLeague', nameAr: 'رابطة العالم الإسلامي', desc: 'زاوية الفجر ١٨°، العشاء ١٧°' },
  { id: 'NorthAmerica', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)', desc: 'زاوية الفجر ١٥°، العشاء ١٥°' },
  { id: 'Dubai', nameAr: 'دائرة الشؤون الإسلامية - دبي', desc: 'زاوية الفجر ١٨.٢°، العشاء ١٨.٢°' },
  { id: 'Kuwait', nameAr: 'وزارة الأوقاف - الكويت', desc: 'زاوية الفجر ١٨°، العشاء ١٧.٥°' },
  { id: 'Qatar', nameAr: 'وزارة الأوقاف - قطر', desc: 'زاوية الفجر ١٨°، العشاء ٩٠ دقيقة' },
  { id: 'Karachi', nameAr: 'جامعة العلوم الإسلامية بكراتشي', desc: 'زاوية الفجر ١٨°، العشاء ١٨°' },
  { id: 'Singapore', nameAr: 'مجلس أوغاما إسلام سينغابورا (MUIS)', desc: 'زاوية الفجر ٢٠°، العشاء ١٨°' },
  { id: 'MoonsightingCommittee', nameAr: 'لجنة رؤية الهلال العالمية', desc: 'زاوية الفجر ١٨°، العشاء ١٨°' }
];
