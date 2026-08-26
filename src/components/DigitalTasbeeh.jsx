import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
  CheckCircle,
  HelpCircle,
  Repeat
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../services/audioEngine';
import { hapticEngine } from '../services/hapticEngine';
import { getStoredTasbeeh, saveStoredTasbeeh } from '../services/storageEngine';

export const TASBEEH_PRESETS = [
  { id: 'subhanallah', title: 'سُبْحَانَ اللهِ', subtitle: '٣٣ مرة بعد الصلاة أو بأي وقت', defaultTarget: 33, virtue: 'تغرس لك نخلة في الجنة وتُحط الخطايا' },
  { id: 'alhamdulillah', title: 'الحَمْدُ لِلَّهِ', subtitle: '٣٣ مرة', defaultTarget: 33, virtue: 'تملأ الميزان بالخير والبركة' },
  { id: 'allahuakbar', title: 'اللهُ أَكْبَرُ', subtitle: '٣٣ مرة أو ٣٤ قبل النوم', defaultTarget: 33, virtue: 'أفضل ما يُفتتح به الدعاء والأذكار' },
  { id: 'lailahaillallah', title: 'لَا إِلَهَ إِلَّا اللهُ', subtitle: 'وحده لا شريك له', defaultTarget: 100, virtue: 'أفضل الذكر وخير ما قال النبيون' },
  { id: 'astaghfirullah', title: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ', subtitle: '١٠٠ مرة يومياً', defaultTarget: 100, virtue: 'تفريج الهموم وجلب الرزق ومغفرة الذنوب' },
  { id: 'lahawla', title: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ', subtitle: 'كنز من كنوز الجنة', defaultTarget: 33, virtue: 'دواء لتسعة وتسعين داء أيسرها الهم' },
  { id: 'salawat', title: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', subtitle: '١٠ مرات صباحاً ومساءً أو ١٠٠ مرة', defaultTarget: 100, virtue: 'من صلى عليّ صلاة صلى الله عليه بها عشراً' },
  { id: 'subhanallah_bihamdihi', title: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ ، سُبْحَانَ اللهِ العَظِيمِ', subtitle: 'كلمتان خفيفتان على اللسان ثقيلتان في الميزان', defaultTarget: 100, virtue: 'حبيبتان إلى الرحمن ثقيلتان في الميزان' },
  { id: 'hasbiyallah', title: 'حَسْبُنَا اللهُ وَنِعْمَ الوَكِيلُ', subtitle: 'دعاء الكفاية واليقين', defaultTarget: 33, virtue: 'قالها إبراهيم حين ألقي في النار وقالها محمد ﷺ' },
  { id: 'yunus_dua', title: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', subtitle: 'دعاء ذي النون في بطن الحوت', defaultTarget: 33, virtue: 'لم يدعُ بها مسلم قط إلا استجاب الله له' }
];

export const TARGET_OPTIONS = [33, 99, 100, 1000, 0]; // 0 = Free / Infinity

export const DigitalTasbeeh = () => {
  const [tasbeehState, setTasbeehState] = useState(() => getStoredTasbeeh());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isPressing, setIsPressing] = useState(false);
  const [showVirtue, setShowVirtue] = useState(false);
  const lastTapTimeRef = useRef(0);

  const activeZikr = TASBEEH_PRESETS.find((p) => p.id === tasbeehState.currentZikrId) || TASBEEH_PRESETS[0];

  // Save to storage on update
  useEffect(() => {
    saveStoredTasbeeh(tasbeehState);
  }, [tasbeehState]);

  const triggerCompletionCelebration = () => {
    try {
      hapticEngine.azanAlert();
    } catch (e) {}
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#38bdf8', '#34d399']
      });
    } catch (e) {}
  };

  const handleTapBead = (e) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastTapTimeRef.current < 50) return; // Prevent ghost duplicate triggers
    lastTapTimeRef.current = now;

    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 120);

    // Audio feedback
    try {
      if (soundEnabled) {
        audioEngine.playTasbeehTapSound();
      }
    } catch (err) {}

    // Haptic feedback
    try {
      if (hapticEnabled) {
        hapticEngine.tap();
      }
    } catch (err) {}

    setTasbeehState((prev) => {
      const newCount = (prev.currentCount || 0) + 1;
      const newDailyTotal = (prev.dailyTotal || 0) + 1;
      const target = prev.target;

      // Check target reached
      if (target > 0 && newCount === target) {
        triggerCompletionCelebration();

        if (autoAdvance) {
          const currentIdx = TASBEEH_PRESETS.findIndex((p) => p.id === prev.currentZikrId);
          const nextIdx = (currentIdx + 1) % TASBEEH_PRESETS.length;
          const nextZikr = TASBEEH_PRESETS[nextIdx];

          setTimeout(() => {
            setTasbeehState((current) => ({
              ...current,
              currentZikrId: nextZikr.id,
              currentCount: 0,
              target: nextZikr.defaultTarget
            }));
          }, 500);
        }
      }

      return {
        ...prev,
        currentCount: newCount,
        dailyTotal: newDailyTotal
      };
    });
  };

  const handleSelectZikr = (zikr) => {
    try {
      hapticEngine.tap();
    } catch (e) {}
    setTasbeehState((prev) => ({
      ...prev,
      currentZikrId: zikr.id,
      currentCount: 0,
      target: zikr.defaultTarget
    }));
  };

  const handleSetTarget = (target) => {
    try {
      hapticEngine.tap();
    } catch (e) {}
    setTasbeehState((prev) => ({
      ...prev,
      target
    }));
  };

  const handleReset = () => {
    try {
      hapticEngine.tap();
    } catch (e) {}
    setTasbeehState((prev) => ({
      ...prev,
      currentCount: 0
    }));
  };

  // Compute circular progress
  const target = tasbeehState.target;
  const strokeDashoffset = 565 - (565 * (target > 0 ? Math.min(1, (tasbeehState.currentCount || 0) / target) : 1));

  return (
    <div className="tasbeeh-container">
      {/* Top Stats Banner */}
      <div className="tasbeeh-stats-bar">
        <div className="tasbeeh-stat-item">
          <Flame size={16} color="var(--gold-light)" />
          <span>مجموع التسبيحات اليوم:</span>
          <strong style={{ fontFamily: 'var(--font-num)', color: 'var(--gold-light)', fontSize: '1.1rem' }}>
            {tasbeehState.dailyTotal || 0}
          </strong>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`icon-circle-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت النقرة'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            className={`icon-circle-btn ${hapticEnabled ? 'active' : ''}`}
            onClick={() => setHapticEnabled(!hapticEnabled)}
            title={hapticEnabled ? 'تعطيل الاهتزاز' : 'تفعيل الاهتزاز'}
          >
            <Vibrate size={16} />
          </button>
        </div>
      </div>

      {/* Selected Zikr Card */}
      <div className="tasbeeh-zikr-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tasbeeh-badge">الذكر الحالي</span>
          <button
            className="tasbeeh-virtue-btn"
            onClick={() => setShowVirtue(!showVirtue)}
            title="فضل هذا الذكر"
          >
            <Sparkles size={13} />
            <span>فضل الذكر</span>
          </button>
        </div>

        <h2 className="tasbeeh-zikr-title">{activeZikr.title}</h2>
        <p className="tasbeeh-zikr-subtitle">{activeZikr.subtitle}</p>

        {showVirtue && (
          <div className="tasbeeh-virtue-popup">
            <span style={{ fontSize: '0.82rem', color: 'var(--gold-light)', lineHeight: '1.5', display: 'block' }}>
              ✨ {activeZikr.virtue}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Center Circular Bead / Ring */}
      <div className="tasbeeh-dial-wrapper">
        <svg
          className="tasbeeh-ring-svg"
          viewBox="0 0 200 200"
          style={{ pointerEvents: 'none' }}
        >
          <circle
            className="tasbeeh-ring-track"
            cx="100"
            cy="100"
            r="90"
            style={{ pointerEvents: 'none' }}
          />
          <circle
            className="tasbeeh-ring-progress"
            cx="100"
            cy="100"
            r="90"
            strokeDasharray="565"
            strokeDashoffset={strokeDashoffset}
            style={{ pointerEvents: 'none' }}
          />
        </svg>

        {/* Center Circular Tap Bead */}
        <button
          type="button"
          className={`tasbeeh-center-bead ${isPressing ? 'pressed' : ''}`}
          onClick={handleTapBead}
          aria-label="اضغط للتسبيح"
          style={{ touchAction: 'manipulation', zIndex: 10 }}
        >
          <span className="tasbeeh-current-count">
            {tasbeehState.currentCount || 0}
          </span>
          <span className="tasbeeh-target-label">
            {target > 0 ? `الهدف: ${target}` : 'تسبيح حر'}
          </span>
          <span className="tasbeeh-tap-hint">انقر للتسبيح</span>
        </button>
      </div>

      {/* Target Goal Selector */}
      <div className="tasbeeh-controls-row">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الهدف:</span>
        <div className="tasbeeh-target-pills">
          {TARGET_OPTIONS.map((t) => (
            <button
              key={t}
              className={`tasbeeh-target-pill ${tasbeehState.target === t ? 'active' : ''}`}
              onClick={() => handleSetTarget(t)}
            >
              {t === 0 ? 'حر ∞' : t}
            </button>
          ))}
        </div>

        <button
          className="banner-btn"
          onClick={handleReset}
          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
          title="تصفير العداد الحالي"
        >
          <RotateCcw size={14} />
          <span>تصفير</span>
        </button>
      </div>

      {/* Auto Advance Toggle */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat size={15} color="var(--emerald-light)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            الانتقال التلقائي للذكر التالي عند إتمام الهدف
          </span>
        </div>
        <input
          type="checkbox"
          checked={autoAdvance}
          onChange={(e) => setAutoAdvance(e.target.checked)}
          style={{ accentColor: 'var(--emerald-primary)', width: '18px', height: '18px' }}
        />
      </div>

      {/* Quick Zikr Presets List */}
      <div className="tasbeeh-presets-section">
        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
          اختر من الأذكار المأثورة:
        </span>
        <div className="tasbeeh-presets-grid">
          {TASBEEH_PRESETS.map((p) => {
            const isSel = p.id === activeZikr.id;
            return (
              <button
                key={p.id}
                className={`tasbeeh-preset-chip ${isSel ? 'active' : ''}`}
                onClick={() => handleSelectZikr(p)}
              >
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '700', display: 'block' }}>{p.title}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>{p.subtitle}</span>
                </div>
                {isSel && <CheckCircle size={16} color="var(--emerald-light)" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
