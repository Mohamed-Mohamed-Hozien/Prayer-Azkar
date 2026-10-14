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

  // Centered circular dial dimensions
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const percentCompleted = Math.min(100, (currentProgress / targetCount) * 100);
  const strokeDashoffset = circumference - (percentCompleted / 100) * circumference;

  const handleTap = (e) => {
    if (e) e.stopPropagation();
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
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      hapticEngine.tap();
    }
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (currentIndex < athkarList.length - 1) {
      onIndexChange(currentIndex + 1);
      hapticEngine.tap();
    }
  };

  const handleReset = (e) => {
    if (e) e.stopPropagation();
    onResetItem(currentItem.id);
    hapticEngine.tap();
  };

  return (
    <div className="athkar-focus-wrapper">
      {/* Top Progress Info Row */}
      <div className="focus-header-row">
        <span className="focus-progress-badge">
          الذكر <bdi dir="ltr">{currentIndex + 1}</bdi> من <bdi dir="ltr">{athkarList.length}</bdi>
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

      {/* Main Interactive Focus Card */}
      <div className="focus-card-main">
        {/* Scrollable Middle Area: Arabic Text with Tashkeel, Fadl, and Source */}
        <div className="focus-text-scroll-area">
          <p className="focus-arabic-text" lang="ar">{currentItem.text}</p>

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

        {/* Pinned Bottom Interactive Zone: Centered Dial + Controls */}
        <div className="focus-bottom-pinned-zone">
          {/* Centered Circular Tasbeeh Dial */}
          <div
            className={`focus-centered-dial ${isCompleted ? 'completed' : ''}`}
            onClick={handleTap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTap(e);
              }
            }}
            aria-label="اضغط للتسبيح"
          >
            <svg className="focus-dial-svg" viewBox="0 0 90 90">
              {/* Background Track Circle */}
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="none"
                className="focus-dial-track"
                strokeWidth="6"
              />
              {/* Active Progress Circle */}
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="none"
                className="focus-dial-progress"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Dial Center Content */}
            <div className="focus-dial-content">
              {isCompleted ? (
                <CheckCircle2 size={28} color="var(--emerald-light)" />
              ) : (
                <span className="focus-dial-number"><bdi dir="ltr">{remaining}</bdi></span>
              )}
              <span className="focus-dial-label">
                {isCompleted ? 'اكتمل الذكر' : `متبقي من ${targetCount}`}
              </span>
            </div>
          </div>

          <span className="focus-dial-tap-hint">
            {isCompleted ? 'تقبل الله طاعتكم ✨' : 'المس الدائرة للتسبيح (+1)'}
          </span>

          {/* Navigation Controls Pinned at Bottom */}
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
      </div>
    </div>
  );
};
