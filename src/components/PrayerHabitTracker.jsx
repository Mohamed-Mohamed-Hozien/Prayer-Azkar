import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  Calendar,
  TrendingUp,
  Flame,
  Shield,
  X,
  Clock,
  Minus,
  Plus,
  Check,
  Sparkles,
  Award,
  RotateCcw
} from 'lucide-react';
import { hapticEngine } from '../services/hapticEngine';
import {
  getStoredPrayerHabits,
  saveStoredPrayerHabits,
  getStoredQadaCounts,
  saveStoredQadaCounts,
  DEFAULT_PRAYER_DAY_RECORD,
  DEFAULT_QADA_COUNTS
} from '../services/storageEngine';

// Date utility to format local date to YYYY-MM-DD
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Five Daily Prayers Config
const PRAYERS = [
  { key: 'fajr', name: 'الفَجْر', icon: '🌅', label: 'صلاة الفجر' },
  { key: 'dhuhr', name: 'الظُّهْر', icon: '☀️', label: 'صلاة الظهر' },
  { key: 'asr', name: 'العَصْر', icon: '🌤️', label: 'صلاة العصر' },
  { key: 'maghrib', name: 'المَغْرِب', icon: '🌇', label: 'صلاة المغرب' },
  { key: 'isha', name: 'العِشَاء', icon: '🌙', label: 'صلاة العشاء' }
];

// Status Options Configuration
const STATUS_OPTIONS = [
  {
    key: 'jamaah',
    label: 'في المسجد (جماعة)',
    shortLabel: 'جماعة',
    icon: '🕌',
    color: 'var(--emerald-primary)',
    bg: 'rgba(16, 185, 129, 0.16)',
    activeBg: 'var(--emerald-primary)',
    activeText: '#042f22',
    borderColor: 'var(--border-emerald)'
  },
  {
    key: 'on_time',
    label: 'في الوقت (منفرداً)',
    shortLabel: 'في الوقت',
    icon: '🏠',
    color: 'var(--emerald-light)',
    bg: 'rgba(52, 211, 153, 0.12)',
    activeBg: 'var(--emerald-light)',
    activeText: '#042f22',
    borderColor: 'rgba(52, 211, 153, 0.35)'
  },
  {
    key: 'late',
    label: 'قضاء (بعد الوقت)',
    shortLabel: 'قضاء',
    icon: '⏳',
    color: 'var(--gold-primary)',
    bg: 'rgba(245, 158, 11, 0.14)',
    activeBg: 'var(--gold-primary)',
    activeText: '#3b1c00',
    borderColor: 'var(--border-gold)'
  },
  {
    key: 'excuse',
    label: 'عذر شرعي',
    shortLabel: 'عذر شرعي',
    hint: 'للسيدات: يثبت الالتزام',
    icon: '🌸',
    color: '#F472B6',
    bg: 'rgba(244, 114, 182, 0.14)',
    activeBg: '#EC4899',
    activeText: '#ffffff',
    borderColor: 'rgba(244, 114, 182, 0.4)'
  }
];

export const PrayerHabitTracker = ({
  isOpen = true,
  onClose,
  initialTab = 'daily'
}) => {
  if (isOpen !== undefined && !isOpen) return null;

  // Tabs: 'daily' | 'qada' | 'weekly'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Selected date for daily log
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Habits state: { [dateStr]: { fajr: ..., dhuhr: ..., asr: ..., maghrib: ..., isha: ... } }
  const [habitsData, setHabitsData] = useState(() => getStoredPrayerHabits());

  // Qada counts state: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
  const [qadaCounts, setQadaCounts] = useState(() => getStoredQadaCounts());

  // Editing state for direct Qada number input
  const [editingQadaPrayer, setEditingQadaPrayer] = useState(null);
  const [qadaInputValue, setQadaInputValue] = useState('');

  // Quick affirmation message toast
  const [toastMessage, setToastMessage] = useState('');

  // Synchronize from localStorage on mount
  useEffect(() => {
    setHabitsData(getStoredPrayerHabits());
    setQadaCounts(getStoredQadaCounts());
  }, []);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const isToday = useMemo(() => selectedDateKey === toDateKey(new Date()), [selectedDateKey]);

  // Today's prayer record
  const currentDayRecord = useMemo(() => {
    return habitsData[selectedDateKey] || { ...DEFAULT_PRAYER_DAY_RECORD };
  }, [habitsData, selectedDateKey]);

  // Calculation for day completion percentage
  const dayStats = useMemo(() => {
    let performedCount = 0;
    let jamaahCount = 0;
    let onTimeCount = 0;
    let excuseCount = 0;
    let lateCount = 0;

    PRAYERS.forEach((p) => {
      const status = currentDayRecord[p.key];
      if (status && status !== 'none') {
        performedCount++;
        if (status === 'jamaah') jamaahCount++;
        else if (status === 'on_time') onTimeCount++;
        else if (status === 'excuse') excuseCount++;
        else if (status === 'late') lateCount++;
      }
    });

    const percentage = Math.round((performedCount / 5) * 100);
    return {
      performedCount,
      jamaahCount,
      onTimeCount,
      excuseCount,
      lateCount,
      percentage
    };
  }, [currentDayRecord]);

  // Weekly consistency data (last 7 days ending today)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const days = [];
    let totalPerformed = 0;
    let totalJamaah = 0;
    let totalOnTime = 0;
    let fullDaysCount = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toDateKey(d);
      const rec = habitsData[key] || { ...DEFAULT_PRAYER_DAY_RECORD };

      let dayPerformed = 0;
      let dayJamaah = 0;
      let dayOnTime = 0;

      PRAYERS.forEach((p) => {
        const s = rec[p.key];
        if (s && s !== 'none') {
          dayPerformed++;
          if (s === 'jamaah') dayJamaah++;
          if (s === 'on_time') dayOnTime++;
        }
      });

      totalPerformed += dayPerformed;
      totalJamaah += dayJamaah;
      totalOnTime += dayOnTime;
      if (dayPerformed === 5) fullDaysCount++;

      days.push({
        dateObj: d,
        dateKey: key,
        isToday: i === 0,
        dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        dayNumber: d.getDate(),
        record: rec,
        performedCount: dayPerformed,
        percentage: Math.round((dayPerformed / 5) * 100)
      });
    }

    // Calculate current streak of consecutive completed days (5/5)
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      // If it's today and still in progress, we don't break the streak if yesterday was 5/5
      if (days[i].isToday && days[i].performedCount < 5) {
        continue;
      }
      if (days[i].performedCount === 5) {
        streak++;
      } else {
        break;
      }
    }

    const weeklyScore = Math.round((totalPerformed / 35) * 100);

    return {
      days,
      totalPerformed,
      totalJamaah,
      totalOnTime,
      fullDaysCount,
      streak,
      weeklyScore
    };
  }, [habitsData]);

  // Handle status tap for a prayer in daily log
  const handleSelectStatus = (prayerKey, statusKey) => {
    hapticEngine.tap();

    const currentStatus = currentDayRecord[prayerKey];
    const newStatus = currentStatus === statusKey ? 'none' : statusKey;

    const updatedRecord = {
      ...currentDayRecord,
      [prayerKey]: newStatus
    };

    const updatedHabits = {
      ...habitsData,
      [selectedDateKey]: updatedRecord
    };

    setHabitsData(updatedHabits);
    saveStoredPrayerHabits(updatedHabits);

    // If prayer was completed, check if all 5 are completed now
    if (newStatus !== 'none') {
      const allDone = PRAYERS.every((p) =>
        p.key === prayerKey ? true : updatedRecord[p.key] && updatedRecord[p.key] !== 'none'
      );
      if (allDone) {
        hapticEngine.completedCategory();
        showToast('ما شاء الله! أتممت صلوات اليوم كلها بارك الله فيك 🌟');
      }
    }
  };

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // Qada counter actions
  const handleDecrementQada = (prayerKey) => {
    const current = qadaCounts[prayerKey] || 0;
    if (current <= 0) return;

    hapticEngine.completedZikr();
    const updated = {
      ...qadaCounts,
      [prayerKey]: current - 1
    };
    setQadaCounts(updated);
    saveStoredQadaCounts(updated);
    showToast(`تقبل الله منك! تبقت ${current - 1} صلوات ${PRAYERS.find((p) => p.key === prayerKey)?.name}`);
  };

  const handleIncrementQada = (prayerKey, amount = 1) => {
    hapticEngine.tap();
    const current = qadaCounts[prayerKey] || 0;
    const updated = {
      ...qadaCounts,
      [prayerKey]: current + amount
    };
    setQadaCounts(updated);
    saveStoredQadaCounts(updated);
  };

  const handleSaveCustomQada = (prayerKey) => {
    const parsed = Math.max(0, Math.floor(Number(qadaInputValue)) || 0);
    const updated = {
      ...qadaCounts,
      [prayerKey]: parsed
    };
    setQadaCounts(updated);
    saveStoredQadaCounts(updated);
    setEditingQadaPrayer(null);
    setQadaInputValue('');
    showToast('تم تحديث عدد الفوائت بنجاح');
  };

  // Batch Add Qada Presets (e.g. +7 days, +30 days)
  const handleBatchAddQada = (daysCount) => {
    hapticEngine.tap();
    const updated = {
      fajr: (qadaCounts.fajr || 0) + daysCount,
      dhuhr: (qadaCounts.dhuhr || 0) + daysCount,
      asr: (qadaCounts.asr || 0) + daysCount,
      maghrib: (qadaCounts.maghrib || 0) + daysCount,
      isha: (qadaCounts.isha || 0) + daysCount
    };
    setQadaCounts(updated);
    saveStoredQadaCounts(updated);
    showToast(`تمت إضافة ${daysCount} أيام لقضاء الصلوات الخمس`);
  };

  // Total Qada remaining
  const totalQadaRemaining = useMemo(() => {
    return (
      (qadaCounts.fajr || 0) +
      (qadaCounts.dhuhr || 0) +
      (qadaCounts.asr || 0) +
      (qadaCounts.maghrib || 0) +
      (qadaCounts.isha || 0)
    );
  }, [qadaCounts]);

  // Date shifting for daily view
  const shiftDate = (offsetDays) => {
    hapticEngine.tap();
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offsetDays);
    setSelectedDate(next);
  };

  const formattedSelectedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }, [selectedDate]);

  // Modal Content JSX
  const content = (
    <div
      className="prayer-habit-tracker"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-arabic-ui)'
      }}
    >
      {/* Header Row */}
      <div className="modal-header-row" style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-emerald)'
            }}
          >
            <Calendar size={20} color="var(--emerald-light)" />
          </div>
          <div>
            <h3
              className="modal-title"
              style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                margin: 0,
                fontFamily: 'var(--font-arabic-calligraphy)'
              }}
            >
              متابعة الصلوات والفوائت
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              سجل الالتزام اليومي وقضاء الصلوات الفائتة
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg-card-active)',
            border: '1px solid var(--border-emerald)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--emerald-light)',
            fontSize: '0.85rem',
            fontWeight: '600',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            animation: 'fadeInModal 0.2s ease'
          }}
        >
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      <div
        className="habit-tabs-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          padding: '4px',
          background: 'var(--bg-card-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <button
          type="button"
          onClick={() => {
            hapticEngine.tap();
            setActiveTab('daily');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            minHeight: '44px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'daily' ? 'var(--emerald-primary)' : 'transparent',
            color: activeTab === 'daily' ? '#042f22' : 'var(--text-secondary)',
            fontWeight: activeTab === 'daily' ? '700' : '500',
            fontSize: '0.86rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease'
          }}
        >
          <CheckCircle size={16} />
          <span>سجل اليوم</span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticEngine.tap();
            setActiveTab('qada');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            minHeight: '44px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'qada' ? 'var(--emerald-primary)' : 'transparent',
            color: activeTab === 'qada' ? '#042f22' : 'var(--text-secondary)',
            fontWeight: activeTab === 'qada' ? '700' : '500',
            fontSize: '0.86rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease'
          }}
        >
          <Clock size={16} />
          <span>قضاء الفوائت</span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticEngine.tap();
            setActiveTab('weekly');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 6px',
            minHeight: '44px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'weekly' ? 'var(--emerald-primary)' : 'transparent',
            color: activeTab === 'weekly' ? '#042f22' : 'var(--text-secondary)',
            fontWeight: activeTab === 'weekly' ? '700' : '500',
            fontSize: '0.86rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingUp size={16} />
          <span>ملخص الأسبوع</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY PRAYER LOG */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Date Selector Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--bg-card-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>← اليوم السابق</span>
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {formattedSelectedDate}
              </div>
              {isToday ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--emerald-light)',
                    fontWeight: '600'
                  }}
                >
                  اليوم الحاضر
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--gold-light)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  العودة لليوم
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => shiftDate(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>اليوم التالي →</span>
            </button>
          </div>

          {/* Visual Completion Progress Bar */}
          <div
            style={{
              padding: '14px',
              background: 'var(--bg-card-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--emerald-light)" />
                <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>
                  نسبة إتمام صلوات اليوم
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color: dayStats.percentage === 100 ? 'var(--emerald-light)' : 'var(--gold-light)',
                    fontFamily: 'var(--font-num)'
                  }}
                >
                  {dayStats.percentage}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ({dayStats.performedCount} من ٥)
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'var(--bg-oled)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${dayStats.percentage}%`,
                  background:
                    dayStats.percentage === 100
                      ? 'linear-gradient(90deg, var(--emerald-primary), var(--emerald-light))'
                      : 'linear-gradient(90deg, var(--gold-primary), var(--emerald-primary))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </div>

            {/* Encouraging caption */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {dayStats.percentage === 100 ? (
                <span style={{ color: 'var(--emerald-light)', fontWeight: '600' }}>
                  🌟 هنيئاً لك! أتممت صلوات الخمس كلها اليوم، تقبل الله طاعتك.
                </span>
              ) : dayStats.percentage >= 60 ? (
                <span>واصل همتك! متبقي إتمام ما بقي من الصلوات لتنال الأجر كاملاً.</span>
              ) : (
                <span>الصلاة عماد الدين، اضغط على زر الحالة لكل صلاة عند أدائها.</span>
              )}
            </div>
          </div>

          {/* List of 5 Prayers Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRAYERS.map((prayer) => {
              const currentStatus = currentDayRecord[prayer.key] || 'none';
              const activeStatusObj = STATUS_OPTIONS.find((opt) => opt.key === currentStatus);

              return (
                <div
                  key={prayer.key}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-card-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${activeStatusObj ? activeStatusObj.borderColor : 'var(--border-subtle)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Prayer Title & Active Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{prayer.icon}</span>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: '700',
                          fontFamily: 'var(--font-arabic-calligraphy)'
                        }}
                      >
                        {prayer.name}
                      </span>
                    </div>

                    <div>
                      {activeStatusObj ? (
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: '700',
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-full)',
                            background: activeStatusObj.bg,
                            color: activeStatusObj.color,
                            border: `1px solid ${activeStatusObj.borderColor}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{activeStatusObj.icon}</span>
                          <span>{activeStatusObj.shortLabel}</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.74rem',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          لم تُسجل
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4 Status Action Buttons */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '6px'
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = currentStatus === opt.key;
                      return (
                        <button
                          type="button"
                          key={opt.key}
                          onClick={() => handleSelectStatus(prayer.key, opt.key)}
                          style={{
                            minHeight: '44px',
                            padding: '8px 6px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isSelected ? opt.borderColor : 'var(--border-subtle)'}`,
                            background: isSelected ? opt.activeBg : 'var(--bg-oled)',
                            color: isSelected ? opt.activeText : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? '700' : '500',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.shortLabel}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QADA COUNTER (عداد قضاء الفوائت) */}
      {/* ========================================================================= */}
      {activeTab === 'qada' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Overview Banner */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, var(--bg-card-elevated), rgba(245, 158, 11, 0.08))',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                  إجمالي الصلوات الفائتة المتبقية
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  color: 'var(--gold-light)',
                  fontFamily: 'var(--font-num)'
                }}
              >
                {totalQadaRemaining}
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              يعادل قضاء نحو{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {Math.ceil(totalQadaRemaining / 5)} يوماً
              </strong>{' '}
              من الصلوات المفروضة. قال النبي ﷺ: «فَدَيْنُ اللَّهِ أَحَقُّ أَنْ يُقْضَى» (صحيح البخاري).
            </div>

            {/* Quick Batch Setup */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                إضافة سريعة:
              </span>
              <button
                type="button"
                onClick={() => handleBatchAddQada(1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-active)',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  cursor: 'pointer'
                }}
              >
                +١ يوم (٥ صلوات)
              </button>
              <button
                type="button"
                onClick={() => handleBatchAddQada(7)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-active)',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  cursor: 'pointer'
                }}
              >
                +١ أسبوع (+٣٥)
              </button>
              <button
                type="button"
                onClick={() => handleBatchAddQada(30)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-active)',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  cursor: 'pointer'
                }}
              >
                +١ شهر (+١٥٠)
              </button>
            </div>
          </div>

          {/* Qada Rows for Fajr, Dhuhr, Asr, Maghrib, Isha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRAYERS.map((prayer) => {
              const count = qadaCounts[prayer.key] || 0;
              const isEditing = editingQadaPrayer === prayer.key;

              return (
                <div
                  key={prayer.key}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-card-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  {/* Prayer Name & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '100px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{prayer.icon}</span>
                    <div>
                      <div
                        style={{
                          fontWeight: '700',
                          fontSize: '0.98rem',
                          fontFamily: 'var(--font-arabic-calligraphy)'
                        }}
                      >
                        {prayer.name}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        المتبقي للقضاء
                      </span>
                    </div>
                  </div>

                  {/* Count Display or Direct Edit Field */}
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        value={qadaInputValue}
                        onChange={(e) => setQadaInputValue(e.target.value)}
                        autoFocus
                        style={{
                          width: '74px',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-emerald)',
                          background: 'var(--bg-oled)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-num)',
                          fontSize: '1rem',
                          textAlign: 'center'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCustomQada(prayer.key)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: 'var(--emerald-primary)',
                          color: '#042f22',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQadaPrayer(prayer.key);
                        setQadaInputValue(String(count));
                      }}
                      title="اضغط للتعديل المباشر"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: '800',
                          color: count > 0 ? 'var(--gold-light)' : 'var(--emerald-light)',
                          fontFamily: 'var(--font-num)',
                          display: 'block'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  )}

                  {/* Stepper Buttons: [-1] and [+1] */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Decrement Button [-1] */}
                    <button
                      type="button"
                      onClick={() => handleDecrementQada(prayer.key)}
                      disabled={count <= 0}
                      aria-label={`قضيت صلاة ${prayer.name}`}
                      style={{
                        minWidth: '46px',
                        minHeight: '44px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-emerald)',
                        background: count > 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                        color: count > 0 ? 'var(--emerald-light)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: count > 0 ? 'pointer' : 'not-allowed',
                        touchAction: 'manipulation',
                        fontWeight: '700',
                        fontSize: '0.86rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Minus size={15} />
                      <span>١-</span>
                    </button>

                    {/* Increment Button [+1] */}
                    <button
                      type="button"
                      onClick={() => handleIncrementQada(prayer.key, 1)}
                      aria-label={`إضافة صلاة فائتة ${prayer.name}`}
                      style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card-active)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEEKLY CONSISTENCY & STREAK (ملخص التزام الأسبوع) */}
      {/* ========================================================================= */}
      {activeTab === 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Consistency Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}
          >
            {/* Streak Metric Card */}
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-card-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={18} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  سلسلة الالتزام التام
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: 'var(--gold-light)',
                    fontFamily: 'var(--font-num)'
                  }}
                >
                  {weeklyData.streak}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>أيام متتالية</span>
              </div>
            </div>

            {/* Total On Time / Jamaah Metric Card */}
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-card-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} color="var(--emerald-light)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  صلوات في المسجد
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: 'var(--emerald-light)',
                    fontFamily: 'var(--font-num)'
                  }}
                >
                  {weeklyData.totalJamaah}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>جماعة هذا الأسبوع</span>
              </div>
            </div>
          </div>

          {/* Weekly Mini Grid (7 Days Columns) */}
          <div
            style={{
              padding: '14px',
              background: 'var(--bg-card-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>
                التزام آخر ٧ أيام ({weeklyData.totalPerformed} من ٣٥ صلاة)
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: 'var(--emerald-light)',
                  fontFamily: 'var(--font-num)'
                }}
              >
                {weeklyData.weeklyScore}%
              </span>
            </div>

            {/* 7 Days Columns Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px'
              }}
            >
              {weeklyData.days.map((day) => {
                const isSelected = toDateKey(selectedDate) === day.dateKey;
                const isFull = day.performedCount === 5;

                return (
                  <button
                    type="button"
                    key={day.dateKey}
                    onClick={() => {
                      hapticEngine.tap();
                      setSelectedDate(day.dateObj);
                      setActiveTab('daily');
                    }}
                    style={{
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.22)'
                        : 'var(--bg-oled)',
                      border: isSelected
                        ? '1px solid var(--border-emerald)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      minHeight: '80px',
                      touchAction: 'manipulation'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {day.dayName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-num)'
                      }}
                    >
                      {day.dayNumber}
                    </span>

                    {/* 5 Dots Indicator for the 5 Prayers */}
                    <div style={{ display: 'flex', gap: '2px', marginTop: 'auto' }}>
                      {PRAYERS.map((p) => {
                        const status = day.record[p.key];
                        let dotColor = 'rgba(255, 255, 255, 0.12)';
                        if (status === 'jamaah') dotColor = 'var(--emerald-primary)';
                        else if (status === 'on_time') dotColor = 'var(--emerald-light)';
                        else if (status === 'late') dotColor = 'var(--gold-primary)';
                        else if (status === 'excuse') dotColor = '#F472B6';

                        return (
                          <div
                            key={p.key}
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor: dotColor
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Completion Tag */}
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        color: isFull ? 'var(--emerald-light)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-num)'
                      }}
                    >
                      {day.performedCount}/5
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              اضغط على أي يوم لعرض وتعديل سجل صلواته بالتفصيل
            </div>
          </div>

          {/* Hadith Motivation Card */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-emerald)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}
          >
            قال رسول الله ﷺ: «مَنْ حَافَظَ عَلَيْهَا كَانَتْ لَهُ نُوراً وَبُرْهَاناً وَنَجَاةً يَوْمَ الْقِيَامَةِ» (رواه أحمد).
          </div>
        </div>
      )}
    </div>
  );

  // If onClose is provided, render inside portal with modal-overlay and modal-sheet
  if (onClose && typeof document !== 'undefined') {
    return createPortal(
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>,
      document.body
    );
  }

  // Standalone embed component fallback
  return (
    <div
      className="prayer-habit-tracker-container"
      style={{
        width: '100%',
        maxWidth: '580px',
        marginInline: 'auto',
        background: 'var(--bg-card)',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      {content}
    </div>
  );
};
