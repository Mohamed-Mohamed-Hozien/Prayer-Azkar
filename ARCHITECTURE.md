# 🕌 صلاتي وأذكاري (Prayer Times & Athkar) - Architecture & Developer Guide

> **Important for Any AI Agent / Developer**: Read this document first to understand the architecture, project structure, data flow, native Android bridges, audio synthesis, and offline-first capabilities of this project.

---

## 📌 1. Project Overview & Tech Stack

**"صلاتي وأذكاري"** is a high-performance, 100% offline-capable Islamic Super App built with:
- **Frontend Core**: React 19 + Vite (ES Modules)
- **Native Android Wrapper**: Capacitor 8 (`@capacitor/android`, `@capacitor/local-notifications`, `@capacitor/haptics`, `@capacitor/status-bar`)
- **Astronomical Calculation Engine**: `adhan` v4.4.3 (12 Global Calculation Methods + Hanafi/Shafi'i Madhabs)
- **Audio & Speech Engine**: Offline Bundled MP3s + Web Audio API Synthesizers + Web Speech API (Arabic Text-to-Speech) + IndexedDB Custom Audio Storage
- **Sensor Fusion Engine**: `DeviceOrientationEvent`, Magnetometer, Gyroscope with Low-Pass Filter
- **UI Design System**: Vanilla CSS with 5 Islamic Luxury Themes, Safe-Area Notch Clearance, and AMOLED OLED Optimization

---

## 🗂️ 2. Detailed Project Structure

```
├── android/                             # Native Android Studio Project
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml          # Permissions (Notifications, WakeLock, Location, Foreground)
│   │   ├── java/com/prayertimes/athkar/
│   │   │   ├── MainActivity.java        # Hosts AndroidWidgetBridge (JS -> Java bridge)
│   │   │   └── PrayerWidgetProvider.java# Native Android Home Screen AppWidget
│   │   └── res/layout/
│   │       └── prayer_widget_4x2.xml    # Native Android widget UI layout
│   └── build.gradle
├── public/
│   ├── audio/                           # High quality offline Azan MP3s & WAVs
│   ├── icons/                           # PWA & Android launcher icons
│   └── sw.js                            # Network-First PWA Service Worker with cache auto-purging
├── src/
│   ├── App.jsx                          # Main app root & 1-second background timing loop
│   ├── main.jsx                         # React 19 entry point
│   ├── index.css                        # 5-theme design system, responsive styles, animations
│   ├── components/                      # Modular UI Components
│   │   ├── PrayerView.jsx               # Hero countdown, timeline, Sunnah fasting banner, Eqama live banner
│   │   ├── QiblaCompassView.jsx         # 3D Islamic compass dial, Kaaba needle, haptic pulse (±3°)
│   │   ├── AthkarView.jsx               # Dual switcher (Daily Athkar vs Smart Digital Tasbeeh)
│   │   ├── DigitalTasbeeh.jsx           # Smart bead tap counter, target goals, presets, confetti
│   │   ├── AthkarFocusMode.jsx          # Focus view for single-zikr recitation
│   │   ├── AthkarListMode.jsx           # List view for browsing all category athkar
│   │   ├── SettingsView.jsx             # 5 Sub-tabs (Timings, Audio, Widgets, Location, Themes)
│   │   ├── WidgetSettings.jsx           # Widget customizer with real-time interactive preview
│   │   ├── AudioSettings.jsx            # Multi-Muadhin picker, custom MP3 upload, voiced pre-Iqamah test
│   │   ├── TimingSettings.jsx           # 12 Calculation methods, Madhab toggle, Hijri +/-2d adjustment
│   │   ├── LocationSettings.jsx         # City search & GPS coordinates
│   │   ├── LocationModal.jsx            # Quick city selector dialog
│   │   ├── CustomZikrModal.jsx          # Add custom zikr modal
│   │   ├── FloatingAzanBanner.jsx       # Floating audio player banner when Azan plays
│   │   └── BottomNav.jsx                # Modern 4-tab navigation bar
│   ├── services/                        # Business Logic & Native Service Engines
│   │   ├── prayerEngine.js              # Adhan astronomical prayer calculations, Eqama & Qibla math
│   │   ├── compassEngine.js             # Device orientation sensor fusion & Kaaba bearing
│   │   ├── audioEngine.js               # Multi-Muadhin audio playback, Arabic Speech Synthesis, Web Audio
│   │   ├── notificationEngine.js        # Capacitor LocalNotifications, Pinned ongoing widget, AndroidWidgetBridge
│   │   ├── storageEngine.js             # LocalStorage & IndexedDB custom MP3 storage
│   │   ├── hapticEngine.js              # Tactile vibration engine
│   │   └── wakeLockEngine.js            # Screen wake-lock engine
│   └── data/                            # Static & Dynamic Datasets
│       ├── athkarData.js                # Authentic Adhkar categories & text database
│       ├── citiesData.js                # World cities coordinates database
│       └── islamicCalendar.js           # Hijri date calculations & Sunnah fasting detector
├── capacitor.config.json                # Capacitor configuration
├── package.json
└── vite.config.js
```

---

## ⚡ 3. Key Subsystems & How They Work

### 🕌 1. Prayer Calculation Engine (`prayerEngine.js` & `TimingSettings.jsx`)
- Computes exact astronomical times using the `adhan` library based on user coordinates (`Coordinates(lat, lng)`).
- **12 Global Calculation Methods Supported**:
  1. `Egyptian`: Egyptian General Authority of Survey (Fajr 19.5°, Isha 17.5°)
  2. `UmmAlQura`: Umm Al-Qura University, Makkah (Fajr 18.5°, Isha +90m)
  3. `MuslimWorldLeague`: Muslim World League (Fajr 18°, Isha 17°)
  4. `NorthAmerica`: ISNA (Fajr 15°, Isha 15°)
  5. `Dubai`: Dubai Islamic Affairs (Fajr 18.2°, Isha 18.2°)
  6. `Kuwait`: Ministry of Awqaf Kuwait (Fajr 18°, Isha 17.5°)
  7. `Qatar`: Ministry of Awqaf Qatar (Fajr 18°, Isha +90m)
  8. `Karachi`: University of Islamic Sciences Karachi (Fajr 18°, Isha 18°)
  9. `Singapore`: MUIS Singapore (Fajr 20°, Isha 18°)
  10. `Turkey`: Diyanet (Fajr 18°, Isha 17°)
  11. `France`: UOIF (Fajr 12°, Isha 12°)
  12. `MoonsightingCommittee`: Moonsighting Committee worldwide
- **Juristic Madhab**: Shafi'i (Standard) vs Hanafi (2x shadow length).
- **Eqama Window Tracking**: Calculates the active window between Azan and Eqama and computes remaining seconds for the live countdown banner.
- **Hijri Date Calibration**: Allows shifting the calculated Hijri day by `-2` to `+2` days to match local moonsighting.

### 🧭 2. Qibla Compass Sensor Fusion (`compassEngine.js` & `QiblaCompassView.jsx`)
- Calculates great-circle forward azimuth to the Kaaba (`21.422487, 39.826206`) and distance in kilometers.
- Listens to `DeviceOrientationEvent` (`alpha` and iOS `webkitCompassHeading`).
- Applies a low-pass filter with circular interpolation to eliminate sensor jitter.
- **Haptic Alignment Feedback**: Triggers a haptic pulse and glowing aura when the device points directly at the Kaaba (within ±3°).
- **Automatic Fallback**: If sensors are uncalibrated, disabled, or on desktop, provides a smooth interactive draggable touch/mouse dial.

### 📿 3. Smart Digital Tasbeeh (`DigitalTasbeeh.jsx`)
- **Center Circular Bead Tap Counter**: Tactile bead tapping with `pointer-events: none` on the background SVG progress ring to guarantee responsive touches without double-counting.
- **Target Goals**: 33, 99, 100, 1000, and Free / Infinity mode.
- **Celebration Confetti**: Triggers `canvas-confetti` and vibration upon completing the target.
- **Zikr Presets & Auto-Advance**: Preloaded with 10 authentic Adhkar with automatic progression to the next zikr.
- **Persistent Daily Totals**: Saves daily tally and session progress in `storageEngine.js`.

### 🎙️ 4. Audio Engine & Arabic Speech Synthesis (`audioEngine.js` & `AudioSettings.jsx`)
- **Multi-Muadhin Library**:
  - Makkah Al-Mukarramah
  - Madinah Al-Munawwarah
  - Al-Aqsa Mosque
  - Sheikh Mishary Rashid Alafasy
  - Sheikh Abdulbasit Abdussamad
  - Sheikh Mahmoud Khalil Al-Hussary
  - Sheikh Nasser Al-Qatami
  - Fajr-specific Azans
- **Custom Local MP3 Upload**: Users can pick any MP3/WAV file from their device; it is stored as a binary Blob in **IndexedDB** (`prayer_custom_audio_db`) for full offline playback.
- **Voiced 5-Minute Pre-Iqamah Arabic Announcement**: Uses the native browser **Web Speech API** (`SpeechSynthesisUtterance`) in Arabic (`ar-SA`) to announce:
  > *"اقتربت صلاة [الظهر]، متبقي ٥ دقائق على الإقامة. تقبل الله طاعتكم."*
- **Offline Synthesizers**: Web Audio API oscillator sequence fallback for alarms, double-beep mosque tones, and tasbeeh clicks.

### 📱 5. Native Android Home Screen Widget & Pinned Notifications
- **Bridge Architecture**:
  1. JavaScript calls `notificationEngine.updateLockscreenWidget(..., fullState)` on every 1-second tick or settings update.
  2. `notificationEngine` invokes `window.AndroidWidgetBridge.updateWidgetData(jsonString)`.
  3. `MainActivity.java` receives the JSON payload in its `@JavascriptInterface` method and writes it into `SharedPreferences` (`prayer_widget_prefs`).
  4. `PrayerWidgetProvider.updateAllWidgets(context)` updates all native Android Home Screen widgets in real time with the active prayer, 12h/24h time format, city name, and live countdown.
- **Pinned Ongoing Notification**: Configured with `ongoing: true` in `@capacitor/local-notifications` so it functions as a sticky lockscreen/status bar widget that cannot be swiped away accidentally.

### 🎨 6. Multi-Theme Design System (`index.css` & `SettingsView.jsx`)
- 5 Handcrafted Theme Palettes via `data-theme` attribute:
  1. `dark` (الزمردي والذهبي الفاخر - Luxury Emerald & Gold)
  2. `oled` (الأسود الليلي الداكن - 100% True OLED Pure Black)
  3. `sapphire` (الأزرق الملكي والفضي - Royal Sapphire & Silver)
  4. `desert` (رمل الصحراء والغروب - Desert Twilight & Amber)
  5. `light` (النهاري المشرق والأنيق - Pure Clean Light)
- **Top Safe-Area Clearance**: Configured with `padding-top: max(var(--safe-top), 60px)` to guarantee full clearance under Android status bar icons (clock, battery, Wi-Fi, camera notch).
- **Bottom Scroll Clearance**: Configured with `padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + 70px)` so all cards and buttons can scroll completely above the bottom navigation bar.

---

## 🛠️ 4. Build & Development Commands

```bash
# 1. Start local Vite development server
npm run dev

# 2. Build production web bundle
npm run build

# 3. Synchronize web assets to native Android project
npx cap sync android

# 4. Open project in Android Studio
npx cap open android

# 5. Build Native Android Debug APK via Gradle (from android/ directory)
cd android
./gradlew.bat assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk
```
