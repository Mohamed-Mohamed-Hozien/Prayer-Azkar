import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Upload,
  Trash2,
  Bell,
  Sparkles,
  Sliders,
  CheckCircle,
  Radio,
  Mic,
  MessageSquare
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { hapticEngine } from '../services/hapticEngine';
import { saveCustomAzanAudio, getCustomAzanAudios, deleteCustomAzanAudio } from '../services/storageEngine';
import { PRAYER_NAMES } from '../services/prayerEngine';

export const AudioSettings = ({ settings, onUpdateSettings }) => {
  const [playingReciter, setPlayingReciter] = useState(null);
  const [customAudios, setCustomAudios] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCustomAudiosList();
  }, []);

  const loadCustomAudiosList = async () => {
    const list = await getCustomAzanAudios();
    setCustomAudios(list);
  };

  const handleTestAudio = (reciterKey, isFajr = false) => {
    hapticEngine.tap();
    if (playingReciter === reciterKey) {
      audioEngine.stopAll();
      setPlayingReciter(null);
    } else {
      setPlayingReciter(reciterKey);
      audioEngine.playAzan(reciterKey, isFajr ? 'الفجر' : 'الصلاة', 'full');
    }
  };

  const handleSelectReciter = (key, isFajr = false) => {
    hapticEngine.tap();
    if (isFajr) {
      onUpdateSettings({ ...settings, fajrReciter: key });
    } else {
      onUpdateSettings({ ...settings, reciter: key });
    }
  };

  const handleAlertModeChange = (prayerId, mode) => {
    hapticEngine.tap();
    const updated = {
      ...settings,
      prayerAlertModes: {
        ...settings.prayerAlertModes,
        [prayerId]: mode
      }
    };
    onUpdateSettings(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const id = 'custom_' + Date.now();
      const name = file.name.replace(/\.[^/.]+$/, '');
      await saveCustomAzanAudio(id, name, file);
      await audioEngine.loadCustomAudios();
      await loadCustomAudiosList();
      handleSelectReciter(id, false);
      hapticEngine.azanAlert();
    } catch (err) {
      console.error('Error uploading custom audio:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustom = async (id, e) => {
    e.stopPropagation();
    hapticEngine.tap();
    await deleteCustomAzanAudio(id);
    await audioEngine.loadCustomAudios();
    await loadCustomAudiosList();
    if (settings.reciter === id) {
      onUpdateSettings({ ...settings, reciter: 'makkah' });
    }
  };

  const handleTestPreIqamahVoice = () => {
    hapticEngine.tap();
    audioEngine.playPreIqamahVoiceAnnouncement('الظهر', settings.preIqamahVoiceMinutes || 5);
  };

  const reciters = audioEngine.recitersList;

  return (
    <div className="settings-tab-content">
      {/* 1. Main Prayer Reciters */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Volume2 size={20} color="var(--emerald-light)" />
          <span>اختيار المؤذن للصلوات اليومية</span>
        </div>

        <div className="audio-reciters-list">
          {reciters.filter((r) => !r.isFajr).map((r) => {
            const isSelected = settings.reciter === r.id;
            const isPlaying = playingReciter === r.id;

            return (
              <div
                key={r.id}
                className={`audio-reciter-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectReciter(r.id, false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`radio-dot ${isSelected ? 'active' : ''}`} />
                  <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--emerald-light)' : 'var(--text-primary)' }}>
                    {r.nameAr}
                  </span>
                </div>

                <button
                  className={`audio-preview-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestAudio(r.id, false);
                  }}
                  title="استماع لتجربة الصوت"
                >
                  {isPlaying ? <Square size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'إيقاف' : 'استماع'}</span>
                </button>
              </div>
            );
          })}

          {/* User Custom Uploaded Azans */}
          {customAudios.map((c) => {
            const isSelected = settings.reciter === c.id;
            const isPlaying = playingReciter === c.id;

            return (
              <div
                key={c.id}
                className={`audio-reciter-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectReciter(c.id, false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`radio-dot ${isSelected ? 'active' : ''}`} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: '700', color: isSelected ? 'var(--emerald-light)' : 'var(--text-primary)', display: 'block' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>ملف مخصص من جهازك</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`audio-preview-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestAudio(c.id, false);
                    }}
                  >
                    {isPlaying ? <Square size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    className="icon-circle-btn"
                    style={{ width: '32px', height: '32px', color: '#ef4444' }}
                    onClick={(e) => handleDeleteCustom(c.id, e)}
                    title="حذف الملف المخصص"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Audio Upload Button */}
        <div style={{ marginTop: '12px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/wav,audio/m4a,audio/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            className="banner-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', borderColor: 'var(--border-emerald)', color: 'var(--emerald-light)' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload size={16} />
            <span>{isUploading ? 'جاري حفظ الملف...' : 'رفع أذان مخصص من هاتفك (MP3/WAV)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Fajr Specific Azan Reciter */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Sparkles size={20} color="var(--gold-light)" />
          <span>أذان صلاة الفجر (مع جملة "الصلاة خير من النوم")</span>
        </div>

        <div className="audio-reciters-list">
          {reciters.filter((r) => r.isFajr).map((r) => {
            const isSelected = settings.fajrReciter === r.id;
            const isPlaying = playingReciter === r.id;

            return (
              <div
                key={r.id}
                className={`audio-reciter-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectReciter(r.id, true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`radio-dot ${isSelected ? 'active' : ''}`} />
                  <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--gold-light)' : 'var(--text-primary)' }}>
                    {r.nameAr}
                  </span>
                </div>

                <button
                  className={`audio-preview-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestAudio(r.id, true);
                  }}
                >
                  {isPlaying ? <Square size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'إيقاف' : 'استماع'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Voiced 5-Minute Pre-Iqamah Announcement */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Mic size={20} color="var(--emerald-light)" />
          <span>تنبيه الإقامة الصوتي المسبق (قبل ٥ دقائق)</span>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          تنبيه صوتي باللغة العربية ينبهك قبل موعد إقامة الصلاة بخمس دقائق للاستعداد والوضوء دون الحاجة لفتح الشاشة.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            تفعيل التنبيه الصوتي قبل الإقامة
          </span>
          <input
            type="checkbox"
            checked={settings.preIqamahVoiceEnabled !== false}
            onChange={(e) => onUpdateSettings({ ...settings, preIqamahVoiceEnabled: e.target.checked })}
            style={{ accentColor: 'var(--emerald-primary)', width: '18px', height: '18px' }}
          />
        </div>

        <button
          className="banner-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '9px', gap: '6px' }}
          onClick={handleTestPreIqamahVoice}
        >
          <MessageSquare size={16} />
          <span>استماع لتجربة النداء الصوتي ("متبقي ٥ دقائق على الإقامة")</span>
        </button>
      </div>

      {/* 4. Per-Prayer Alert Mode Controls */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Bell size={20} color="var(--gold-light)" />
          <span>تخصيص نوع التنبيه لكل صلاة</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PRAYER_NAMES.map((p) => {
            const currentMode = settings.prayerAlertModes?.[p.id] || (p.id === 'sunrise' ? 'silent' : 'full');

            return (
              <div
                key={p.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-arabic-calligraphy)' }}>
                  {p.nameAr}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'full', label: 'أذان كامل' },
                    { id: 'takbeer', label: 'تكبيرتان' },
                    { id: 'beep', label: 'نغمة' },
                    { id: 'silent', label: 'صامت' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      className={`subtab-pill ${currentMode === m.id ? 'active' : ''}`}
                      onClick={() => handleAlertModeChange(p.id, m.id)}
                      style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
