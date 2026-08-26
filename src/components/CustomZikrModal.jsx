import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { hapticEngine } from '../services/hapticEngine';

export const CustomZikrModal = ({ isOpen, onClose, onSaveCustomZikr }) => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(33);
  const [reward, setReward] = useState('');

  if (!isOpen) return null;

  const countPresets = [33, 100, 500, 1000];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newZikr = {
      id: `custom-${Date.now()}`,
      text: text.trim(),
      count: Number(count) || 33,
      reward: reward.trim() || 'ذكر وتعبد خالص لوجه الله',
      source: 'ذكر مخصص'
    };

    onSaveCustomZikr(newZikr);
    hapticEngine.completedZikr();
    setText('');
    setReward('');
    setCount(33);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--emerald-light)" />
            <h3 className="modal-title">إضافة ذكر أو تسبيح مخصص</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              نص الذكر (بالتشكيل إن وُجد):
            </label>
            <textarea
              className="custom-select"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '1.1rem', fontFamily: 'var(--font-arabic-calligraphy)' }}
              placeholder="مثال: لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              العدد المستهدف للتسبيح:
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {countPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`banner-btn ${count === preset ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: count === preset ? 'var(--emerald-primary)' : 'var(--bg-card-elevated)',
                    color: count === preset ? '#042f22' : 'var(--text-primary)',
                    fontWeight: '700'
                  }}
                  onClick={() => setCount(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="custom-select"
              style={{ width: '100%' }}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              min="1"
              max="100000"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              فضل الذكر أو ملاحظة (اختياري):
            </label>
            <input
              type="text"
              className="custom-select"
              style={{ width: '100%' }}
              placeholder="مثال: تفريج الكرب والهم"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="athkar-tap-counter-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'var(--emerald-primary)', color: '#042f22' }}
          >
            <Plus size={20} />
            <span>حفظ الذكر</span>
          </button>
        </form>
      </div>
    </div>
  );
};
