import React, { useState } from 'react';
import {
  Sun,
  Moon,
  HeartHandshake,
  Bed,
  Sparkles,
  BookmarkPlus,
  Layers,
  Maximize2,
  Plus,
  RotateCcw,
  BookOpen,
  Fingerprint
} from 'lucide-react';
import { ATHKAR_CATEGORIES, INITIAL_ATHKAR_DATA } from '../data/athkarData';
import { AthkarFocusMode } from './AthkarFocusMode';
import { AthkarListMode } from './AthkarListMode';
import { DigitalTasbeeh } from './DigitalTasbeeh';
import { CustomZikrModal } from './CustomZikrModal';
import { hapticEngine } from '../services/hapticEngine';

const CATEGORY_ICONS = {
  Sun: Sun,
  Moon: Moon,
  HeartHandshake: HeartHandshake,
  Bed: Bed,
  Sparkles: Sparkles,
  BookmarkPlus: BookmarkPlus
};

export const AthkarView = ({
  customAthkar,
  onSaveCustomZikr,
  athkarProgress,
  onUpdateAthkarProgress,
  onResetCategoryProgress
}) => {
  const [activeMainSection, setActiveMainSection] = useState('athkar'); // 'athkar' | 'tasbeeh'
  const [activeCategory, setActiveCategory] = useState('morning');
  const [viewMode, setViewMode] = useState('focus'); // 'focus' | 'list'
  const [focusIndex, setFocusIndex] = useState(0);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Combine initial database with custom added Athkar
  const currentList =
    activeCategory === 'custom'
      ? customAthkar
      : INITIAL_ATHKAR_DATA[activeCategory] || [];

  const handleSectionSwitch = (section) => {
    hapticEngine.tap();
    setActiveMainSection(section);
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setFocusIndex(0);
    hapticEngine.tap();
  };

  const handleUpdateCount = (itemId, count) => {
    onUpdateAthkarProgress(itemId, count);
  };

  const handleResetItem = (itemId) => {
    onUpdateAthkarProgress(itemId, 0);
  };

  const handleResetCategory = () => {
    onResetCategoryProgress(currentList.map((i) => i.id));
    setFocusIndex(0);
    hapticEngine.tap();
  };

  // Calculate category completion stats
  const completedCount = currentList.filter(
    (item) => (athkarProgress[item.id] || 0) >= (item.count || 1)
  ).length;

  return (
    <div className="athkar-view-wrapper">
      {/* Top Dual Section Switcher: [حصن المسلم والأذكار] vs [السبحة الإلكترونية] */}
      <div className="athkar-top-nav-switcher">
        <button
          className={`athkar-nav-pill ${activeMainSection === 'athkar' ? 'active' : ''}`}
          onClick={() => handleSectionSwitch('athkar')}
        >
          <BookOpen size={16} />
          <span>حصن المسلم والأذكار</span>
        </button>

        <button
          className={`athkar-nav-pill ${activeMainSection === 'tasbeeh' ? 'active' : ''}`}
          onClick={() => handleSectionSwitch('tasbeeh')}
        >
          <Fingerprint size={16} />
          <span>السبحة الإلكترونية الذكية</span>
        </button>
      </div>

      {/* 1. Digital Tasbeeh Mode */}
      {activeMainSection === 'tasbeeh' ? (
        <DigitalTasbeeh />
      ) : (
        /* 2. Daily Athkar Mode */
        <>
          {/* Top Categories Scrollable Strip */}
          <div className="athkar-header-nav">
            <div className="athkar-categories-scroll">
              {ATHKAR_CATEGORIES.map((cat) => {
                const IconComp = CATEGORY_ICONS[cat.icon] || Sparkles;
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    className={`category-chip ${isActive ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <IconComp size={16} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Mode Switcher & Actions Bar */}
          <div className="mode-switch-container">
            {/* Toggle between Focus Mode & List Mode */}
            <div className="mode-pill-toggle">
              <button
                className={`mode-toggle-btn ${viewMode === 'focus' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('focus');
                  hapticEngine.tap();
                }}
              >
                <Maximize2 size={13} />
                <span>وضع التركيز</span>
              </button>
              <button
                className={`mode-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('list');
                  hapticEngine.tap();
                }}
              >
                <Layers size={13} />
                <span>وضع القائمة</span>
              </button>
            </div>

            {/* Right side stats & action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentList.length > 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {completedCount}/{currentList.length} مكتمل
                </span>
              )}

              {activeCategory === 'custom' && (
                <button
                  className="banner-btn"
                  onClick={() => setIsCustomModalOpen(true)}
                  style={{ padding: '4px 10px', fontSize: '0.78rem', color: 'var(--emerald-light)', borderColor: 'var(--border-emerald)' }}
                >
                  <Plus size={14} />
                  <span>إضافة ذكر</span>
                </button>
              )}

              <button
                className="banner-btn"
                onClick={handleResetCategory}
                title="تصفير أذكار هذا القسم"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                <RotateCcw size={13} />
                <span>تصفير الكل</span>
              </button>
            </div>
          </div>

          {/* Athkar Content (Focus Mode vs List Mode) */}
          {viewMode === 'focus' ? (
            <AthkarFocusMode
              athkarList={currentList}
              currentIndex={focusIndex}
              onIndexChange={setFocusIndex}
              progressMap={athkarProgress}
              onUpdateCount={handleUpdateCount}
              onResetItem={handleResetItem}
            />
          ) : (
            <AthkarListMode
              athkarList={currentList}
              progressMap={athkarProgress}
              onUpdateCount={handleUpdateCount}
              onResetItem={handleResetItem}
            />
          )}

          {/* Custom Zikr Modal */}
          <CustomZikrModal
            isOpen={isCustomModalOpen}
            onClose={() => setIsCustomModalOpen(false)}
            onSaveCustomZikr={onSaveCustomZikr}
          />
        </>
      )}
    </div>
  );
};
