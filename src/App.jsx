import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { getActivePrayerState, formatPrayerTime } from './services/prayerEngine';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredCustomAthkar,
  saveStoredCustomAthkar,
  getStoredAthkarProgress,
  saveStoredAthkarProgress,
  getStoredTasbeeh,
  saveStoredTasbeeh
} from './services/storageEngine';
import { audioEngine } from './services/audioEngine';
import { hapticEngine } from './services/hapticEngine';
import { wakeLockEngine } from './services/wakeLockEngine';
import { notificationEngine } from './services/notificationEngine';

import { BottomNav } from './components/BottomNav';
import { PrayerView } from './components/PrayerView';
import { FloatingAzanBanner } from './components/FloatingAzanBanner';
import { LocationModal } from './components/LocationModal';
import { PrayerHabitTracker } from './components/PrayerHabitTracker';
import { syncPrayerAlarms, isNativeAzanPlaying, getNativePlayingPrayer, stopNativeAzan } from './services/alarmScheduler';

// Lazy-loaded secondary route chunks for fast initial mobile launch
const QiblaCompassView = lazy(() => import('./components/QiblaCompassView').then((m) => ({ default: m.QiblaCompassView })));
const QuranView = lazy(() => import('./components/QuranView').then((m) => ({ default: m.QuranView })));
const AthkarView = lazy(() => import('./components/AthkarView').then((m) => ({ default: m.AthkarView })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [customAthkar, setCustomAthkar] = useState(() => getStoredCustomAthkar());
  const [athkarProgress, setAthkarProgress] = useState(() => getStoredAthkarProgress());
  const [now, setNow] = useState(new Date());
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    isMuted: false,
    trackType: null,
    prayerName: '',
    volume: 0.9
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isHabitTrackerOpen, setIsHabitTrackerOpen] = useState(false);

  // Hardware Back Button listener for Android
  useEffect(() => {
    let backListener = null;

    const setupBackListener = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', () => {
          // 1. Close open modals first
          if (isLocationModalOpen) {
            setIsLocationModalOpen(false);
            return;
          }
          if (isHabitTrackerOpen) {
            setIsHabitTrackerOpen(false);
            return;
          }

          const path = location.pathname;

          // 2. Sub-routes back navigation
          if (path.startsWith('/quran/') && path !== '/quran') {
            navigate('/quran');
            return;
          }
          if (path.startsWith('/settings/') && path !== '/settings') {
            navigate('/settings');
            return;
          }
          if (path.startsWith('/athkar/') && path !== '/athkar') {
            navigate('/athkar');
            return;
          }

          // 3. Secondary tabs return to home (/prayer)
          if (path !== '/' && path !== '/prayer') {
            navigate('/prayer');
            return;
          }

          // 4. If already on home, exit app
          CapacitorApp.exitApp();
        });
      } catch (e) {}
    };

    setupBackListener();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [location.pathname, isLocationModalOpen, isHabitTrackerOpen]);

  // Triggered alert trackers to avoid duplicate firing in the same minute
  const firedAzansRef = useRef(new Set());
  const firedEqamasRef = useRef(new Set());
  const firedRemindersRef = useRef(new Set());
  const firedPreEqamaVoiceRef = useRef(new Set());
  const lastDayRef = useRef(new Date().toDateString());

  // Initialize Haptic and WakeLock on mount & Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  useEffect(() => {
    hapticEngine.setEnabled(settings.hapticEnabled);
    wakeLockEngine.setEnabled(settings.wakeLockEnabled);
    if (settings.wakeLockEnabled) {
      wakeLockEngine.request();
    }

    // Subscribe to Audio Engine state
    const unsubscribeAudio = audioEngine.subscribe((state) => {
      setAudioState(state);
    });

    // Check if Native Android Service is currently playing Azan
    if (isNativeAzanPlaying()) {
      setAudioState({
        isPlaying: true,
        isMuted: false,
        trackType: 'azan',
        prayerName: getNativePlayingPrayer() || 'الصلاة',
        volume: 0.9
      });
    }

    // Initial sync of exact alarms to Native Android AlarmManager (7 days ahead)
    syncPrayerAlarms(settings);

    console.log(`📍 [صلاتي وأذكاري] يعمل الآن - الموقع: ${settings.location.nameAr} (${settings.location.countryAr})`);

    return () => {
      unsubscribeAudio();
      wakeLockEngine.release();
    };
  }, []);

  // Global Volume Keys / Hardware listener to immediately stop active Azan
  useEffect(() => {
    if (!audioState.isPlaying) return;

    const handleKeyDown = (e) => {
      const isVolumeOrStopKey =
        e.code === 'AudioVolumeDown' ||
        e.code === 'AudioVolumeUp' ||
        e.key === 'VolumeDown' ||
        e.key === 'VolumeUp' ||
        e.key === 'Escape' ||
        e.key === ' ';

      if (isVolumeOrStopKey) {
        e.preventDefault();
        audioEngine.stopAll();
        hapticEngine.tap();
        console.log('🔇 [الأذان]: تم إيقاف صوت الأذان فوراً عبر أزرار الصوت / لوحة المفاتيح');
      }
    };

    window.__stopAzanFromHardware = () => {
      audioEngine.stopAll();
      stopNativeAzan();
      hapticEngine.tap();
      console.log('🔇 [الأذان]: تم إيقاف صوت الأذان فوراً عبر زر الصوت بالهاتف (Android Hardware Key)');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.__stopAzanFromHardware = null;
    };
  }, [audioState.isPlaying]);

  // Save settings when changed
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    hapticEngine.setEnabled(newSettings.hapticEnabled);
    syncPrayerAlarms(newSettings);
  };

  // Custom Athkar handlers
  const handleSaveCustomZikr = (newZikr) => {
    const updated = [newZikr, ...customAthkar];
    setCustomAthkar(updated);
    saveStoredCustomAthkar(updated);
  };

  // Athkar Progress Handlers
  const handleUpdateAthkarProgress = (itemId, count) => {
    const updated = { ...athkarProgress, [itemId]: count };
    setAthkarProgress(updated);
    saveStoredAthkarProgress(updated);
  };

  const handleResetCategoryProgress = (itemIds) => {
    const updated = { ...athkarProgress };
    itemIds.forEach((id) => {
      delete updated[id];
    });
    setAthkarProgress(updated);
    saveStoredAthkarProgress(updated);
  };

  // Main 1-Second Timer Loop
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      const todayStr = currentTime.toDateString();

      // Midnight Transition Handler: Reset daily fired sets and daily tasbeeh count
      if (lastDayRef.current !== todayStr) {
        lastDayRef.current = todayStr;
        firedAzansRef.current.clear();
        firedEqamasRef.current.clear();
        firedRemindersRef.current.clear();
        firedPreEqamaVoiceRef.current.clear();

        // Auto-reset daily tasbeeh in storage
        const currentTasbeeh = getStoredTasbeeh();
        if (currentTasbeeh.lastResetDate !== todayStr) {
          saveStoredTasbeeh({
            ...currentTasbeeh,
            dailyTotal: 0,
            lastResetDate: todayStr
          });
        }

        // Reschedule next 7 days of exact background alarms at midnight
        syncPrayerAlarms(settings);
      }

      // Sync native background Azan service state with React UI
      const nativePlaying = isNativeAzanPlaying();
      if (nativePlaying && !audioState.isPlaying) {
        setAudioState({
          isPlaying: true,
          isMuted: false,
          trackType: 'azan',
          prayerName: getNativePlayingPrayer() || 'الصلاة',
          volume: 0.9
        });
      } else if (!nativePlaying && audioState.isPlaying && audioState.trackType === 'azan' && !audioEngine.isPlaying) {
        setAudioState((prev) => ({ ...prev, isPlaying: false, trackType: null, prayerName: '' }));
      }

      setNow(currentTime);

      const prayerState = getActivePrayerState(currentTime, settings);
      const { todayTimes, nextPrayer, currentPrayer, countdown, eqamaState } = prayerState;

      // 1. Update Android Lockscreen & Pinned Status Bar Widget & Native Home Widget
      if (settings.showLockscreenWidget) {
        notificationEngine.updateLockscreenWidget(
          currentPrayer,
          nextPrayer,
          countdown.formatted,
          eqamaState?.isEqamaWindow,
          eqamaState?.formatted,
          { todayTimes, settings, audioState }
        );
      }

      // Format current timestamp string for deduplication (YYYY-MM-DD-HH-MM)
      const currentMinKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}-${currentTime.getHours()}-${currentTime.getMinutes()}`;

      // 2. Check for Azan Timings (30s tolerance window + minute deduplication)
      todayTimes.prayers.forEach((p) => {
        if (!p.time) return;
        const prayerMinKey = `${currentMinKey}-${p.id}-azan`;

        const timeDiffMs = Math.abs(currentTime.getTime() - p.time.getTime());
        if (timeDiffMs < 30000 && !firedAzansRef.current.has(prayerMinKey)) {
          firedAzansRef.current.add(prayerMinKey);

          const alertMode = settings.prayerAlertModes?.[p.id] || 'full';
          const reciterKey = p.id === 'fajr' ? (settings.fajrReciter || 'fajr') : settings.reciter;

          // Play Azan audio
          audioEngine.playAzan(reciterKey, p.nameAr, alertMode);
          hapticEngine.azanAlert();

          // Dispatch Notification
          notificationEngine.sendNotification(
            `حان الآن أذان ${p.nameAr}`,
            `الله أكبر • توقيت صلاة ${p.nameAr} في ${settings.location.nameAr}`,
            `azan-${p.id}`
          );
        }
      });

      // 3. Check for 5-Minute Pre-Iqamah Voiced Announcement
      if (settings.preIqamahVoiceEnabled !== false) {
        todayTimes.prayers.forEach((p) => {
          if (!p.hasIqamah || !p.eqamaTime) return;
          const voiceReminderTime = new Date(p.eqamaTime.getTime() - (settings.preIqamahVoiceMinutes || 5) * 60 * 1000);
          const voiceMinKey = `${currentMinKey}-${p.id}-pre-eqama-voice`;

          const voiceDiffMs = Math.abs(currentTime.getTime() - voiceReminderTime.getTime());
          if (voiceDiffMs < 30000 && !firedPreEqamaVoiceRef.current.has(voiceMinKey)) {
            firedPreEqamaVoiceRef.current.add(voiceMinKey);

            audioEngine.playPreIqamahVoiceAnnouncement(p.nameAr, settings.preIqamahVoiceMinutes || 5);
            hapticEngine.tap();

            notificationEngine.sendNotification(
              `اقتربت صلاة ${p.nameAr}`,
              `متبقي ٥ دقائق على إقامة صلاة ${p.nameAr} • استعد للوضوء`,
              `pre-eqama-${p.id}`
            );
          }
        });
      }

      // 4. Check for Eqama Timings
      todayTimes.prayers.forEach((p) => {
        if (!p.hasIqamah || !p.eqamaTime) return;
        const eqamaMinKey = `${currentMinKey}-${p.id}-eqama`;

        const eqamaDiffMs = Math.abs(currentTime.getTime() - p.eqamaTime.getTime());
        if (eqamaDiffMs < 30000 && !firedEqamasRef.current.has(eqamaMinKey)) {
          firedEqamasRef.current.add(eqamaMinKey);

          if (settings.eqamaAlertEnabled?.[p.id] !== false) {
            audioEngine.playEqamaAlert(settings.eqamaSound || 'voice', p.nameAr);
            hapticEngine.eqamaAlert();

            notificationEngine.sendNotification(
              `حان وقت إقامة ${p.nameAr}`,
              `استووا واعتدلوا لصلاة ${p.nameAr} • تقبل الله طاعتكم`,
              `eqama-${p.id}`
            );
          }
        }
      });

      // 5. Check for Pre-Azan Reminders
      todayTimes.prayers.forEach((p) => {
        if (!p.time || !settings.preReminderEnabled?.[p.id]) return;
        const reminderMins = settings.preReminderMinutes || 10;
        const reminderTime = new Date(p.time.getTime() - reminderMins * 60 * 1000);
        const reminderMinKey = `${currentMinKey}-${p.id}-pre`;

        const preDiffMs = Math.abs(currentTime.getTime() - reminderTime.getTime());
        if (preDiffMs < 30000 && !firedRemindersRef.current.has(reminderMinKey)) {
          firedRemindersRef.current.add(reminderMinKey);

          audioEngine.playPreAzanReminderTone();
          notificationEngine.sendNotification(
            `اقترب وقت أذان ${p.nameAr}`,
            `متبقي ${reminderMins} دقائق على أذان ${p.nameAr} • استعد للوضوء`,
            `pre-${p.id}`
          );
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  // Compute active state for current frame
  const currentPrayerState = getActivePrayerState(now, settings);

  return (
    <div className="app-container">
      {/* Floating Azan Player Banner (Dismissible on Azan playback) */}
      <FloatingAzanBanner
        audioState={audioState}
        eqamaState={currentPrayerState.eqamaState}
        onDismiss={() => audioEngine.stopAll()}
      />

      {/* Main Declarative Routes with Suspense Fallback */}
      <main style={{ flex: 1 }}>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                color: 'var(--emerald-light, #10b981)',
                gap: '8px',
                fontSize: '0.92rem',
                fontWeight: '600'
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid var(--border-emerald, #10b981)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span>جاري تحميل الصفحة...</span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/prayer" replace />} />
            <Route
              path="/prayer"
              element={
                <PrayerView
                  prayerState={currentPrayerState}
                  settings={settings}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                  onOpenTimingSettings={() => navigate('/settings/timings')}
                  onOpenAudioSettings={() => navigate('/settings/audio')}
                  onOpenHabitTracker={() => setIsHabitTrackerOpen(true)}
                />
              }
            />
            <Route
              path="/qibla"
              element={
                <QiblaCompassView
                  settings={settings}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                />
              }
            />
            <Route path="/quran" element={<QuranView />} />
            <Route path="/quran/:surahId" element={<QuranView />} />
            <Route
              path="/athkar"
              element={
                <AthkarView
                  customAthkar={customAthkar}
                  onSaveCustomZikr={handleSaveCustomZikr}
                  athkarProgress={athkarProgress}
                  onUpdateAthkarProgress={handleUpdateAthkarProgress}
                  onResetCategoryProgress={handleResetCategoryProgress}
                />
              }
            />
            <Route
              path="/athkar/:sectionOrCategory"
              element={
                <AthkarView
                  customAthkar={customAthkar}
                  onSaveCustomZikr={handleSaveCustomZikr}
                  athkarProgress={athkarProgress}
                  onUpdateAthkarProgress={handleUpdateAthkarProgress}
                  onResetCategoryProgress={handleResetCategoryProgress}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  prayerState={currentPrayerState}
                  initialSubTab="timings"
                />
              }
            />
            <Route
              path="/settings/:subtab"
              element={
                <SettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  prayerState={currentPrayerState}
                />
              }
            />
            <Route path="*" element={<Navigate to="/prayer" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Prayer Habit & Qada Tracker Drawer */}
      <PrayerHabitTracker
        isOpen={isHabitTrackerOpen}
        onClose={() => setIsHabitTrackerOpen(false)}
      />

      {/* Bottom Android Navigation (5 Tabs) */}
      <BottomNav />
    </div>
  );
}
