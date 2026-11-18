import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  Compass,
  Sparkles,
  BookMarked,
  Settings
} from 'lucide-react';
import { hapticEngine } from '../services/hapticEngine';

export const NAV_ITEMS = [
  { id: 'prayer', label: 'الصلاة', icon: Clock },
  { id: 'quran', label: 'المصحف', icon: BookMarked },
  { id: 'athkar', label: 'الأذكار', icon: Sparkles },
  { id: 'qibla', label: 'القبلة', icon: Compass },
  { id: 'settings', label: 'الإعدادات', icon: Settings }
];

export const BottomNav = ({ activeTab: propActiveTab, onTabChange }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromLocation = () => {
    const path = location.pathname;
    if (path.startsWith('/quran')) return 'quran';
    if (path.startsWith('/athkar')) return 'athkar';
    if (path.startsWith('/qibla')) return 'qibla';
    if (path.startsWith('/settings')) return 'settings';
    return 'prayer';
  };

  const activeTab = propActiveTab || getActiveTabFromLocation();

  const handleSelectTab = (tabId) => {
    hapticEngine.tap();
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      navigate('/' + tabId);
    }
  };

  return (
    <nav className="bottom-nav-bar" aria-label="التنقل الرئيسي">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleSelectTab(item.id)}
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
