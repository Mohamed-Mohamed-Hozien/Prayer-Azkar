---
name: islamic-data-verifier
description: Verify astronomical calculation formulas, 12 global prayer methods, Hijri calendar algorithms, and authentic Hadith Athkar texts.
---

# Islamic Data & Astronomical Verifier Skill

This skill provides verification suites to guarantee theological and astronomical accuracy for prayer calculations, Sunnah fasting calendar detection, and authentic Athkar references.

## 🎯 Capabilities

1. **Astronomical Formula Checks**: Validates solar zenith angles, Fajr/Isha twilight degrees across all 12 supported calculation methods (Egyptian Authority, Umm Al-Qura, MWL, ISNA, Dubai, Kuwait, Qatar, Karachi, MUIS, Diyanet, France, Moonsighting).
2. **Madhab Asr Shadow Ratio**: Verifies Shafi'i/Standard ($1 \times \text{shadow}$) vs Hanafi ($2 \times \text{shadow}$) prayer start times.
3. **Sunnah Fasting Calendar Logic**: Simulates detection for Mondays, Thursdays, White Days (13th, 14th, 15th of Hijri months), Arafah (9 Dhul-Hijjah), and Ashura (10 Muharram).
4. **Authentic Athkar & Tasbeeh Consistency**: Validates all 10 Tasbeeh presets, daily zikr categories, Arabic Tashkeel completeness, and default repetition targets.

## 🚀 Execution

Run the calculation and Athkar verification script:

```bash
node .agents/skills/islamic-data-verifier/scripts/verify-calculations.mjs
```
