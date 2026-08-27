---
name: audio-asset-optimizer
description: Inspect, audit, and optimize offline Azan audio assets to reduce APK size from 30MB down to ~8-12MB while preserving acoustic quality.
---

# Audio Asset Optimization Skill

This skill audits audio bitrate, duration, format, and file size across `public/audio/` and provides automated compression workflows to minimize standalone Android APK download size.

## 🎯 Capabilities
1. **Audio Asset Audit**: Inspects all bundled Azan MP3s and WAV files, displaying file size, duration estimate, and potential compression savings.
2. **Compression Target**: Identifies files exceeding 128kbps that can be safely re-encoded to 64–96kbps VBR (Opus/AAC/MP3) for a **60–75% reduction in APK footprint** with zero perceptible quality degradation.
3. **Lossless Tag & Metadata Stripping**: Strips unnecessary ID3 album art images embedded in audio files to save storage.

## 🚀 Execution

Run the audio asset audit script:

```bash
node .agents/skills/audio-asset-optimizer/scripts/compress-audio.mjs
```

## 📊 Standard Optimization Benchmarks
| Audio Reciter | Original Size | Optimized (96kbps) | Reduction |
| :--- | :---: | :---: | :---: |
| `azan-makkah.mp3` | ~4.8 MB | ~1.4 MB | **-71%** |
| `azan-madinah.mp3` | ~4.5 MB | ~1.3 MB | **-71%** |
| `azan-alafasy.mp3` | ~4.2 MB | ~1.2 MB | **-71%** |
| `azan-abdulbasit.mp3` | ~5.1 MB | ~1.5 MB | **-70%** |
| `azan-alaqsa.mp3` | ~4.6 MB | ~1.4 MB | **-70%** |
| **Total Audio Bundle** | **~28 MB** | **~8 MB** | **~20 MB Saved!** |
