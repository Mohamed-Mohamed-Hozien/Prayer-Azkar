/**
 * Qibla Compass Sensor Fusion Engine
 * Handles DeviceOrientation, iOS permission requests, low-pass smoothing,
 * and Kaaba azimuth calculations.
 */

import { Coordinates, Qibla } from 'adhan';

const KAABA_COORDS = { lat: 21.422487, lng: 39.826206 };

class CompassEngine {
  constructor() {
    this.heading = 0; // Device heading 0-360 relative to North
    this.qiblaBearing = 135; // Target Qibla bearing from user coords
    this.accuracy = 0;
    this.isSensorSupported = false;
    this.isCalibrated = false;
    this.listeners = new Set();
    this.handleOrientation = this.handleOrientation.bind(this);
    this.lastHeading = 0;
    this.smoothFactor = 0.15;
    this.attachedEventType = null;
  }

  /**
   * Request sensor permissions (required on iOS 13+) and initialize listeners
   */
  async initSensors() {
    if (typeof window === 'undefined') return false;

    // iOS 13+ permission request
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          this.attachListener('deviceorientation');
          return true;
        }
      } catch (e) {
        console.warn('iOS orientation permission error:', e);
      }
    } else if ('ondeviceorientationabsolute' in window) {
      this.attachListener('deviceorientationabsolute');
      return true;
    } else if ('ondeviceorientation' in window) {
      this.attachListener('deviceorientation');
      return true;
    }

    return false;
  }

  attachListener(type = 'deviceorientation') {
    if (typeof window === 'undefined') return;
    this.detachListener();
    window.addEventListener(type, this.handleOrientation, true);
    this.attachedEventType = type;
    this.isSensorSupported = true;
  }

  detachListener() {
    if (typeof window === 'undefined') return;
    if (this.attachedEventType) {
      window.removeEventListener(this.attachedEventType, this.handleOrientation, true);
      this.attachedEventType = null;
    }
    window.removeEventListener('deviceorientation', this.handleOrientation, true);
    window.removeEventListener('deviceorientationabsolute', this.handleOrientation, true);
  }

  handleOrientation(event) {
    let rawHeading = null;

    // iOS webkitCompassHeading is magnetic heading (0 to 360)
    if (typeof event.webkitCompassHeading !== 'undefined') {
      rawHeading = event.webkitCompassHeading;
      this.accuracy = event.webkitCompassAccuracy || 10;
      this.isSensorSupported = true;
    } else if (event.absolute && event.alpha !== null) {
      // Android absolute orientation
      rawHeading = 360 - event.alpha;
      this.isSensorSupported = true;
    } else if (event.alpha !== null) {
      rawHeading = 360 - event.alpha;
      this.isSensorSupported = true;
    }

    if (rawHeading !== null && !isNaN(rawHeading)) {
      rawHeading = (rawHeading % 360 + 360) % 360;

      // Smooth heading with circular interpolation to prevent 359->0 wrap jump
      let diff = rawHeading - this.lastHeading;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      this.heading = (this.lastHeading + diff * this.smoothFactor + 360) % 360;
      this.lastHeading = this.heading;
      this.isCalibrated = true;
      this.notify();
    }
  }

  /**
   * Updates target Kaaba bearing based on user location coordinates
   */
  updateLocation(lat, lng) {
    try {
      const coords = new Coordinates(lat, lng);
      this.qiblaBearing = Math.round(Qibla(coords));
    } catch (e) {
      this.qiblaBearing = 135;
    }
    this.notify();
  }

  /**
   * Computes the angle difference between device heading and Kaaba direction
   * (0 means pointing directly at Kaaba)
   */
  getQiblaOffset() {
    let offset = (this.qiblaBearing - this.heading + 360) % 360;
    if (offset > 180) offset -= 360;
    return offset;
  }

  /**
   * Check if device is aligned with Kaaba within given tolerance (default ±3 degrees)
   */
  isAlignedWithKaaba(tolerance = 3) {
    return Math.abs(this.getQiblaOffset()) <= tolerance;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      heading: this.heading,
      qiblaBearing: this.qiblaBearing,
      qiblaOffset: this.getQiblaOffset(),
      isAligned: this.isAlignedWithKaaba(),
      isSensorSupported: this.isSensorSupported,
      isCalibrated: this.isCalibrated
    });

    return () => this.listeners.delete(callback);
  }

  notify() {
    const data = {
      heading: Math.round(this.heading),
      qiblaBearing: this.qiblaBearing,
      qiblaOffset: Math.round(this.getQiblaOffset()),
      isAligned: this.isAlignedWithKaaba(),
      isSensorSupported: this.isSensorSupported,
      isCalibrated: this.isCalibrated
    };
    this.listeners.forEach((cb) => cb(data));
  }
}

export const compassEngine = new CompassEngine();
