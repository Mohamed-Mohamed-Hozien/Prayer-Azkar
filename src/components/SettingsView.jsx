import React, { useState } from 'react';
import {
  Clock,
  Volume2,
  MapPin,
  Palette,
  Smartphone,
  Info,
  Layers,
  Sparkles,
  Sliders,
  Moon,
  Sun,
  Shield,
  Vibrate,
  Eye
} from 'lucide-react';
import { TimingSettings } from './TimingSettings';
import { AudioSettings } from './AudioSettings';
import { WidgetSettings } from './WidgetSettings';
import { LocationSettings } from './LocationSettings';
import { hapticEngine } from '../services/hapticEngine';

export const THEMES_LIST = [
  {
    id: 'dark',
    nameAr: 'الزمردي والذهبي الفاخر',
    desc: 'النمط الإسلامي الكلاسيكي الأخضر مع لمسات ذهبية فاخرة',
    previewBg: 'linear-gradient(135deg, #022c22, #04100c)',
    accentColor: '#10b981',
    goldColor: '#f59e0b'
  },
  {
    id: 'oled',
    nameAr: 'الأسود الليلي الداكن (OLED)',
    desc: 'أسود نقي ١٠٠٪ موفر للطاقة وشديد الوضوح لشاشات AMOLED',
    previewBg: '#000000',
    accentColor: '#10b981',
    goldColor: '#e2e8f0'
  },
  {
    id: 'sapphire',
    nameAr: 'الأزرق الملكي والفضي',
    desc: 'أزرق كحلي ليلي هادئ وراقي مستوحى من سماء الصحراء',
    previewBg: 'linear-gradient(135deg, #0f172a, #020617)',
    accentColor: '#38bdf8',
    goldColor: '#94a3b8'
  },
  {
    id: 'desert',
    nameAr: 'رمل الصحراء والغروب الدافئ',
    desc: 'درجات رملية عنبرية دافئة مريحة للعين',
    previewBg: 'linear-gradient(135deg, #2b1404, #120700)',
    accentColor: '#f59e0b',
    goldColor: '#fbbf24'
  },
  {
    id: 'light',
    nameAr: 'النهاري المشرق والأنيق',
    desc: 'نمط فاتح نظيف ومريح للقراءة في ضوء النهار',
    previewBg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    accentColor: '#059669',
    goldColor: '#d97706',
    isLight: true
  }
];

export const SettingsView = ({ settings, onUpdateSettings, prayerState, initialSubTab = 'timings' }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const handleSubTabChange = (tabId) => {
    hapticEngine.tap();
    setActiveSubTab(tabId);
  };

  const handleThemeChange = (themeId) => {
    hapticEngine.tap();
    onUpdateSettings({ ...settings, theme: themeId });
  };

  return (
    <div className="settings-container">
      {/* Top Sub-Tabs Navigation */}
      <div className="settings-subtabs-nav">
        {[
          { id: 'timings', label: 'المواقيت والحساب', icon: Clock },
          { id: 'audio', label: 'الأذان والأصوات', icon: Volume2 },
          { id: 'widgets', label: 'الودجت والإشعارات', icon: Smartphone },
          { id: 'location', label: 'الموقع والجغرافيا', icon: MapPin },
          { id: 'themes', label: 'المظهر والسمات', icon: Palette }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`settings-subtab-chip ${isActive ? 'active' : ''}`}
              onClick={() => handleSubTabChange(tab.id)}
            >
              <IconComp size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content Views */}
      {activeSubTab === 'timings' && (
        <TimingSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {activeSubTab === 'audio' && (
        <AudioSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {activeSubTab === 'widgets' && (
        <WidgetSettings
          prayerState={prayerState}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {activeSubTab === 'location' && (
        <LocationSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {activeSubTab === 'themes' && (
        <div className="settings-tab-content">
          <div className="settings-section-card">
            <div className="settings-section-title">
              <Palette size={20} color="var(--emerald-light)" />
              <span>اختيار سمة ومظهر التطبيق</span>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              اختر المظهر المفضل لديك لتخصيص ألوان الواجهة، الخطوط، وتأثيرات الإضاءة الإسلامية.
            </p>

            <div className="themes-grid">
              {THEMES_LIST.map((th) => {
                const isSelected = (settings.theme || 'dark') === th.id;
                return (
                  <div
                    key={th.id}
                    className={`theme-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleThemeChange(th.id)}
                    style={{ background: th.previewBg }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: '700', color: th.isLight ? '#0f172a' : '#ffffff' }}>
                        {th.nameAr}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '0.72rem', background: th.accentColor, color: '#042f22', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                          المفعل
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.76rem', color: th.isLight ? '#475569' : '#94a3b8', margin: '6px 0', lineHeight: '1.4' }}>
                      {th.desc}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: th.accentColor, border: '1px solid rgba(255,255,255,0.2)' }} />
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: th.goldColor, border: '1px solid rgba(255,255,255,0.2)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time format & System options */}
          <div className="settings-section-card">
            <div className="settings-section-title">
              <Eye size={20} color="var(--gold-light)" />
              <span>تفضيلات العرض والنظام</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                صيغة الوقت في التطبيق
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`subtab-pill ${settings.timeFormat === '12h' ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ ...settings, timeFormat: '12h' })}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  ١٢ ساعة (ص/م)
                </button>
                <button
                  className={`subtab-pill ${settings.timeFormat === '24h' ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ ...settings, timeFormat: '24h' })}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  ٢٤ ساعة
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Vibrate size={16} color="var(--emerald-light)" />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  تفعيل الاهتزاز اللمسي (Haptics)
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticEnabled !== false}
                onChange={(e) => onUpdateSettings({ ...settings, hapticEnabled: e.target.checked })}
                style={{ accentColor: 'var(--emerald-primary)', width: '18px', height: '18px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
