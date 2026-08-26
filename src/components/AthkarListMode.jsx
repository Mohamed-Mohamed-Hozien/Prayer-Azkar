import React from 'react';
import { Check, Sparkles, RotateCcw } from 'lucide-react';
import { hapticEngine } from '../services/hapticEngine';
import { audioEngine } from '../services/audioEngine';

export const AthkarListMode = ({
  athkarList,
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
      {athkarList.map((item, index) => {
        const count = item.count || 1;
        const current = progressMap[item.id] || 0;
        const isDone = current >= count;
        const remaining = Math.max(0, count - current);

        return (
          <div
            key={item.id}
            className={`athkar-list-card ${isDone ? 'completed' : ''}`}
          >
            {/* Arabic Text with Tashkeel */}
            <p className="athkar-card-arabic">{item.text}</p>

            {/* Reward Note if present */}
            {item.reward && (
              <div style={{ fontSize: '0.78rem', color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} />
                <span>{item.reward}</span>
              </div>
            )}

            {/* Source Reference */}
            {item.source && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {item.source}
              </span>
            )}

            {/* Footer with Tap Counter Button */}
            <div className="athkar-card-footer">
              <button
                className="banner-btn"
                onClick={() => onResetItem(item.id)}
                title="تصفير هذا الذكر"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <RotateCcw size={13} />
                <span>تصفير</span>
              </button>

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
