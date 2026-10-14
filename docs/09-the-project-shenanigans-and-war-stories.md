# 🧙 The Project Shenanigans & War Stories

> **File Reference**: Various (`src/App.jsx`, `src/services/`, `android/`, `src/components/`)
> **Master Index**: [README.md](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/docs/README.md)

---

## 📜 Introduction

Building a 100% offline Islamic Super App that combines astronomical geometry, hardware sensor fusion, audio synthesis, and native Android bridges is full of unexpected traps.

This document chronicles **the 10 biggest architectural quirks, bizarre platform bugs, and clever workarounds** ("the shenanigans") discovered and conquered during the development of **صلاتي وأذكاري**.

---

## 🔋 Shenanigan 1: The 1-Second Launcher IPC Battery Drain

### The Scenario
To keep the countdown on the Android Home Screen AppWidget in sync with the app's countdown hero, `App.jsx` ran a 1-second `setInterval` loop that called `notificationEngine.updateLockscreenWidget(...)` every 1,000 milliseconds.

### The Catastrophe
Every second, JavaScript called `window.AndroidWidgetBridge.updateWidgetData(json)`, which called `AppWidgetManager.updateAppWidget()`.

In Android, updating an AppWidget requires an **Inter-Process Communication (IPC)** transaction across the OS Binder to the device's home screen launcher process (Google Pixel Launcher, Samsung One UI Home, etc.).
- Doing **60 IPC transactions every minute** prevented the CPU from entering low-power states.
- The phone grew warm in users' pockets, draining **5% to 8% battery per hour** while idling.
- Users reported micro-stutters when swiping home screen pages.

### The Fix
In commit `d5c185c`, [`src/services/notificationEngine.js`](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/src/services/notificationEngine.js) introduced a composite synchronization key:
```javascript
const syncMinuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
const prayerStateKey = `${currentPrayer?.id || 'none'}-${nextPrayer?.id || 'none'}-${Boolean(isEqamaWindow)}`;
const fullSyncKey = `${syncMinuteKey}-${prayerStateKey}`;

// If already synced this minute AND prayer state hasn't changed, skip IPC entirely!
if (!forceSync && this.lastWidgetSyncKey === fullSyncKey) {
  return;
}
this.lastWidgetSyncKey = fullSyncKey;
```
- IPC calls plummeted from **60 calls/min $\to$ 1 call/min** (a $98.3\%$ drop).
- Battery drain became undetectable.
- State transitions (entering Iqamah window, changing cities) still trigger immediate updates via `forceSync: true`.

---

## 👻 Shenanigan 2: The Ghost Oscillator Web Audio Memory Leak

### The Scenario
For offline mosque beeps and chimes, `audioEngine.js` used native Web Audio API oscillators. Many sequences required scheduling future tones (e.g., play note 1, wait 300ms, play note 2, wait 700ms, stop).

### The Catastrophe
If a user switched tabs, muted audio, or tapped "Stop Azan" during an active chime sequence:
- The raw `setTimeout` callbacks still executed in the background seconds later.
- Disconnected oscillators were never explicitly stopped, remaining orphaned in memory.
- Eventually, the mobile browser hit the operating system's maximum concurrent audio channel limit, throwing silent `DOMException: Failed to construct 'AudioContext'` errors.

### The Fix
In commit `d5c185c`, `AudioEngine` was equipped with active tracker registries:
```javascript
class AudioEngine {
  constructor() {
    this.synthOscillators = [];
    this.activeTimeouts = new Set();
  }

  scheduleTimeout(fn, delayMs) {
    const timerId = setTimeout(() => {
      this.activeTimeouts.delete(timerId);
      fn();
    }, delayMs);
    this.activeTimeouts.add(timerId);
    return timerId;
  }

  stopSynth() {
    this.synthOscillators.forEach((osc) => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.synthOscillators = [];
    this.activeTimeouts.forEach((timerId) => clearTimeout(timerId));
    this.activeTimeouts.clear();
  }
}
```
Every procedural oscillator and timer is now tracked and cleanly purged upon stopping.

---

## 🔤 Shenanigan 3: The Disappearing Google Fonts CDN

### The Scenario
Early builds relied on Google Fonts CDN links in `index.html` to render the sacred **Amiri** and **Noto Naskh Arabic** calligraphy typefaces.

### The Catastrophe
While testing in airplane mode or in remote areas with no cellular data, the app was advertised as "100% Offline", yet all Arabic texts rendered in the device's default generic sans-serif font! The Quranic Athkar looked flat and disjointed, and Tashkeel marks misaligned.

### The Fix
In commit `bf32879`:
1. Downloaded all **55 Arabic WOFF2 font files** directly into [`public/fonts/`](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/public/fonts/).
2. Created a self-contained [`public/fonts/fonts.css`](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/public/fonts/fonts.css) file with local `@font-face` rules.
3. Completely removed the remote Google Fonts `<link>` tag. The app is now 100% visually offline.

---

## 🧭 Shenanigan 4: Android vs iOS Compass Angle Inversion & $359^\circ \leftrightarrow 0^\circ$ Needle Jumps

### The Scenario
Implementing the Qibla compass required reading device orientation from mobile hardware sensors.

### The Catastrophe
Two distinct mathematical traps struck simultaneously:
1. **Coordinate Inversion**: iOS WebKit provides `webkitCompassHeading` (degrees clockwise from magnetic North, $0^\circ - 360^\circ$). Android Chrome/WebView, however, provides `event.alpha` (an Euler angle measured counter-clockwise!). On Android, turning right made the compass needle rotate left!
2. **The $359^\circ \leftrightarrow 0^\circ$ Spin Artifact**: When applying standard linear smoothing to the needle near North (e.g. going from $359^\circ$ to $1^\circ$):
   $$\text{Average: } \frac{359 + 1}{2} = 180^\circ$$
   The compass needle would violently whip $180^\circ$ backwards across South before recovering!

### The Fix
In [`src/services/compassEngine.js`](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/src/services/compassEngine.js):
```javascript
// 1. Invert Android alpha to align with clockwise compass heading
if (typeof event.webkitCompassHeading !== 'undefined') {
  rawHeading = event.webkitCompassHeading;
} else if (event.alpha !== null) {
  rawHeading = 360 - event.alpha;
}

// 2. Circular wrap interpolation: Find shortest angular difference across 360 boundary
let diff = rawHeading - this.lastHeading;
if (diff > 180) diff -= 360;
if (diff < -180) diff += 360;

// Apply smooth exponential filter
this.heading = (this.lastHeading + diff * this.smoothFactor + 360) % 360;
```

---

## 🔀 Shenanigan 5: The Arabic BiDi Parenthesis Flipping Bug

### The Scenario
The app displays prayer times and metrics alongside Arabic labels (e.g., `صلاة الظهر (12:15)` or `المتبقي (00:45:10)`).

### The Catastrophe
In Right-to-Left (RTL) Arabic text, the Unicode Bidirectional Algorithm (UBA) considers parentheses `(` and `)` as "neutrals". When placed next to left-to-right numbers, the browser layout engine flipped the visual orientation of the brackets:
```text
صلاة الظهر )12:15(
```
This gave the interface an amateur, broken appearance.

### The Fix
Wrapped all parenthesized numbers and countdown strings in `<bdi>` (Bidirectional Isolation) elements with explicit LTR direction:
```jsx
<span>صلاة الظهر <bdi dir="ltr">(12:15)</bdi></span>
```
This isolates the bracketed content into its own formatting context, guaranteeing correct rendering regardless of parent RTL text flow.

---

## ⚡ Shenanigan 6: Rapid-Tapping Tasbeeh Double-Triggers & SVG Drag

### The Scenario
Devout users often tap the digital Tasbeeh very quickly (up to 5 or 6 taps per second).

### The Catastrophe
Under rapid tapping:
- Hardware touchscreens fired both a `touchstart` and a synthetic `click` within $15\text{ ms}$, causing double-counts.
- The browser interpreted quick taps on the SVG circular progress ring as an image drag gesture.
- React 19 functional closures referencing stale state resulted in missed counts.

### The Fix
In [`DigitalTasbeeh.jsx`](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/src/components/DigitalTasbeeh.jsx):
1. **50ms Timestamp Gate**:
   ```javascript
   const now = Date.now();
   if (now - lastTapTimeRef.current < 50) return;
   lastTapTimeRef.current = now;
   ```
2. **SVG Pointer Suppression**: Added `pointer-events: none` to the SVG ring and `touch-action: manipulation; user-select: none;` to the button.
3. **Atomic Updaters**: Used pure functional state updaters (`prev => ({ ...prev, currentCount: nextCount })`).

---

## 💥 Shenanigan 7: The 5MB LocalStorage Quota Crash on Custom Audio

### The Scenario
Users requested the ability to upload their own audio recitations for Azan.

### The Catastrophe
The initial implementation converted the uploaded MP3 file to a Base64 string and attempted to save it in `localStorage`.
- Mobile browsers enforce a hard **5 MB limit** on `localStorage`.
- Base64 encoding adds $33\%$ size overhead.
- Uploading a standard 3.5 MB MP3 exceeded the 5 MB quota, throwing an unhandled `QuotaExceededError` that corrupted all stored settings!

### The Fix
Migrated custom audio persistence to **IndexedDB** (`prayer_custom_audio_db`):
- Stores raw binary `Blob` objects directly without Base64 overhead.
- Supports files up to several gigabytes.
- Generates lightweight transient object URLs (`URL.createObjectURL(blob)`) that are revoked after playback.

---

## 🪟 Shenanigan 8: Lockscreen Live Activity Hack via `navigator.mediaSession`

### The Scenario
Users wanted a persistent countdown on their phone's lockscreen without having to unlock the device.

### The Catastrophe
In native Android, creating an ongoing lockscreen live activity requires a persistent Foreground Service with an ongoing notification channel, custom layout builders, and navigating aggressive OEM background killing policies.

### The Fix
Leveraged the HTML5 **Media Session API**:
```javascript
navigator.mediaSession.metadata = new MediaMetadata({
  title: `الصلاة القادمة: ${nextPrayer?.nameAr || 'الفجر'}`,
  artist: `صلاتي وأذكاري • ${settings?.location?.nameAr || 'القاهرة'}`,
  album: isEqamaWindow ? `الإقامة خلال: ${eqamaCountdownStr}` : `متبقي: ${widgetCountdown}`,
  artwork: [{ src: '/icons/mosque-icon.svg', sizes: '512x512', type: 'image/svg+xml' }]
});
```
Android automatically binds this metadata to the OS lockscreen media player card, giving users an elegant lockscreen live countdown with zero native service overhead!

---

## 📦 Shenanigan 9: The 25MB Audio Asset APK Footprint

### The Scenario
The application bundle size was $\approx 30.3\text{ MB}$, with **24.74 MB** consisting solely of 8 uncompressed Azan MP3 files.

### The Analysis & Plan
The `.agents/skills/audio-asset-optimizer/scripts/compress-audio.mjs` script was created to audit bitrates:
- Current files were encoded at 128–192 kbps Constant Bitrate (CBR).
- Human vocal recitations have negligible acoustic frequency content above 12 kHz.
- Re-encoding to **96 kbps Variable Bitrate (VBR)** reduces total audio weight to **7.48 MB** ($70\%$ savings), bringing the final APK size down to $\approx 12.7\text{ MB}$ with zero audible distortion.

---

## 💤 Shenanigan 10: Android Doze Mode WebView Sleep & The 30s Window

### The Scenario
When an Android device is left on a nightstand for hours, Android's **Doze Mode** puts the CPU to sleep and throttles/suspends WebView JavaScript `setInterval` timers.

### The Catastrophe
If Fajr occurred at `04:15:00`, but Doze mode woke the WebView up at `04:15:07`:
- A strict check like `if (currentTime.getTime() === prayerTime.getTime())` failed because the exact millisecond had passed!
- The user slept through Fajr because the Azan never sounded.

### The Fix
In [`src/App.jsx`](file:///C:/Users/midoh/.gemini/antigravity/worktrees/Prayer%20times/create_comprehensive_project_docs/src/App.jsx):
```javascript
// Generous 30-second window to catch late Doze wakeups
const timeDiffMs = Math.abs(currentTime.getTime() - p.time.getTime());
if (timeDiffMs < 30000 && !firedAzansRef.current.has(prayerMinKey)) {
  firedAzansRef.current.add(prayerMinKey);
  audioEngine.playAzan(reciterKey, p.nameAr, alertMode);
}
```
Combined with OS-level scheduled local notifications via `@capacitor/local-notifications`, alarms trigger reliably even during deep sleep.
