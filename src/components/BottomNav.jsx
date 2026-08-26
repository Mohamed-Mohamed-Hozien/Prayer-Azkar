import React from 'react';
import {
  Clock,
  Compass,
  BookOpen,
  Settings
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'prayer', label: 'الصلاة', icon: Clock },
  { id: 'qibla', label: 'القبلة', icon: Compass },
  { id: 'athkar', label: 'الأذكار والسبحة', icon: BookOpen },
  { id: 'settings', label: 'الإعدادات والودجت', icon: Settings }
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
              <IconComponent size={22} strokeWidth={isActive ? 2.3 : 1.8} />
              {isActive && <div className="nav-active-glow" />}
            </div>
            <span className="nav-label-text">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
