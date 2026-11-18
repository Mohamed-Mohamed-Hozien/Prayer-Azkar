import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Volume2,
  Sliders,
  Sparkles,
  Sunrise,
  Sun,
  Sunset,
  CloudSun,
  Moon,
  Heart,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from 'lucide-react';
import { formatPrayerTime, getHijriDate, calculateIslamicNightTimes } from '../services/prayerEngine';
import { getSunnahFastingInfo } from '../data/islamicCalendar';
import { hapticEngine } from '../services/hapticEngine';

const PRAYER_ICONS = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: Sunset,
  maghrib: CloudSun,
  isha: Moon
};

export const PrayerView = ({
  prayerState,
  settings,
  onOpenLocationModal,
  onOpenTimingSettings,
  onOpenAudioSettings,
  onOpenHabitTracker
}) => {
  if (!prayerState) return null;

  const [isNightTimesExpanded, setIsNightTimesExpanded] = useState(true);

  const { todayTimes, nextPrayer, currentPrayer, countdown, eqamaState } = prayerState;
  const prayers = todayTimes.prayers;
  const today = new Date();
  const hijriStr = getHijriDate(today, settings.hijriOffset || 0);
  const fastingInfo = getSunnahFastingInfo(today, settings.hijriOffset || 0);
  const gregorianStr = today.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const nightTimes = prayerState.nightTimes || todayTimes?.nightTimes || calculateIslamicNightTimes(today, settings);

  // Friday Sunnahs & Response Hour (ساعة الاستجابة) logic
  const isFriday = (todayTimes?.fajr ? new Date(todayTimes.fajr).getDay() : today.getDay()) === 5;
  const maghribTime = todayTimes.maghrib;
  let responseHourState = null;
  if (isFriday && maghribTime) {
    const responseHourStart = new Date(maghribTime.getTime() - 60 * 60 * 1000);
    const responseHourEnd = maghribTime;
    const nowMs = today.getTime();

    if (nowMs < responseHourStart.getTime()) {
      const diffMs = responseHourStart.getTime() - nowMs;
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      responseHourState = {
        status: 'upcoming',
        hours,
        minutes,
        seconds,
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        windowTimeFormatted: `${formatPrayerTime(responseHourStart, settings.timeFormat)} - ${formatPrayerTime(responseHourEnd, settings.timeFormat)}`
      };
    } else if (nowMs >= responseHourStart.getTime() && nowMs < responseHourEnd.getTime()) {
      const diffMs = responseHourEnd.getTime() - nowMs;
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
      const minutes = Math.floor(totalSecs / 60);
      const seconds = totalSecs % 60;
      responseHourState = {
        status: 'active',
        minutes,
        seconds,
        formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        windowTimeFormatted: `${formatPrayerTime(responseHourStart, settings.timeFormat)} - ${formatPrayerTime(responseHourEnd, settings.timeFormat)}`
      };
    } else {
      responseHourState = {
        status: 'passed',
        windowTimeFormatted: `${formatPrayerTime(responseHourStart, settings.timeFormat)} - ${formatPrayerTime(responseHourEnd, settings.timeFormat)}`
      };
    }
  }

  return (
    <div className="prayer-view-wrapper">
      {/* Location & Header Strip */}
      <div className="prayer-header-strip">
        <button
          className="location-pill-btn"
          onClick={() => {
            hapticEngine.tap();
            onOpenLocationModal();
          }}
        >
          <MapPin size={16} color="var(--emerald-light)" />
          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{settings.location.nameAr}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({settings.location.countryAr})</span>
        </button>

        <div className="hijri-badge" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '2px', padding: '6px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--gold-light)" />
            <span>{hijriStr}</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.8 }}>{gregorianStr}</span>
        </div>
      </div>

      {/* Gentle Sunnah Fasting Reminder Banner (if enabled and applicable) */}
      {settings.fastingReminderEnabled !== false && fastingInfo.isSunnahFastingToday && (
        <div className="fasting-reminder-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={16} color="var(--gold-light)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--gold-light)', lineHeight: '1.4' }}>
              {fastingInfo.primaryReason}
            </span>
          </div>
        </div>
      )}

      {/* Friday Sunnahs Suite (When today is Friday) */}
      {isFriday && (
        <div
          className="friday-sunnahs-card"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.08), var(--bg-card))',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            gridColumn: '1 / -1',
            boxShadow: '0 6px 24px rgba(245, 158, 11, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Card Title & Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-light)'
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      color: 'var(--gold-light)',
                      fontFamily: 'var(--font-arabic-calligraphy)'
                    }}
                  >
                    جناح يوم الجمعة المباركة
                  </h3>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: 'var(--gold-light)',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    سُنن الجمعة
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  «خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الجُمُعَةِ»
                </span>
              </div>
            </div>
          </div>

          {/* Response Hour (ساعة الاستجابة) Countdown Live Box */}
          {responseHourState && (
            <div
              style={{
                background: responseHourState.status === 'active'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(245, 158, 11, 0.18))'
                  : 'var(--bg-card-elevated)',
                border: `1px solid ${responseHourState.status === 'active' ? 'var(--border-emerald)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: responseHourState.status === 'active' ? '0 0 15px var(--emerald-glow)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock
                  size={22}
                  color={responseHourState.status === 'active' ? 'var(--emerald-light)' : 'var(--gold-light)'}
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      color: responseHourState.status === 'active' ? 'var(--emerald-light)' : 'var(--text-primary)',
                      display: 'block'
                    }}
                  >
                    {responseHourState.status === 'active'
                      ? '⚡ حان وقت ساعة الاستجابة الآن!'
                      : responseHourState.status === 'passed'
                      ? 'ساعة الاستجابة'
                      : 'ساعة الاستجابة (آخر ساعة قبل المغرب)'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {responseHourState.status === 'active'
                      ? 'اغتنم الفرصة بالدعاء والتضرع، ينتهي وقتها مع أذان المغرب'
                      : responseHourState.status === 'passed'
                      ? 'انقضت ساعة الاستجابة لهذا اليوم، تقبل الله صالح دعائكم'
                      : `موعدها اليوم من ${responseHourState.windowTimeFormatted}`}
                  </span>
                </div>
              </div>

              {responseHourState.status !== 'passed' && (
                <div
                  style={{
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-num)',
                      fontSize: '1.15rem',
                      fontWeight: '800',
                      color: responseHourState.status === 'active' ? 'var(--emerald-light)' : 'var(--gold-light)',
                      display: 'block',
                      lineHeight: '1.1'
                    }}
                  >
                    {responseHourState.formatted}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {responseHourState.status === 'active' ? 'متبقي حتى المغرب' : 'متبقي على بدايتها'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Grid of 3 Sunnah Reminders */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px'
            }}
          >
            {/* 1. سورة الكهف */}
            <div
              style={{
                background: 'var(--bg-card-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-light)',
                  flexShrink: 0
                }}
              >
                <BookOpen size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>
                  قراءة سورة الكهف
                </span>
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  «مَنْ قَرَأَ سُورَةَ الكَهْفِ فِي يَوْمِ الجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الجُمُعَتَيْنِ»
                </p>
              </div>
            </div>

            {/* 2. الصلاة على النبي ﷺ */}
            <div
              style={{
                background: 'var(--bg-card-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                  flexShrink: 0
                }}
              >
                <Heart size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>
                  إكثار الصلاة على النبي ﷺ
                </span>
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  «أَكْثِرُوا عَلَيَّ مِنَ الصَّلَاةِ فِيهِ فَإِنَّ صَلَاتَكُمْ مَعْرُوضَةٌ عَلَيَّ»
                </p>
              </div>
            </div>

            {/* 3. الاغتسال والتطيب والتبكير */}
            <div
              style={{
                background: 'var(--bg-card-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--emerald-light)',
                  flexShrink: 0
                }}
              >
                <Sparkles size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>
                  الاغتسال والتطيب والتبكير
                </span>
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  الغسل والسواك والتطيب، ولبس أحسن الثياب، والتبكير لصلاة الجمعة والإنصات للخطيب.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Iqamah Window Live Countdown Banner */}
      {eqamaState?.isEqamaWindow && (
        <div className="eqama-live-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-dot" />
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#042f22' }}>
              حان وقت {currentPrayer?.nameAr || 'الصلاة'} • متبقي على الإقامة: {eqamaState.formatted}
            </span>
          </div>
        </div>
      )}

      {/* Main Hero Card: Next Prayer & Countdown */}
      <div className="prayer-hero-card">
        <div className="prayer-hero-top">
          <div>
            <span className="prayer-hero-tag">الصلاة القادمة</span>
            <h1 className="prayer-hero-title">{nextPrayer.nameAr}</h1>
          </div>

          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
              موعد الأذان
            </span>
            <span className="prayer-hero-time">
              {formatPrayerTime(nextPrayer.time, settings.timeFormat)}
            </span>
          </div>
        </div>

        {/* Live Animated Countdown Box */}
        <div className="prayer-countdown-container">
          <div className="prayer-countdown-digits">
            <div className="countdown-box">
              <span className="countdown-val">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="countdown-lbl">ساعة</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-box">
              <span className="countdown-val">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="countdown-lbl">دقيقة</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-box">
              <span className="countdown-val">{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="countdown-lbl">ثانية</span>
            </div>
          </div>

          {/* Linear Progress Bar to Next Prayer */}
          <div className="prayer-progress-track">
            <div
              className="prayer-progress-fill"
              style={{ width: `${countdown.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick settings action triggers */}
        <div className="prayer-hero-actions">
          <button
            className="hero-action-chip"
            onClick={() => {
              hapticEngine.tap();
              onOpenAudioSettings();
            }}
          >
            <Volume2 size={14} color="var(--emerald-light)" />
            <span>المؤذن: {settings.reciter === 'makkah' ? 'الحرم المكي' : settings.reciter === 'madinah' ? 'المسجد النبوي' : settings.reciter === 'alafasy' ? 'العفاسي' : settings.reciter === 'abdulbasit' ? 'عبد الباسط' : 'مخصص'}</span>
          </button>

          <button
            className="hero-action-chip"
            onClick={() => {
              hapticEngine.tap();
              onOpenHabitTracker && onOpenHabitTracker();
            }}
          >
            <CheckCircle size={14} color="var(--emerald-light)" />
            <span>سجل الصلوات والفوائت</span>
          </button>

          <button
            className="hero-action-chip"
            onClick={() => {
              hapticEngine.tap();
              onOpenTimingSettings();
            }}
          >
            <Sliders size={14} color="var(--gold-light)" />
            <span>ضبط وتعديل المواقيت</span>
          </button>
        </div>
      </div>

      {/* Daily 5 Prayers Timeline List */}
      <div className="prayers-timeline-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            مواقيت اليوم في {settings.location.nameAr}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {settings.calculationMethod === 'Egyptian' ? 'الهيئة المصرية' : settings.calculationMethod === 'UmmAlQura' ? 'أم القرى' : 'فلكي'}
          </span>
        </div>

        <div className="prayers-list-container">
          {prayers.map((p) => {
            const IconComp = PRAYER_ICONS[p.id] || Moon;
            const isNext = nextPrayer.id === p.id;
            const isCurrent = currentPrayer?.id === p.id && !currentPrayer.isYesterday;

            let cardStatusClass = '';
            if (isNext) cardStatusClass = 'is-next';
            else if (isCurrent) cardStatusClass = 'is-current';

            return (
              <div
                key={p.id}
                className={`prayer-row-item ${cardStatusClass}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`prayer-icon-box ${isNext ? 'next' : ''}`}>
                    <IconComp size={18} />
                  </div>
                  <div>
                    <span className="prayer-name-ar">{p.nameAr}</span>
                    {p.hasIqamah && (
                      <span className="prayer-eqama-hint">
                        الإقامة: {formatPrayerTime(p.eqamaTime, settings.timeFormat)} (+{p.eqamaOffset}د)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <span className="prayer-time-val">
                    {formatPrayerTime(p.time, settings.timeFormat)}
                  </span>
                  {isNext && (
                    <span className="next-badge">القادمة</span>
                  )}
                  {isCurrent && (
                    <span className="current-badge">الحالية</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable/Glanceable Section: Islamic Night Times & Duha (أوقات السحر وقيام الليل والضحى) */}
      <div
        className="islamic-night-times-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          gridColumn: '1 / -1',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Header & Toggle */}
        <div
          onClick={() => {
            hapticEngine.tap();
            setIsNightTimesExpanded((prev) => !prev);
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--border-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-light)'
              }}
            >
              <Moon size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '0.98rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  display: 'block'
                }}
              >
                أوقات السحر وقيام الليل والضحى
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                مواقيت النوافل والتهجد وصلاة الأوّابين
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--emerald-light)',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontWeight: '600'
              }}
            >
              {isNightTimesExpanded ? 'إخفاء' : 'عرض المواقيت'}
            </span>
            {isNightTimesExpanded ? (
              <ChevronUp size={18} color="var(--text-secondary)" />
            ) : (
              <ChevronDown size={18} color="var(--text-secondary)" />
            )}
          </div>
        </div>

        {/* Glanceable Summary Bar when collapsed */}
        {!isNightTimesExpanded && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} color="var(--gold-light)" />
              <span>الثلث الأخير:</span>
              <strong style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-num)' }}>
                {nightTimes?.lastThirdFormatted}
              </strong>
            </div>
            <span style={{ opacity: 0.4 }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon size={14} color="var(--emerald-light)" />
              <span>نصف الليل:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-num)' }}>
                {nightTimes?.midnightFormatted}
              </strong>
            </div>
            <span style={{ opacity: 0.4 }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun size={14} color="var(--gold-primary)" />
              <span>الضحى:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-num)' }}>
                {nightTimes?.duhaStartFormatted}
              </strong>
            </div>
          </div>
        )}

        {/* Expanded Detailed Grid */}
        {isNightTimesExpanded && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            {/* 1. منتصف الليل الشرعي */}
            <div
              style={{
                background: 'var(--bg-card-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Moon size={16} color="var(--emerald-light)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    منتصف الليل الشرعي
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-num)',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    color: 'var(--emerald-light)'
                  }}
                >
                  {nightTimes?.midnightFormatted}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                نهاية وقت العشاء الفعلي، ويُحسب بنصف الوقت المنقضي بين أذان المغرب وأذان الفجر الصادق.
              </p>
            </div>

            {/* 2. ثلث الليل الأخير */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--bg-card-elevated))',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--gold-light)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--gold-light)' }}>
                    ثلث الليل الأخير
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-num)',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    color: 'var(--gold-light)'
                  }}
                >
                  {nightTimes?.lastThirdFormatted}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                وقت صلاة التهجد واستجابة الدعاء والوتر والنزول الإلهي: «هَلْ مِنْ سَائِلٍ فَيُعْطَى، هَلْ مِنْ مُسْتَغْفِرٍ فَيُغْفَرَ لَهُ».
              </p>
            </div>

            {/* 3. وقت صلاة الضحى */}
            <div
              style={{
                background: 'var(--bg-card-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sun size={16} color="var(--gold-primary)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    وقت صلاة الضحى
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-num)',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: 'var(--gold-primary)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {nightTimes?.duhaStartFormatted} - {nightTimes?.duhaEndFormatted}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                صلاة الأوّابين، تبدأ بعد طلوع الشمس بارتفاع قيد رمح (نحو 15 دقيقة بعد الشروق) حتى قبيل استواء الشمس (15 دقيقة قبل الظهر).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
