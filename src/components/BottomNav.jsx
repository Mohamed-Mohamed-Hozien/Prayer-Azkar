import React from 'react';
import {
  Clock,
  Compass,
  Sparkles,
  BookMarked,
  Settings
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'prayer', label: 'الصلاة', icon: Clock },
  { id: 'quran', label: 'المصحف', icon: BookMarked },
  { id: 'athkar', label: 'الأذكار', icon: Sparkles },
  { id: 'qibla', label: 'القبلة', icon: Compass },
  { id: 'settings', label: 'الإعدادات', icon: Settings }
];

export const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-nav-bar" aria-label="التنقل الرئيسي">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="nav-icon-wrapper">
              <IconComponent size={21} strokeWidth={isActive ? 2.3 : 1.8} />
              {isActive && <div className="nav-active-glow" />}
            </div>
            <span className="nav-label-text">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
