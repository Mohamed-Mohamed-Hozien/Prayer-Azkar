import React, { useState } from 'react';
import {
  Clock,
  Globe,
  Sliders,
  Calendar,
  Layers,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Heart,
  VolumeX,
  BellOff,
  ShieldCheck
} from 'lucide-react';
import { CALCULATION_METHODS, PRAYER_NAMES } from '../services/prayerEngine';
import { hapticEngine } from '../services/hapticEngine';
import { getMosqueSilenceSettings, saveMosqueSilenceSettings } from '../services/silenceEngine';

export const TimingSettings = ({ settings, onUpdateSettings }) => {
  const [silenceSettings, setSilenceSettings] = useState(() => getMosqueSilenceSettings());

  const handleSilenceChange = (partial) => {
    hapticEngine.tap();
    const updated = saveMosqueSilenceSettings(partial);
    setSilenceSettings(updated);
    if (onUpdateSettings && settings) {
      onUpdateSettings({ ...settings, mosqueSilence: updated });
    }
  };
  const handleMethodChange = (methodId) => {
    hapticEngine.tap();
    onUpdateSettings({ ...settings, calculationMethod: methodId });
  };

  const handleMadhabChange = (madhabId) => {
    hapticEngine.tap();
    onUpdateSettings({ ...settings, madhab: madhabId });
  };

  const handleHijriOffsetChange = (offset) => {
    hapticEngine.tap();
    onUpdateSettings({ ...settings, hijriOffset: offset });
  };

  const handlePrayerOffsetChange = (prayerId, delta) => {
    hapticEngine.tap();
    const current = settings.prayerOffsets?.[prayerId] || 0;
    const updated = {
      ...settings,
      prayerOffsets: {
        ...settings.prayerOffsets,
        [prayerId]: current + delta
      }
    };
    onUpdateSettings(updated);
  };

  const handleEqamaOffsetChange = (prayerId, delta) => {
    hapticEngine.tap();
    const current = settings.eqamaOffsets?.[prayerId] ?? 15;
    const newVal = Math.max(1, Math.min(60, current + delta));
    const updated = {
      ...settings,
      eqamaOffsets: {
        ...settings.eqamaOffsets,
        [prayerId]: newVal
      }
    };
    onUpdateSettings(updated);
  };

  return (
    <div className="settings-tab-content">
      {/* 1. Global Calculation Methods */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Globe size={20} color="var(--emerald-light)" />
          <span>طريقة حساب المواقيت الفلكية</span>
        </div>

        <div className="calc-methods-list">
          {CALCULATION_METHODS.map((m) => {
            const isSel = (settings.calculationMethod || 'Egyptian') === m.id;
            return (
              <div
                key={m.id}
                className={`calc-method-card ${isSel ? 'selected' : ''}`}
                onClick={() => handleMethodChange(m.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`radio-dot ${isSel ? 'active' : ''}`} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: isSel ? '700' : '600', color: isSel ? 'var(--emerald-light)' : 'var(--text-primary)', display: 'block' }}>
                      {m.nameAr}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {m.desc}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Asr Juristic Method (Madhab) */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Clock size={20} color="var(--gold-light)" />
          <span>المذهب الفقهي لصلاة العصر</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
          <button
            className={`subtab-pill ${(settings.madhab || 'shafi') === 'shafi' ? 'active' : ''}`}
            onClick={() => handleMadhabChange('shafi')}
            style={{ padding: '10px', fontSize: '0.85rem' }}
          >
            الشافعي، المالكي، الحنبلي (الجمهور)
          </button>
          <button
            className={`subtab-pill ${settings.madhab === 'hanafi' ? 'active' : ''}`}
            onClick={() => handleMadhabChange('hanafi')}
            style={{ padding: '10px', fontSize: '0.85rem' }}
          >
            الحنفي (ظل الشيء مثليه)
          </button>
        </div>
      </div>

      {/* 3. Hijri Date Correction & Sunnah Fasting */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Calendar size={20} color="var(--emerald-light)" />
          <span>تعديل التاريخ الهجري وتذكيرات الصيام</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            تعديل التاريخ الهجري (مزامنة الرؤية):
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[-2, -1, 0, 1, 2].map((offset) => (
              <button
                key={offset}
                className={`subtab-pill ${(settings.hijriOffset || 0) === offset ? 'active' : ''}`}
                onClick={() => handleHijriOffsetChange(offset)}
                style={{ padding: '4px 10px', fontSize: '0.8rem', minWidth: '36px' }}
              >
                {offset > 0 ? `+${offset}` : offset}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={16} color="var(--gold-light)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              إظهار تذكيرات صيام السنن (الإثنين والخميس والأيام البيض)
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.fastingReminderEnabled !== false}
            onChange={(e) => onUpdateSettings({ ...settings, fastingReminderEnabled: e.target.checked })}
            style={{ accentColor: 'var(--emerald-primary)', width: '16px', height: '16px' }}
          />
        </div>
      </div>

      {/* 4. Manual Prayer Offsets */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Sliders size={20} color="var(--gold-light)" />
          <span>تعديل يدوي بالدقائق لأوقات الصلوات</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PRAYER_NAMES.map((p) => {
            const offset = settings.prayerOffsets?.[p.id] || 0;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-arabic-calligraphy)' }}>
                  {p.nameAr}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="icon-circle-btn"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => handlePrayerOffsetChange(p.id, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.95rem', minWidth: '40px', textAlign: 'center', color: offset !== 0 ? 'var(--emerald-light)' : 'var(--text-primary)' }}>
                    {offset > 0 ? `+${offset} د` : `${offset} د`}
                  </span>
                  <button
                    className="icon-circle-btn"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => handlePrayerOffsetChange(p.id, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Eqama Delays */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Clock size={20} color="var(--emerald-light)" />
          <span>وقت انتظار الإقامة بعد الأذان (بالدقائق)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PRAYER_NAMES.filter((p) => p.hasIqamah).map((p) => {
            const eqama = settings.eqamaOffsets?.[p.id] ?? 15;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: '600', fontFamily: 'var(--font-arabic-calligraphy)' }}>
                  إقامة {p.nameAr}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="icon-circle-btn"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => handleEqamaOffsetChange(p.id, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.95rem', minWidth: '45px', textAlign: 'center', color: 'var(--gold-light)' }}>
                    {eqama} دقيقة
                  </span>
                  <button
                    className="icon-circle-btn"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => handleEqamaOffsetChange(p.id, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Auto Mosque Silence */}
      <div className="settings-section-card" style={{ borderColor: silenceSettings.enabled ? 'rgba(16, 185, 129, 0.25)' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="settings-section-title" style={{ margin: 0 }}>
            <VolumeX size={20} color="var(--emerald-light)" />
            <span>وضع صامت المسجد التلقائي (Auto Mosque Silence)</span>
          </div>

          <label
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={silenceSettings.enabled}
              onChange={(e) => handleSilenceChange({ enabled: e.target.checked })}
              style={{
                accentColor: 'var(--emerald-primary)',
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
          </label>
        </div>

        <div style={{ opacity: silenceSettings.enabled ? 1 : 0.45, transition: 'opacity 0.2s ease', pointerEvents: silenceSettings.enabled ? 'auto' : 'none' }}>
          {/* Trigger point selection */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              توقيت تفعيل وضع الصامت:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`subtab-pill ${silenceSettings.triggerAt === 'iqamah' ? 'active' : ''}`}
                onClick={() => handleSilenceChange({ triggerAt: 'iqamah' })}
                style={{
                  padding: '9px 12px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <BellOff size={15} />
                <span>عند موعد الإقامة</span>
              </button>
              <button
                type="button"
                className={`subtab-pill ${silenceSettings.triggerAt === 'azan' ? 'active' : ''}`}
                onClick={() => handleSilenceChange({ triggerAt: 'azan' })}
                style={{
                  padding: '9px 12px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <VolumeX size={15} />
                <span>عند رفع الأذان</span>
              </button>
            </div>
          </div>

          {/* Regular prayers silence duration */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                مدة الصامت للصلوات الخمس (الصلوات اليومية):
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--emerald-light)', fontFamily: 'var(--font-num)' }}>
                {silenceSettings.duration} دقيقة
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[15, 20, 25, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`subtab-pill ${silenceSettings.duration === mins ? 'active' : ''}`}
                  onClick={() => handleSilenceChange({ duration: mins })}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.82rem',
                    textAlign: 'center',
                    fontFamily: 'var(--font-num)'
                  }}
                >
                  {mins} د
                </button>
              ))}
            </div>
          </div>

          {/* Friday (Jumu'ah) silence duration */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                مدة الصامت الخاصة بصلاة الجمعة (خطبة + صلاة):
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--gold-light)', fontFamily: 'var(--font-num)' }}>
                {silenceSettings.fridayDuration} دقيقة
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[35, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`subtab-pill ${silenceSettings.fridayDuration === mins ? 'active' : ''}`}
                  onClick={() => handleSilenceChange({ fridayDuration: mins })}
                  style={{
                    padding: '8px 8px',
                    fontSize: '0.82rem',
                    textAlign: 'center',
                    fontFamily: 'var(--font-num)'
                  }}
                >
                  {mins} دقيقة {mins === 35 ? '(قياسي)' : '(خطبة مطوّلة)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Informative / protective hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginTop: '12px',
            padding: '10px 12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.18)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            lineHeight: '1.6'
          }}
        >
          <ShieldCheck size={18} color="var(--emerald-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            يمنع إحراج رنين الهاتف أثناء صلاة الجماعة في المسجد بكتم الصوت تلقائياً، ويعيد تشغيل الصوت المعتاد فور انتهاء وقت الصلاة دون الحاجة لتذكره يدوياً.
          </span>
        </div>
      </div>
    </div>
  );
};
