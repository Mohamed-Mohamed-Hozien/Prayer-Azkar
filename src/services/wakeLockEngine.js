// Screen WakeLock Engine to keep device screen awake during Athkar or Iqamah

class WakeLockEngine {
  constructor() {
    this.wakeLock = null;
    this.enabled = true;
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (!this.enabled) {
      this.release();
    }
  }

  async request() {
    if (!this.enabled) return;
    if ('wakeLock' in navigator) {
      try {
        if (!this.wakeLock) {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  }

  release() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }
}

export const wakeLockEngine = new WakeLockEngine();
