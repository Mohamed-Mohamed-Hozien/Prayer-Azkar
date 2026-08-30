// Comprehensive Audio Engine: Local Offline Assets, Web Audio Synthesizer,
// Web Speech API Arabic Voice Announcements & Custom IndexedDB Audio Player

import { getCustomAzanAudios } from './storageEngine';

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.currentAudio = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.9;
    this.listeners = new Set();
    this.synthOscillators = [];
    this.currentTrackType = null; // 'azan' | 'eqama' | 'voice' | 'reminder'
    this.currentPrayerName = '';
    this.customAudioMap = new Map(); // id -> objectUrl

    // High quality offline audio assets
    this.audioSources = {
      makkah: '/audio/azan-makkah.mp3',
      madinah: '/audio/azan-madinah.mp3',
      alafasy: '/audio/azan-alafasy.mp3',
      abdulbasit: '/audio/azan-abdulbasit.mp3',
      // TODO: Replace placeholders with dedicated authentic studio recordings
      alhussary: '/audio/azan-makkah.mp3',
      alqatami: '/audio/azan-alafasy.mp3',
      alaqsa: '/audio/azan-alaqsa.mp3',
      fajr: '/audio/azan-fajr.mp3',
      fajr_alafasy: '/audio/azan-fajr.mp3',
      takbeer: '/audio/takbeer.mp3',
      eqama_beep: '/audio/iqamah-beep.wav'
    };

    this.recitersList = [
      { id: 'makkah', nameAr: 'أذان الحرم المكي الشريف', isFajr: false },
      { id: 'madinah', nameAr: 'أذان المسجد النبوي الشريف', isFajr: false },
      { id: 'alaqsa', nameAr: 'أذان المسجد الأقصى المبارك', isFajr: false },
      { id: 'alafasy', nameAr: 'الشيخ مشاري راشد العفاسي', isFajr: false },
      { id: 'abdulbasit', nameAr: 'الشيخ عبد الباسط عبد الصمد', isFajr: false },
      { id: 'alhussary', nameAr: 'الشيخ محمود خليل الحصري', isFajr: false },
      { id: 'alqatami', nameAr: 'الشيخ ناصر القطامي', isFajr: false },
      { id: 'fajr', nameAr: 'أذان الفجر المكي (الصلاة خير من النوم)', isFajr: true },
      { id: 'fajr_alafasy', nameAr: 'أذان الفجر للعفاسي', isFajr: true }
    ];

    this.loadCustomAudios();
  }

  async loadCustomAudios() {
    try {
      const records = await getCustomAzanAudios();
      records.forEach((rec) => {
        if (rec.blob) {
          const url = URL.createObjectURL(rec.blob);
          this.customAudioMap.set(rec.id, { url, name: rec.name });
        }
      });
    } catch (e) {}
  }

  // Initialize and unlock AudioContext on touch/click
  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudio) {
      this.currentAudio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.currentAudio) {
      this.currentAudio.volume = this.isMuted ? 0 : this.volume;
    }
    this.notifyState();
    return this.isMuted;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyState() {
    const state = {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      trackType: this.currentTrackType,
      prayerName: this.currentPrayerName,
      volume: this.volume
    };
    this.listeners.forEach((cb) => cb(state));
  }

  stopAll() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.stopSynth();
    this.isPlaying = false;
    this.currentTrackType = null;
    this.currentPrayerName = '';
    this.notifyState();
  }

  stopSynth() {
    this.synthOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.synthOscillators = [];
  }

  /**
   * Plays Azan audio (built-in or custom user uploaded file)
   */
  playAzan(reciterKey = 'makkah', prayerName = 'الصلاة', alertMode = 'full') {
    this.stopAll();
    this.initAudioContext();

    if (alertMode === 'silent') return;
    if (alertMode === 'beep') {
      this.playMosqueBeep();
      return;
    }

    this.isPlaying = true;
    this.currentTrackType = 'azan';
    this.currentPrayerName = prayerName;
    this.notifyState();

    // Check if custom uploaded audio
    let audioUrl = null;
    if (this.customAudioMap.has(reciterKey)) {
      audioUrl = this.customAudioMap.get(reciterKey).url;
    } else {
      const actualKey = reciterKey in this.audioSources ? reciterKey : 'makkah';
      audioUrl = this.audioSources[actualKey];
    }

    const audio = new Audio(audioUrl);
    audio.volume = this.isMuted ? 0 : this.volume;
    this.currentAudio = audio;

    // If Takbeer-only mode, stop after 18 seconds
    if (alertMode === 'takbeer') {
      setTimeout(() => {
        if (this.currentTrackType === 'azan' && this.currentAudio === audio) {
          this.stopAll();
        }
      }, 18000);
    }

    audio.onended = () => {
      this.isPlaying = false;
      this.currentAudio = null;
      this.notifyState();
    };

    audio.onerror = (err) => {
      console.warn('Audio playback fallback to synthesizer:', err);
      this.playHarmonicChimeSequence();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Autoplay restriction or missing file fallback:', err);
        this.playHarmonicChimeSequence();
      });
    }
  }

  /**
   * Plays a melodic ringtone chime for the 5-Minute Pre-Iqamah reminder
   */
  playPreIqamahVoiceAnnouncement(prayerName = 'الصلاة', minutesLeft = 5) {
    this.stopAll();
    this.initAudioContext();

    if (this.isMuted) return;

    this.isPlaying = true;
    this.currentTrackType = 'voice';
    this.currentPrayerName = prayerName;
    this.notifyState();

    // Play a pleasant ascending ringtone chime instead of TTS voice
    const ctx = this.audioCtx;
    if (!ctx) { this.isPlaying = false; this.notifyState(); return; }

    const notes = [523.25, 659.25, 783.99, 880, 1046.50]; // C5 E5 G5 A5 C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const startTime = now + idx * 0.28;
      const duration = 0.55;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.55, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Follow with a double beep
    setTimeout(() => {
      this.playMosqueDoubleBeep();
    }, notes.length * 280 + 300);

    setTimeout(() => {
      this.isPlaying = false;
      this.notifyState();
    }, notes.length * 280 + 1200);
  }

  /**
   * Plays Eqama Alert Sound
   */
  playEqamaAlert(soundType = 'voice', prayerName = 'الصلاة') {
    this.stopAll();
    this.initAudioContext();

    this.isPlaying = true;
    this.currentTrackType = 'eqama';
    this.currentPrayerName = prayerName;
    this.notifyState();

    if (soundType === 'double_beep') {
      const audio = new Audio(this.audioSources.eqama_beep);
      audio.volume = this.isMuted ? 0 : this.volume;
      this.currentAudio = audio;
      audio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        this.notifyState();
      };
      audio.play().catch(() => this.playMosqueDoubleBeep());
    } else if (soundType === 'tone') {
      this.playHarmonicChimeSequence();
    } else {
      // Melodic ringtone chime for Iqamah alert
      this.playIqamahVoiceSynth();
    }
  }

  /**
   * Pure Web Audio Synthesizer for Mosque Beep
   */
  playMosqueBeep() {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    gain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    setTimeout(() => {
      this.isPlaying = false;
      this.notifyState();
    }, 600);
  }

  playMosqueDoubleBeep() {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.8, now);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.connect(gainNode);
    osc1.start(now);
    osc1.stop(now + 0.18);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.25);
    osc2.connect(gainNode);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.55);

    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    setTimeout(() => {
      this.isPlaying = false;
      this.notifyState();
    }, 700);
  }

  playIqamahVoiceSynth() {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.2);
      
      const startTime = now + idx * 0.2;
      const duration = 0.4;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume * 0.6, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    setTimeout(() => {
      this.playMosqueDoubleBeep();
    }, 900);
  }

  playHarmonicChimeSequence() {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    const chords = [
      [440, 554.37, 659.25],
      [587.33, 739.99, 880]
    ];

    const now = ctx.currentTime;
    chords.forEach((chord, chordIdx) => {
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + chordIdx * 0.8);

        const startTime = now + chordIdx * 0.8;
        const duration = 1.2;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume * 0.5, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    });

    setTimeout(() => {
      this.isPlaying = false;
      this.notifyState();
    }, 3000);
  }

  playPreAzanReminderTone() {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playTasbeehTapSound() {
    try {
      const ctx = this.initAudioContext();
      if (!ctx || this.isMuted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
