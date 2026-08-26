import React from 'react';
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
  Calendar
} from 'lucide-react';
import { formatPrayerTime, getHijriDate } from '../services/prayerEngine';
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
  onOpenAudioSettings
}) => {
  if (!prayerState) return null;

  const { todayTimes, nextPrayer, currentPrayer, countdown, eqamaState } = prayerState;
  const prayers = todayTimes.prayers;
  const hijriStr = getHijriDate(new Date(), settings.hijriOffset || 0);
  const fastingInfo = getSunnahFastingInfo(new Date(), settings.hijriOffset || 0);

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

        <div className="hijri-badge">
          <Calendar size={14} color="var(--gold-light)" />
          <span>{hijriStr}</span>
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
    </div>
  );
};
