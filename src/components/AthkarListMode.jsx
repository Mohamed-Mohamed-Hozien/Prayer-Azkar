import React, { useState } from 'react';
import { Check, Sparkles, RotateCcw, Copy } from 'lucide-react';
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

export const AthkarListMode = ({
  athkarList,
  progressMap,
  onUpdateCount,
  onResetItem
}) => {
  const [copiedId, setCopiedId] = useState(null);

  if (!athkarList || athkarList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        لا توجد أذكار في هذا القسم حالياً.
      </div>
    );
  }

  const handleCopy = async (text, id, e) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      hapticEngine.tap();
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    } catch (err) {
      console.warn('Failed to copy zikr text:', err);
    }
  };

  const handleItemTap = (item) => {
    const current = progressMap[item.id] || 0;
    const target = item.count || 1;
    
    if (current >= target) {
      // Completed, tap does haptic tick
      hapticEngine.tap();
      return;
    }

    const nextVal = current + 1;
    onUpdateCount(item.id, nextVal);
    hapticEngine.tap();
    audioEngine.playTasbeehTapSound();

    if (nextVal >= target) {
      hapticEngine.completedZikr();
    }
  };

  return (
    <div className="athkar-list-container">
      {athkarList.map((item) => {
        const count = item.count || 1;
        const current = progressMap[item.id] || 0;
        const isDone = current >= count;
        const remaining = Math.max(0, count - current);
        const percent = Math.min(100, Math.round((current / count) * 100));
        const hadithBadge = getHadithBadge(item.source);
        const isCopied = copiedId === item.id;

        return (
          <div
            key={item.id}
            className={`athkar-list-card ${isDone ? 'completed' : ''}`}
          >
            {/* Visual Top Progress Bar */}
            <div className="athkar-card-progress-track">
              <div
                className="athkar-card-progress-bar"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Arabic Text with Tashkeel */}
            <p className="athkar-card-arabic" lang="ar">{item.text}</p>

            {/* Reward Note if present */}
            {item.reward && (
              <div style={{ fontSize: '0.78rem', color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} />
                <span>{item.reward}</span>
              </div>
            )}

            {/* Hadith Verification Badge & Source Reference */}
            {item.source && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                {hadithBadge && (
                  <span
                    className="hadith-pill-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      background: hadithBadge.bg,
                      border: hadithBadge.border,
                      color: hadithBadge.color,
                      fontFamily: 'var(--font-arabic-ui)'
                    }}
                  >
                    {hadithBadge.label}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {item.source}
                </span>
              </div>
            )}

            {/* Footer with Tap Counter Button & Action Controls */}
            <div className="athkar-card-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="banner-btn"
                  onClick={(e) => handleCopy(item.text, item.id, e)}
                  title="نسخ نص الذكر"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: isCopied ? 'var(--emerald-light)' : 'inherit',
                    borderColor: isCopied ? 'var(--border-emerald)' : 'var(--border-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isCopied ? (
                    <>
                      <Check size={13} color="var(--emerald-light)" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>نسخ الذكر</span>
                    </>
                  )}
                </button>

                <button
                  className="banner-btn"
                  onClick={() => onResetItem(item.id)}
                  title="تصفير هذا الذكر"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  <RotateCcw size={13} />
                  <span>تصفير</span>
                </button>
              </div>

              <button
                className={`athkar-tap-counter-btn ${isDone ? 'done' : ''}`}
                onClick={() => handleItemTap(item)}
                aria-label="تسبيح"
              >
                {isDone ? (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>اكتمل ({count})</span>
                  </>
                ) : (
                  <>
                    <span>متبقي: {remaining}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>/ {count}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
