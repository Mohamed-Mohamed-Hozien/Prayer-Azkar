---
name: mobile-sensors-testing
description: Test and emulate mobile sensor fusion (DeviceOrientation, Compass Heading), touch debounce on digital tasbeeh, and offline PWA service worker caching.
---

# Mobile Sensors & Offline Testing Skill

This skill provides automated tests and emulation recipes for mobile sensor fusion, touch responsiveness, and offline caching across diverse Android screen densities.

## 🎯 Capabilities
1. **Compass Heading & Sensor Fusion Emulation**: Simulates alpha/beta/gamma gyroscope rotation and iOS `webkitCompassHeading` to test Qibla alignment triggering at ±3°.
2. **Digital Tasbeeh Touch Debounce Testing**: Verifies that rapid physical tap sequences (e.g., 50ms intervals) increment the counter strictly +1 without duplicate event bubbling.
3. **PWA Offline Asset Verification**: Inspects `sw.js` cache tables to guarantee that all audio files, icons, and fonts load with zero internet connection.

## 🚀 Execution

Run the built-in sensor and responsiveness simulation script:

```bash
node .agents/skills/mobile-sensors-testing/scripts/simulate-sensors.mjs
```

## 📐 Sensor Alignment Formula Reference
* **Kaaba Coordinates**: Latitude `21.422487° N`, Longitude `39.826206° E`
* **Forward Azimuth Formula**:
  $$\theta = \text{atan2}(\sin(\Delta \lambda) \cdot \cos(\phi_2), \cos(\phi_1) \cdot \sin(\phi_2) - \sin(\phi_1) \cdot \cos(\phi_2) \cdot \cos(\Delta \lambda))$$
* **Alignment Threshold**: $|\text{Heading} - \text{QiblaBearing}| \le 3^\circ$ triggers haptic pulse and gold aura.
