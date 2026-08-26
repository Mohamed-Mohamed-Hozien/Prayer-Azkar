import React from 'react';
import { Volume2, VolumeX, Square, BellRing, Sparkles } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

export const FloatingAzanBanner = ({ audioState, eqamaState, onDismiss }) => {
  if (!audioState || !audioState.isPlaying) return null;

  const isAzan = audioState.trackType === 'azan';
  const isEqama = audioState.trackType === 'eqama';

  const handleToggleMute = () => {
    audioEngine.toggleMute();
  };

  const handleStop = () => {
    audioEngine.stopAll();
    if (onDismiss) onDismiss();
  };

  return (
    <div className="floating-azan-banner" role="alert" aria-live="assertive">
      <div className="banner-left">
        <div className="banner-pulse-icon">
          <BellRing size={20} />
        </div>
        <div className="banner-text-group">
          <span className="banner-title">
            {isAzan ? `حان الآن أذان ${audioState.prayerName}` : `حان وقت إقامة ${audioState.prayerName}`}
          </span>
          <span className="banner-subtitle">
            {isAzan ? 'يُرفع الأذان الآن • تقبل الله طاعتكم' : 'استووا واعتدلوا للصلاة'}
          </span>
        </div>
      </div>

      <div className="banner-actions">
        <button
          className="banner-btn"
          onClick={handleToggleMute}
          title={audioState.isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
        >
          {audioState.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span>{audioState.isMuted ? 'صامت' : 'مسموع'}</span>
        </button>

        <button
          className="banner-btn stop"
          onClick={handleStop}
          title="إيقاف الأذان"
        >
          <Square size={14} fill="currentColor" />
          <span>إيقاف</span>
        </button>
      </div>
    </div>
  );
};
