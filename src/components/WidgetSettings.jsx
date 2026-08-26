import React, { useState } from 'react';
import {
  Smartphone,
  Bell,
  Clock,
  Layers,
  Sliders,
  Sunrise,
  Sun,
  Sunset,
  CloudSun,
  Moon,
  Sparkles,
  Info,
  Check,
  Palette,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { formatPrayerTime, getHijriDate } from '../services/prayerEngine';
import { notificationEngine } from '../services/notificationEngine';
import { hapticEngine } from '../services/hapticEngine';

const PRAYER_ICONS = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: Sunset,
  maghrib: CloudSun,
  isha: Moon
};

export const WidgetSettings = ({ prayerState, settings, onUpdateSettings }) => {
  const widgetConfig = settings.widgetCustomizer || {
    layout: '4x1',
    timeFormat: '12h',
    borderRadius: 16,
    paddingMode: 'normal',
    bgStyle: 'glass',
    showIqamah: true,
    showHijri: true,
    showNextTag: true
  };

  const { todayTimes, nextPrayer, currentPrayer, countdown, eqamaState } = prayerState;
  const prayers = todayTimes.prayers;
  const hijriStr = getHijriDate(new Date(), settings.hijriOffset || 0);

  const updateConfig = (patch) => {
    hapticEngine.tap();
    const updated = {
      ...settings,
      widgetCustomizer: {
        ...widgetConfig,
        ...patch
      }
    };
    onUpdateSettings(updated);
  };

  const handleActivateLockscreenNotification = async () => {
    hapticEngine.tap();
    const granted = await notificationEngine.requestPermission();
    notificationEngine.updateLockscreenWidget(
      currentPrayer,
      nextPrayer,
      countdown.formatted,
      eqamaState?.isEqamaWindow,
      eqamaState?.formatted
    );

    const titleText = eqamaState?.isEqamaWindow
      ? `إقامة صلاة ${currentPrayer?.nameAr || 'الصلاة'}`
      : `الصلاة القادمة: ${nextPrayer.nameAr}`;
    const bodyText = eqamaState?.isEqamaWindow
      ? `متبقي على الإقامة: ${eqamaState.formatted} • ${settings.location.nameAr}`
      : `متبقي على الأذان: ${countdown.formatted} • ${settings.location.nameAr}`;

    await notificationEngine.updatePinnedOngoingNotification(titleText, bodyText);
  };

  // Determine dynamic preview styles based on user customizations
  const getWidgetPadding = () => {
    if (widgetConfig.paddingMode === 'compact') return '8px 12px';
    if (widgetConfig.paddingMode === 'spacious') return '20px 22px';
    return '14px 16px';
  };

  const getWidgetBackground = () => {
    switch (widgetConfig.bgStyle) {
      case 'oled':
        return '#000000';
      case 'sapphire':
        return 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))';
      case 'outline':
        return 'transparent';
      case 'glass':
      default:
        return 'linear-gradient(145deg, rgba(6, 40, 29, 0.85), rgba(4, 20, 15, 0.92))';
    }
  };

  const getWidgetBorder = () => {
    if (widgetConfig.bgStyle === 'outline') return '2px solid var(--emerald-primary)';
    if (widgetConfig.bgStyle === 'oled') return '1px solid rgba(255, 255, 255, 0.15)';
    return '1px solid var(--border-emerald)';
  };

  return (
    <div className="settings-tab-content">
      {/* 1. Android Pinned Lockscreen / Status Bar Notification */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Smartphone size={20} color="var(--emerald-light)" />
          <span>ودجت شاشة القفل والإشعار الدائم (Pinned Widget)</span>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          إشعار مثبت في شريط الحالة وشاشة القفل يعرض الوقت المتبقي للأذان، والعد التنازلي التلقائي للإقامة أثناء وقت الصلاة.
        </p>

        <button
          className="athkar-tap-counter-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '11px', background: 'var(--emerald-primary)', color: '#042f22' }}
          onClick={handleActivateLockscreenNotification}
        >
          <Bell size={18} />
          <span>تفعيل وتثبيت الإشعار الدائم في شريط الحالة</span>
        </button>
      </div>

      {/* 2. Customizable Home Screen Widget Editor */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Sliders size={20} color="var(--gold-light)" />
          <span>تخصيص ودجت الشاشة الرئيسية (Home Screen Widget)</span>
        </div>

        {/* Live Widget Preview Card */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              معاينة الودجت المباشرة (Live Preview):
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              مباشر
            </span>
          </div>

          <div
            className="widget-live-preview-box"
            style={{
              background: getWidgetBackground(),
              border: getWidgetBorder(),
              borderRadius: `${widgetConfig.borderRadius}px`,
              padding: getWidgetPadding(),
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
              transition: 'all 0.25s ease'
            }}
          >
            {/* 4x1 Layout */}
            {widgetConfig.layout === '4x1' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  {widgetConfig.showHijri && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--gold-light)', fontWeight: '600', display: 'block' }}>
                      {hijriStr}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-arabic-calligraphy)' }}>
                      {nextPrayer.nameAr}
                    </span>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      ({formatPrayerTime(nextPrayer.time, widgetConfig.timeFormat)})
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  {widgetConfig.showNextTag && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                      متبقي على الأذان:
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: '1.35rem', fontWeight: '800', color: 'var(--emerald-light)' }}>
                    {countdown.formatted}
                  </span>
                </div>
              </div>
            )}

            {/* 4x2 Grid Layout */}
            {widgetConfig.layout === '4x2' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gold-light)' }}>
                    {settings.location.nameAr} • {widgetConfig.showHijri ? hijriStr : ''}
                  </span>
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.85rem', color: 'var(--emerald-light)', fontWeight: '700' }}>
                    متبقي: {countdown.formatted}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {prayers.map((p) => {
                    const IconC = PRAYER_ICONS[p.id] || Moon;
                    const isN = nextPrayer.id === p.id;
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: isN ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isN ? '1px solid var(--emerald-primary)' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: `${Math.max(6, widgetConfig.borderRadius / 2)}px`,
                          padding: '6px 4px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <IconC size={15} color={isN ? 'var(--emerald-light)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', margin: '2px 0', color: isN ? 'var(--emerald-light)' : 'var(--text-primary)' }}>
                          {p.nameAr}
                        </span>
                        <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.78rem', color: isN ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '600' }}>
                          {formatPrayerTime(p.time, widgetConfig.timeFormat)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2x2 Square Countdown Layout */}
            {widgetConfig.layout === '2x2' && (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', display: 'block' }}>
                  {widgetConfig.showHijri ? hijriStr : settings.location.nameAr}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-arabic-calligraphy)', margin: '4px 0', display: 'block' }}>
                  {nextPrayer.nameAr}
                </span>
                <div style={{ fontFamily: 'var(--font-num)', fontSize: '1.6rem', fontWeight: '900', color: 'var(--emerald-light)', letterSpacing: '1px' }}>
                  {countdown.formatted}
                </div>
                {widgetConfig.showIqamah && eqamaState?.isEqamaWindow && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)', marginTop: '4px' }}>
                    الإقامة خلال: {eqamaState.formatted}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Customization Options Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Layout Picker */}
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              نمط وحجم الودجت (Layout):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { id: '4x1', label: '٤×١ مدمج' },
                { id: '4x2', label: '٤×٢ شبكة' },
                { id: '2x2', label: '٢×٢ مربع' }
              ].map((l) => (
                <button
                  key={l.id}
                  className={`subtab-pill ${widgetConfig.layout === l.id ? 'active' : ''}`}
                  onClick={() => updateConfig({ layout: l.id })}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Format Toggle (12h vs 24h) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              صيغة الوقت في الودجت:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`subtab-pill ${widgetConfig.timeFormat === '12h' ? 'active' : ''}`}
                onClick={() => updateConfig({ timeFormat: '12h' })}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                ١٢ ساعة (ص/م)
              </button>
              <button
                className={`subtab-pill ${widgetConfig.timeFormat === '24h' ? 'active' : ''}`}
                onClick={() => updateConfig({ timeFormat: '24h' })}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                ٢٤ ساعة
              </button>
            </div>
          </div>

          {/* Border Radius Slider (0 - 32px) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                استدارة الحواف (Border Radius):
              </span>
              <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.82rem', color: 'var(--emerald-light)' }}>
                {widgetConfig.borderRadius}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              step="4"
              value={widgetConfig.borderRadius}
              onChange={(e) => updateConfig({ borderRadius: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--emerald-primary)' }}
            />
          </div>

          {/* Border Padding / Margin Mode (Compact vs Spacious) */}
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              حجم الهوامش والحدود الداخلية:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { id: 'compact', label: 'مضغوط (أقل حدود)' },
                { id: 'normal', label: 'متوازن' },
                { id: 'spacious', label: 'موسّع' }
              ].map((p) => (
                <button
                  key={p.id}
                  className={`subtab-pill ${widgetConfig.paddingMode === p.id ? 'active' : ''}`}
                  onClick={() => updateConfig({ paddingMode: p.id })}
                  style={{ fontSize: '0.75rem' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Style */}
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              مظهر وخلفية الودجت:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {[
                { id: 'glass', label: 'زجاجي زمردي (Glass)' },
                { id: 'oled', label: 'أسود ليلي (OLED)' },
                { id: 'sapphire', label: 'كحلي ملكي' },
                { id: 'outline', label: 'شفاف بإطار فقط' }
              ].map((b) => (
                <button
                  key={b.id}
                  className={`subtab-pill ${widgetConfig.bgStyle === b.id ? 'active' : ''}`}
                  onClick={() => updateConfig({ bgStyle: b.id })}
                  style={{ fontSize: '0.78rem' }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span>إظهار التاريخ الهجري في الودجت</span>
              <input
                type="checkbox"
                checked={widgetConfig.showHijri}
                onChange={(e) => updateConfig({ showHijri: e.target.checked })}
                style={{ accentColor: 'var(--emerald-primary)', width: '16px', height: '16px' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span>إظهار العد التنازلي للإقامة أثناء وقت الصلاة</span>
              <input
                type="checkbox"
                checked={widgetConfig.showIqamah}
                onChange={(e) => updateConfig({ showIqamah: e.target.checked })}
                style={{ accentColor: 'var(--emerald-primary)', width: '16px', height: '16px' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Android PWA Installation Guide */}
      <div className="settings-section-card" style={{ background: 'rgba(245, 158, 11, 0.06)', borderColor: 'var(--border-gold)' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Info size={20} color="var(--gold-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--gold-light)', display: 'block', marginBottom: '4px' }}>
              تثبيت التطبيق على الشاشة الرئيسية للهاتف:
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              من متصفح هاتفك (Chrome أو Samsung Internet)، اضغط على زر القائمة (⋮) ثم اختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong> لتفعيل ميزة العمل بدون إنترنت والودجت الكامل.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
