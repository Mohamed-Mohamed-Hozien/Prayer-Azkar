import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, RotateCcw, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { hapticEngine } from '../services/hapticEngine';
import { audioEngine } from '../services/audioEngine';

/**
 * Analyzes Hadith source reference to return authentic Islamic verification badge metadata.
 */
const getHadithBadge = (source) => {
  if (!source) return null;
  // Strip Arabic diacritics / tashkeel for resilient keyword matching
  const clean = source.replace(/[\u064B-\u065F\u0670\u0640]/g, '');

  if (clean.includes('قرآن') || clean.includes('آية') || clean.includes('سورة')) {
    return {
      label: '📖 آية قرآنية',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }

  const hasBukhari = clean.includes('البخاري');
  const hasMuslim = clean.includes('مسلم');

  if (hasBukhari && hasMuslim) {
    return {
      label: '✨ متفق عليه (البخاري ومسلم)',
      bg: 'rgba(16, 185, 129, 0.14)',
      border: '1px solid rgba(16, 185, 129, 0.38)',
      color: 'var(--text-emerald)',
    };
  }
  if (hasBukhari) {
    return {
      label: '✨ صحيح البخاري',
      bg: 'rgba(16, 185, 129, 0.14)',
      border: '1px solid rgba(16, 185, 129, 0.38)',
      color: 'var(--text-emerald)',
    };
  }
  if (hasMuslim) {
    return {
      label: '✨ صحيح مسلم',
      bg: 'rgba(16, 185, 129, 0.14)',
      border: '1px solid rgba(16, 185, 129, 0.38)',
      color: 'var(--text-emerald)',
    };
  }

  const hasAbuDawud = clean.includes('داود');
  const hasTirmidhi = clean.includes('الترمذي');
  const hasNasaee = clean.includes('النسائي');
  const hasIbnMajah = clean.includes('ماجه') || clean.includes('ماجة');

  if (hasAbuDawud && hasTirmidhi) {
    return {
      label: '📜 سنن أبي داود والترمذي',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }
  if (hasAbuDawud && hasIbnMajah) {
    return {
      label: '📜 سنن أبي داود وابن ماجه',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }
  if (hasTirmidhi) {
    return {
      label: '📜 سنن الترمذي',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }
  if (hasAbuDawud) {
    return {
      label: '📜 سنن أبي داود',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }
  if (hasNasaee) {
    return {
      label: '📜 سنن النسائي',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }
  if (hasIbnMajah) {
    return {
      label: '📜 سنن ابن ماجه',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      color: 'var(--text-gold)',
    };
  }
  if (clean.includes('صحيح') || clean.includes('حسن')) {
    return {
      label: '📜 حديث صحيح / حسن',
      bg: 'rgba(16, 185, 129, 0.14)',
      border: '1px solid rgba(16, 185, 129, 0.38)',
      color: 'var(--text-emerald)',
    };
  }

  return {
    label: '📜 أثر / حديث موثق',
    bg: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
  };
};

export const AthkarFocusMode = ({
  athkarList,
  currentIndex,
  onIndexChange,
  progressMap,
  onUpdateCount,
  onResetItem
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // Reset copied state on item navigation
  useEffect(() => {
    setIsCopied(false);
  }, [currentIndex]);

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
  const hadithBadge = getHadithBadge(currentItem.source);

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
      } catch (err) {}

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

  const handleCopy = async (e) => {
    if (e) e.stopPropagation();
    try {
      const textToCopy = currentItem.text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      hapticEngine.tap();
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.warn('Failed to copy zikr text:', err);
    }
  };

  // Keyboard Shortcuts: Space to count/advance, ArrowRight to advance, ArrowLeft for previous
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (isCompleted) {
          handleNext();
        } else {
          handleTap();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, isCompleted, currentProgress, targetCount, athkarList.length]);

  return (
    <div className="athkar-focus-wrapper">
      {/* Top Progress Info Row with Copy & Reset Controls */}
      <div className="focus-header-row">
        <span className="focus-progress-badge">
          الذكر <bdi dir="ltr">{currentIndex + 1}</bdi> من <bdi dir="ltr">{athkarList.length}</bdi>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="banner-btn"
            onClick={handleCopy}
            title="نسخ نص الذكر"
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              color: isCopied ? 'var(--emerald-light)' : 'inherit',
              borderColor: isCopied ? 'var(--border-emerald)' : 'var(--border-subtle)',
              transition: 'all 0.2s ease'
            }}
          >
            {isCopied ? <Check size={13} color="var(--emerald-light)" /> : <Copy size={13} />}
            <span>{isCopied ? 'تم النسخ!' : 'نسخ الذكر'}</span>
          </button>

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
      </div>

      {/* Main Interactive Focus Card */}
      <div className="focus-card-main">
        {/* Scrollable Middle Area: Arabic Text with Tashkeel, Fadl, Badge, and Source */}
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

          {/* Hadith Verification Badge & Source Reference */}
          {currentItem.source && (
            <div
              className="focus-source-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px'
              }}
            >
              {hadithBadge && (
                <span
                  className="hadith-pill-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    background: hadithBadge.bg,
                    border: hadithBadge.border,
                    color: hadithBadge.color,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    fontFamily: 'var(--font-arabic-ui)'
                  }}
                >
                  {hadithBadge.label}
                </span>
              )}
              <span className="focus-source-text" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {currentItem.source}
              </span>
            </div>
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
                e.stopPropagation();
                handleTap(e);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                handleNext(e);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                handlePrev(e);
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
            {isCompleted
              ? 'تقبل الله طاعتكم ✨ (اضغط Space أو التالي للمتابعة)'
              : 'المس الدائرة أو اضغط (Space) للتسبيح (+1)'}
          </span>

          {/* Navigation Controls Pinned at Bottom */}
          <div className="focus-controls-row">
            <button
              className="focus-nav-btn"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              title="السابق (ArrowLeft)"
              style={{ opacity: currentIndex === 0 ? 0.35 : 1 }}
            >
              <ChevronRight size={18} />
              <span>السابق</span>
            </button>

            <button
              className="focus-nav-btn"
              onClick={handleNext}
              disabled={currentIndex >= athkarList.length - 1}
              title="التالي (ArrowRight)"
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
