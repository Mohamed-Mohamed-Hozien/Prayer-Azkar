import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Navigation,
  MapPin,
  Sparkles,
  Info,
  RotateCw,
  Vibrate,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { compassEngine } from '../services/compassEngine';
import { hapticEngine } from '../services/hapticEngine';
import { getDistanceToKaabaKm } from '../services/prayerEngine';

export const QiblaCompassView = ({ settings, onOpenLocationModal }) => {
  const [compassData, setCompassData] = useState({
    heading: 0,
    qiblaBearing: 135,
    qiblaOffset: 0,
    isAligned: false,
    isSensorSupported: false,
    isCalibrated: false
  });

  const [manualHeading, setManualHeading] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasTriggeredAlignmentHaptic, setHasTriggeredAlignmentHaptic] = useState(false);
  const dialRef = useRef(null);

  const { location } = settings;
  const distanceKm = getDistanceToKaabaKm(location.lat, location.lng);

  // Initialize sensors and subscribe to compass engine
  useEffect(() => {
    compassEngine.updateLocation(location.lat, location.lng);
    compassEngine.initSensors();

    const unsubscribe = compassEngine.subscribe((data) => {
      setCompassData(data);

      if (data.isAligned) {
        if (!hasTriggeredAlignmentHaptic) {
          hapticEngine.azanAlert();
          setHasTriggeredAlignmentHaptic(true);
        }
      } else {
        setHasTriggeredAlignmentHaptic(false);
      }
    });

    return () => {
      unsubscribe();
      compassEngine.detachListener();
    };
  }, [location]);

  // Use active sensor heading if available, otherwise manual dial
  const currentHeading = compassData.isSensorSupported && compassData.isCalibrated
    ? compassData.heading
    : manualHeading;

  const qiblaBearing = compassData.qiblaBearing;
  let relativeKaabaAngle = (qiblaBearing - currentHeading + 360) % 360;
  if (relativeKaabaAngle > 180) relativeKaabaAngle -= 360;

  const isDirectlyAligned = Math.abs(relativeKaabaAngle) <= 3;

  // Touch / Mouse drag handler for manual dial fallback
  const handleDialPointerDown = (e) => {
    setIsDragging(true);
    updateManualAngle(e);
  };

  const handleDialPointerMove = (e) => {
    if (!isDragging) return;
    updateManualAngle(e);
  };

  const handleDialPointerUp = () => {
    setIsDragging(false);
  };

  const updateManualAngle = (e) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    let deg = (rad * (180 / Math.PI) + 90 + 360) % 360;
    setManualHeading(Math.round(deg));

    let diff = (qiblaBearing - deg + 360) % 360;
    if (diff > 180) diff -= 360;
    if (Math.abs(diff) <= 3) {
      hapticEngine.tap();
    }
  };

  return (
    <div
      className="compass-view-wrapper"
      onPointerMove={handleDialPointerMove}
      onPointerUp={handleDialPointerUp}
    >
      {/* Top Location & Distance Header */}
      <div className="compass-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--emerald-light)" />
            <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {location.nameAr}
            </span>
          </div>

          <button
            className="banner-btn"
            onClick={onOpenLocationModal}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            تغيير المدينة
          </button>
        </div>

        <div className="compass-distance-row">
          <div className="compass-info-box">
            <span className="compass-info-label">زاوية القبلة:</span>
            <span className="compass-info-val">{qiblaBearing}°</span>
          </div>

          <div className="compass-info-box">
            <span className="compass-info-label">المسافة إلى الكعبة:</span>
            <span className="compass-info-val">{distanceKm.toLocaleString()} كم</span>
          </div>

          <div className="compass-info-box">
            <span className="compass-info-label">اتجاه الهاتف:</span>
            <span className="compass-info-val">{Math.round(currentHeading)}°</span>
          </div>
        </div>
      </div>

      {/* Alignment Status Banner */}
      <div className={`compass-status-banner ${isDirectlyAligned ? 'aligned' : ''}`}>
        {isDirectlyAligned ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Sparkles size={18} color="#042f22" />
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
              أنت الآن باتجاه القبلة الشريفة تماماً 🕋
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Navigation size={16} color="var(--gold-light)" />
            <span>
              {relativeKaabaAngle > 0
                ? `أدر هاتفك لليمين بمقدار ${Math.abs(Math.round(relativeKaabaAngle))}°`
                : `أدر هاتفك لليسار بمقدار ${Math.abs(Math.round(relativeKaabaAngle))}°`}
            </span>
          </div>
        )}
      </div>

      {/* Main 3D Islamic Compass Dial */}
      <div className="compass-dial-container">
        <div
          ref={dialRef}
          className={`compass-dial-ring ${isDirectlyAligned ? 'aligned-glow' : ''}`}
          onPointerDown={handleDialPointerDown}
          style={{ transform: `rotate(${-currentHeading}deg)` }}
        >
          {/* Compass Rose Dial Background */}
          <div className="compass-dial-face">
            {/* North Indicator */}
            <div className="compass-cardinal compass-north">
              <span style={{ color: '#ef4444', fontWeight: '800' }}>شمال N</span>
            </div>
            <div className="compass-cardinal compass-east"><span>شرق E</span></div>
            <div className="compass-cardinal compass-south"><span>جنوب S</span></div>
            <div className="compass-cardinal compass-west"><span>غرب W</span></div>

            {/* Degree Ticks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="compass-tick"
                style={{ transform: `rotate(${deg}deg)` }}
              />
            ))}

            {/* Golden Kaaba Pointer Needle */}
            <div
              className="compass-kaaba-needle-arm"
              style={{ transform: `rotate(${qiblaBearing}deg)` }}
            >
              <div className="compass-kaaba-icon-badge">
                <span style={{ fontSize: '1.4rem' }}>🕋</span>
                <span className="compass-kaaba-tag">الكعبة</span>
              </div>
            </div>

            {/* Dial Center Pivot */}
            <div className="compass-center-pivot" />
          </div>
        </div>

        {/* Center Static Sight Pointer */}
        <div className="compass-device-pointer-arrow" />
      </div>

      {/* Sensor Info & Calibration Guide */}
      <div className="compass-calibration-card">
        {compassData.isSensorSupported ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <ShieldCheck size={18} color="var(--emerald-light)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              حساس البوصلة نشط ويعمل بالذكاء الجغرافي. حرّك هاتفك على شكل رقم (8) لمعايرة أدق.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Info size={18} color="var(--gold-light)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              وضع القرص اليدوي نشط: يمكنك سحب وتدوير القرص لمطابقة زاوية {qiblaBearing}° أو منح إذن البوصلة.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
