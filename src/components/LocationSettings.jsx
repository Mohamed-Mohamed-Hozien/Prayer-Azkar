import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Check,
  Globe,
  Compass,
  AlertCircle
} from 'lucide-react';
import { CITIES_DATABASE, CALCULATION_METHODS } from '../data/citiesData';
import { hapticEngine } from '../services/hapticEngine';

export const LocationSettings = ({ settings, onUpdateSettings, onCloseModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Filter offline database
  const filteredCities = CITIES_DATABASE.filter((city) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      city.nameAr.includes(q) ||
      city.countryAr.includes(q) ||
      city.nameEn.toLowerCase().includes(q)
    );
  });

  const handleSelectCity = (city) => {
    hapticEngine.completedZikr();
    onUpdateSettings({
      ...settings,
      location: {
        id: city.id,
        nameAr: city.nameAr,
        countryAr: city.countryAr,
        lat: city.lat,
        lng: city.lng,
        isManual: false
      },
      calculationMethod: city.method || settings.calculationMethod
    });
    if (onCloseModal) onCloseModal();
  };

  const handleDetectGPS = () => {
    hapticEngine.tap();
    setLocationError('');
    setIsLocating(true);

    if (!('geolocation' in navigator)) {
      setLocationError('خاصية تحديد الموقع الجغرافي غير مدعومة في جهازك.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        hapticEngine.completedZikr();
        onUpdateSettings({
          ...settings,
          location: {
            id: 'gps_custom',
            nameAr: 'موقعي الحالي (GPS)',
            countryAr: 'مباشر',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isManual: true
          }
        });
        if (onCloseModal) onCloseModal();
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS error:', err);
        setLocationError('تعذر الحصول على إحداثيات GPS، يرجى اختيار مدينتك من القائمة أدناه.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMethodChange = (methodId) => {
    hapticEngine.tap();
    onUpdateSettings({
      ...settings,
      calculationMethod: methodId
    });
  };

  const handleMadhabChange = (madhabId) => {
    hapticEngine.tap();
    onUpdateSettings({
      ...settings,
      madhab: madhabId
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* GPS Detection Button */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Navigation size={18} color="var(--emerald-light)" />
          <span>تحديد الموقع التلقائي (GPS)</span>
        </div>

        <button
          className="athkar-tap-counter-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '11px', background: 'var(--bg-card-elevated)', color: 'var(--emerald-light)' }}
          onClick={handleDetectGPS}
          disabled={isLocating}
        >
          <Navigation size={18} />
          <span>{isLocating ? 'جارٍ تحديد الإحداثيات...' : 'تحديد موقعي الدقيق عبر GPS'}</span>
        </button>

        {locationError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F87171', fontSize: '0.78rem' }}>
            <AlertCircle size={14} />
            <span>{locationError}</span>
          </div>
        )}
      </div>

      {/* Offline City Search Database */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Globe size={18} color="var(--gold-light)" />
          <span>قاعدة بيانات المدن (تعمل بالكامل بدون إنترنت)</span>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="custom-select"
            style={{ width: '100%', paddingRight: '36px' }}
            placeholder="ابحث عن مدينتك أو دولتك (مثال: القاهرة، مكة، دبي)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* City List Scroll */}
        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredCities.slice(0, 35).map((city) => {
            const isSelected = settings.location?.id === city.id;
            return (
              <div
                key={city.id}
                onClick={() => handleSelectCity(city)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card-elevated)',
                  border: isSelected ? '1px solid var(--emerald-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {city.nameAr}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '6px' }}>
                    ({city.countryAr})
                  </span>
                </div>

                {isSelected && <Check size={16} color="var(--emerald-light)" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculation Method & Juristic School */}
      <div className="settings-section-card">
        <div className="settings-section-title">
          <Compass size={18} color="var(--emerald-light)" />
          <span>طريقة الحساب الفلكي والمذهب</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>الهيئة الفلكية المعتمدة:</label>
          <select
            className="custom-select"
            value={settings.calculationMethod}
            onChange={(e) => handleMethodChange(e.target.value)}
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-item-row" style={{ marginTop: '8px' }}>
          <span className="setting-item-name">مذهب حساب صلاة العصر:</span>

          <select
            className="custom-select"
            value={settings.madhab}
            onChange={(e) => handleMadhabChange(e.target.value)}
            style={{ fontSize: '0.82rem' }}
          >
            <option value="shafi">الجمهور (الشافعي والمالكي والحنبلي)</option>
            <option value="hanafi">المذهب الحنفي (مثل الظل مرتين)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
