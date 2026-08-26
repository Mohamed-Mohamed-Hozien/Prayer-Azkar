import React from 'react';
import { ChevronRight, ChevronLeft, RotateCcw, Sparkles, CheckCircle2, Hand } from 'lucide-react';
import confetti from 'canvas-confetti';
import { hapticEngine } from '../services/hapticEngine';
import { audioEngine } from '../services/audioEngine';

export const AthkarFocusMode = ({
  athkarList,
  currentIndex,
  onIndexChange,
  progressMap,
  onUpdateCount,
  onResetItem
}) => {
  if (!athkarList || athkarList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        لا توجد أذكار في هذا القسم حالياً.
      </div>
    );
  }

  const currentItem = athkarList[currentIndex] || athkarList[0];
  const targetCount = currentItem.count || 1;
  const currentProgress = progressMap[currentItem.id] || 0;
  const remaining = Math.max(0, targetCount - currentProgress);
  const isCompleted = currentProgress >= targetCount;

  // Compact circular ring dimensions
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const percentCompleted = Math.min(100, (currentProgress / targetCount) * 100);
  const strokeDashoffset = circumference - (percentCompleted / 100) * circumference;

  const handleTap = (e) => {
    e.stopPropagation();
    if (isCompleted) {
      hapticEngine.tap();
      return;
    }

    const nextCount = currentProgress + 1;
    onUpdateCount(currentItem.id, nextCount);
    hapticEngine.tap();
    audioEngine.playTasbeehTapSound();

    // Check if target reached
    if (nextCount >= targetCount) {
      hapticEngine.completedZikr();
      try {
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.75 },
          colors: ['#10B981', '#F59E0B', '#34D399', '#FCD34D']
        });
      } catch (e) {}

      // Auto-advance to next Zikr after a brief pause
      if (currentIndex < athkarList.length - 1) {
        setTimeout(() => {
          onIndexChange(currentIndex + 1);
        }, 600);
      }
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      hapticEngine.tap();
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < athkarList.length - 1) {
      onIndexChange(currentIndex + 1);
      hapticEngine.tap();
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    onResetItem(currentItem.id);
    hapticEngine.tap();
  };

  return (
    <div className="athkar-focus-wrapper">
      {/* Top Progress Info Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
        <span className="focus-progress-badge">
          الذكر {currentIndex + 1} من {athkarList.length}
        </span>

        <button
          className="banner-btn"
          onClick={handleReset}
          title="إعادة تصفير العداد"
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          <RotateCcw size={13} />
          <span>تصفير</span>
        </button>
      </div>

      {/* Main Interactive Focus Card (Tap-Anywhere) */}
      <div
        className="focus-card-main"
        onClick={handleTap}
        role="button"
        tabIndex={0}
        aria-label="اضغط في أي مكان على البطاقة للتسبيح"
      >
        {/* Scrollable Arabic Text Area for Perfect Compatibility with All Lengths */}
        <div className="focus-text-scroll-area">
          <p className="focus-arabic-text">{currentItem.text}</p>

          {/* Reward / Fadl Box */}
          {currentItem.reward && (
            <div className="focus-reward-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', marginBottom: '2px', fontWeight: '700' }}>
                <Sparkles size={13} color="var(--gold-light)" />
                <span>فضل الذكر</span>
              </div>
              <span>{currentItem.reward}</span>
            </div>
          )}

          {/* Hadith Source Reference */}
          {currentItem.source && (
            <span className="focus-source-text">{currentItem.source}</span>
          )}
        </div>

        {/* Compact Integrated Tap Counter Badge */}
        <div className="focus-compact-counter-bar">
          <div className="compact-counter-ring">
            <svg style={{ width: '68px', height: '68px', transform: 'rotate(-90deg)' }}>
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
              />
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke={isCompleted ? 'var(--emerald-primary)' : 'var(--emerald-light)'}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.2s ease' }}
              />
            </svg>

            <div className="compact-counter-center">
              {isCompleted ? (
                <CheckCircle2 size={24} color="var(--emerald-light)" />
              ) : (
                <span className="compact-counter-num">{remaining}</span>
              )}
            </div>
          </div>

          <div className="compact-counter-meta">
            {isCompleted ? (
              <span style={{ color: 'var(--emerald-light)', fontWeight: '700', fontSize: '0.86rem' }}>
                اكتمل الذكر تقبل الله
              </span>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--emerald-light)', fontSize: '0.84rem', fontWeight: '700' }}>
                  <Hand size={14} />
                  <span>المس للتسبيح (+1)</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  المتبقي {remaining} من أصل {targetCount} مرات
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="focus-controls-row">
        <button
          className="focus-nav-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.35 : 1 }}
        >
          <ChevronRight size={18} />
          <span>السابق</span>
        </button>

        <button
          className="focus-nav-btn"
          onClick={handleNext}
          disabled={currentIndex >= athkarList.length - 1}
          style={{ opacity: currentIndex >= athkarList.length - 1 ? 0.35 : 1 }}
        >
          <span>التالي</span>
          <ChevronLeft size={18} />
        </button>
      </div>
    </div>
  );
};
