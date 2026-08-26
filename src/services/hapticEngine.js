// Android Haptic Feedback Engine: Native Capacitor Haptics + Web Vibration API Fallback
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticEngine {
  constructor() {
    this.enabled = true;
  }

  setEnabled(val) {
    this.enabled = !!val;
  }

  async tap() {
    if (!this.enabled) return;
    try {
      // Native Capacitor Android Haptics
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Fallback to Web Vibration API
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(22);
      }
    }
  }

  async completedZikr() {
    if (!this.enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 50, 40, 50, 90]);
      }
    }
  }

  async completedCategory() {
    if (!this.enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 60, 60, 60, 160]);
      }
    }
  }

  async azanAlert() {
    if (!this.enabled) return;
    try {
      await Haptics.vibrate({ duration: 1000 });
    } catch (e) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    }
  }

  async eqamaAlert() {
    if (!this.enabled) return;
    try {
      await Haptics.vibrate({ duration: 600 });
    } catch (e) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300]);
      }
    }
  }
}

export const hapticEngine = new HapticEngine();
