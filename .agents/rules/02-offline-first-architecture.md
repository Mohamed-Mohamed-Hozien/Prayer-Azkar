# 📦 Rule 02: 100% Offline-First Architecture Standards

## 🎯 Purpose

Guarantee that the application runs completely standalone on Android devices without requiring any internet connection or backend server.

## 📌 Non-Negotiable Rules:

1. **Zero External Network Dependencies**:
   - Never add HTTP/REST API calls for prayer times, Athkar, or audio.
   - All calculations must execute client-side via `adhan.js` and local mathematical formulas.

2. **Local Storage Guarantees**:
   - User settings, Athkar progress, and Tasbeeh state are persisted in `localStorage` via `storageEngine.js`.
   - Custom uploaded Azan audio files are stored in `IndexedDB` (`prayer_custom_audio_db`) as binary Blobs.

3. **Audio Self-Containment**:
   - Built-in Azan audio files reside in `public/audio/` and are bundled with the app.
   - Fallback synthesis utilizes Web Audio API oscillators and `window.speechSynthesis`.
   - Keep total audio asset footprint under ~25MB (or optimize via `audio-asset-optimizer` skill).

4. **Service Worker Offline Caching**:
   - Maintain `sw.js` with network-first / cache-fallback strategy for all core assets (`index.html`, icons, scripts, audio).
   - Test offline cache coverage before releasing updates:
     ```bash
     node .agents/skills/mobile-sensors-testing/scripts/simulate-sensors.mjs
     ```
