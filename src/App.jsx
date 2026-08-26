import React, { useState, useEffect, useRef } from 'react';
import { getActivePrayerState, formatPrayerTime } from './services/prayerEngine';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredCustomAthkar,
  saveStoredCustomAthkar,
  getStoredAthkarProgress,
  saveStoredAthkarProgress
} from './services/storageEngine';
import { audioEngine } from './services/audioEngine';
import { hapticEngine } from './services/hapticEngine';
import { wakeLockEngine } from './services/wakeLockEngine';
import { notificationEngine } from './services/notificationEngine';

import { BottomNav } from './components/BottomNav';
import { PrayerView } from './components/PrayerView';
import { QiblaCompassView } from './components/QiblaCompassView';
import { AthkarView } from './components/AthkarView';
import { SettingsView } from './components/SettingsView';
import { FloatingAzanBanner } from './components/FloatingAzanBanner';
import { LocationModal } from './components/LocationModal';

export function App() {
  // State
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [customAthkar, setCustomAthkar] = useState(() => getStoredCustomAthkar());
  const [athkarProgress, setAthkarProgress] = useState(() => getStoredAthkarProgress());
  const [activeTab, setActiveTab] = useState('prayer');
  const [now, setNow] = useState(new Date());
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    isMuted: false,
    trackType: null,
    prayerName: '',
    volume: 0.9
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState('timings');

  // Triggered alert trackers to avoid duplicate firing in the same minute
  const firedAzansRef = useRef(new Set());
  const firedEqamasRef = useRef(new Set());
  const firedRemindersRef = useRef(new Set());
  const firedPreEqamaVoiceRef = useRef(new Set());

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

    return () => {
      unsubscribeAudio();
      wakeLockEngine.release();
    };
  }, []);

  // Save settings when changed
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    hapticEngine.setEnabled(newSettings.hapticEnabled);
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
          { todayTimes, settings }
        );
      }

      // Format current timestamp string for deduplication (YYYY-MM-DD-HH-MM)
      const currentMinKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}-${currentTime.getHours()}-${currentTime.getMinutes()}`;

      // 2. Check for Azan Timings
      todayTimes.prayers.forEach((p) => {
        if (!p.time) return;
        const prayerMinKey = `${currentMinKey}-${p.id}-azan`;

        const timeDiffMs = Math.abs(currentTime.getTime() - p.time.getTime());
        if (timeDiffMs < 1000 && !firedAzansRef.current.has(prayerMinKey)) {
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
          if (voiceDiffMs < 1000 && !firedPreEqamaVoiceRef.current.has(voiceMinKey)) {
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
        if (eqamaDiffMs < 1000 && !firedEqamasRef.current.has(eqamaMinKey)) {
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
        if (preDiffMs < 1000 && !firedRemindersRef.current.has(reminderMinKey)) {
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

  const handleOpenTimingSettings = () => {
    setSettingsInitialSubTab('timings');
    setActiveTab('settings');
  };

  const handleOpenAudioSettings = () => {
    setSettingsInitialSubTab('audio');
    setActiveTab('settings');
  };

  return (
    <div className="app-container">
      {/* Floating Azan Player Banner (Dismissible on Azan playback) */}
      <FloatingAzanBanner
        audioState={audioState}
        eqamaState={currentPrayerState.eqamaState}
        onDismiss={() => audioEngine.stopAll()}
      />

      {/* Main Tab Views */}
      <main style={{ flex: 1 }}>
        {activeTab === 'prayer' && (
          <PrayerView
            prayerState={currentPrayerState}
            settings={settings}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onOpenTimingSettings={handleOpenTimingSettings}
            onOpenAudioSettings={handleOpenAudioSettings}
          />
        )}

        {activeTab === 'qibla' && (
          <QiblaCompassView
            settings={settings}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
          />
        )}

        {activeTab === 'athkar' && (
          <AthkarView
            customAthkar={customAthkar}
            onSaveCustomZikr={handleSaveCustomZikr}
            athkarProgress={athkarProgress}
            onUpdateAthkarProgress={handleUpdateAthkarProgress}
            onResetCategoryProgress={handleResetCategoryProgress}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            prayerState={currentPrayerState}
            initialSubTab={settingsInitialSubTab}
          />
        )}
      </main>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Bottom Android Navigation (4 Tabs) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          hapticEngine.tap();
          setActiveTab(tab);
        }}
      />
    </div>
  );
}
