# 🕌 Rule 01: Islamic Data Integrity & Authentic Text Standards

## 🎯 Purpose

Maintain 100% authentic, verified, and accurately vowelled (Tashkeel) Islamic texts, Hadith citations, and astronomical calculation formulas.

## 📌 Non-Negotiable Rules:

1. **Full Tashkeel Preservation**:
   - All Athkar in `src/data/athkarData.js` and `src/components/DigitalTasbeeh.jsx` must include full Arabic diacritics (تَشْكِيل كَامِل).
   - Never strip or remove Tashkeel when modifying or adding Athkar texts.

2. **Authentic Hadith Sourcing**:
   - Every Zikr must cite its authentic source (`source` field) and reward virtue (`reward` field) from recognized Hadith collections (e.g. Sahih al-Bukhari, Sahih Muslim, Riyadh as-Salihin, Hisn al-Muslim).
   - Never invent or use unverified / weak Athkar.

3. **Prayer Calculation Method Formulas**:
   - All 12 calculation methods in `src/services/prayerEngine.js` must adhere to their official institutional parameters (Fajr/Isha angles and offsets).
   - Never arbitrarily alter prayer angles without verifying against standard astronomical authorities.

4. **Verification Step**:
   - Whenever any Islamic data is edited, run:
     ```bash
     node .agents/skills/islamic-data-verifier/scripts/verify-calculations.mjs
     ```
   - All 12 methods, 10 Tasbeeh presets, and 6 Athkar categories must pass.
