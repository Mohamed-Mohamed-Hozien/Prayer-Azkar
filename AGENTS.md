# 🤖 AI Agent & Model Guidelines (Prayer-Azkar)

> **Welcome AI Assistant!**  
> This file is your master configuration and operating guideline when exploring, modifying, or creating features in the **Prayer-Azkar** repository.

---

## 🏛️ Project Identity & Architecture
- **Repository**: `Mohamed-Mohamed-Hozien/Prayer-Azkar`
- **Application**: صلاتي وأذكاري (Islamic Prayer Times & Athkar)
- **Target Platform**: Android Standalone APK (Capacitor 8) + Responsive PWA
- **Tech Stack**: React 19 + Vite 6 + Capacitor 8 + Vanilla CSS (No Tailwind) + Android Java Native Bridge
- **Guiding Principle**: **100% Offline-First**, zero external API calls, privacy-friendly, zero ads.

---

## 📜 Active Rulesets (`.agents/rules/`)

Before writing or editing code, strictly adhere to the 4 workspace rulesets:

1. **[01-islamic-data-integrity.md](.agents/rules/01-islamic-data-integrity.md)**:
   - Preserve full Arabic Tashkeel across all Athkar.
   - Every Zikr must have an authentic Hadith citation and virtue.
   - Do NOT alter the 12 calculation method angle formulas arbitrarily.

2. **[02-offline-first-architecture.md](.agents/rules/02-offline-first-architecture.md)**:
   - Zero external network requests.
   - Use `localStorage` for state and `IndexedDB` for custom audio blobs.
   - Maintain PWA service worker caching (`sw.js`).

3. **[03-android-responsive-ux.md](.agents/rules/03-android-responsive-ux.md)**:
   - Use Vanilla CSS and CSS tokens in `src/index.css`.
   - Maintain `dir="rtl"` and Arabic calligraphy fonts (`Amiri`, `Noto Naskh Arabic`).
   - Use fluid `clamp()` and multi-column responsive grids on tablets.
   - Support safe-area insets (`env(safe-area-inset-*)`).

4. **[04-git-contributor-workflow.md](.agents/rules/04-git-contributor-workflow.md)**:
   - Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
   - Run verification scripts before pushing.
   - Sync Android native assets with `npx cap sync android`.

---

## 🧪 Available Skills & Test Runners (`.agents/skills/`)

Whenever making changes, run the corresponding verification script:

| Skill | Script | Purpose |
|:---|:---|:---|
| 🕌 **`islamic-data-verifier`** | `node .agents/skills/islamic-data-verifier/scripts/verify-calculations.mjs` | Verifies 12 calculation methods, 10 Tasbeeh presets, 6 Athkar categories |
| 🧭 **`mobile-sensors-testing`** | `node .agents/skills/mobile-sensors-testing/scripts/simulate-sensors.mjs` | Tests Qibla bearing math, sensor alignment (±3°), and Service Worker cache |
| 🎨 **`rtl-arabic-ux-linter`** | `node .agents/skills/rtl-arabic-ux-linter/scripts/lint-arabic-rtl.mjs` | Lints RTL consistency, typography, notch clearance, and tap touch-action |
| 🔊 **`audio-asset-optimizer`** | `node .agents/skills/audio-asset-optimizer/scripts/compress-audio.mjs` | Audits audio file sizes and bitrate footprint |

---

## 📁 Key Source Directory Map
- `src/services/prayerEngine.js` — Astronomical calculations via `adhan.js`.
- `src/services/audioEngine.js` — Audio playback, Web Audio synthesis, ringtone chimes.
- `src/services/compassEngine.js` — `DeviceOrientation` sensor fusion.
- `src/services/notificationEngine.js` — Local notifications & Android widget bridge.
- `src/services/storageEngine.js` — Persistent state management (`localStorage` + `IndexedDB`).
- `src/components/` — 15 React components (PrayerView, DigitalTasbeeh, QiblaCompassView, AthkarView, SettingsView...).
- `android/` — Capacitor Android project with `MainActivity.java` and `PrayerWidgetProvider.java`.
