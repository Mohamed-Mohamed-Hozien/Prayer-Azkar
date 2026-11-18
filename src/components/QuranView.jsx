import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  Calendar,
  CheckCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Share2,
  Copy,
  Clock,
  RotateCcw,
  Sliders,
  Award,
  BookMarked
} from 'lucide-react';
import { SURAHS_METADATA, JUZ_NAMES, KHATMAH_GOALS } from '../data/quranMetadata';
import { hapticEngine } from '../services/hapticEngine';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  KHATMAH_PLAN: 'prayer_khatmah_plan_v1',
  BOOKMARKS: 'prayer_quran_bookmarks_v1'
};

const DEFAULT_PLAN = {
  goalId: 'month',
  currentPage: 1,
  startPage: 1,
  startDate: new Date().toISOString(),
  targetDays: 30,
  dailyCompletedPages: 0,
  lastReadDate: new Date().toDateString()
};

export const QuranView = () => {
  const [activeSubTab, setActiveSubTab] = useState('index'); // 'index' | 'khatmah' | 'bookmarks'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'meccan' | 'medinan'
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [khatmahPlan, setKhatmahPlan] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.KHATMAH_PLAN);
      return raw ? { ...DEFAULT_PLAN, ...JSON.parse(raw) } : DEFAULT_PLAN;
    } catch (e) {
      return DEFAULT_PLAN;
    }
  });
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return raw ? JSON.parse(raw) : [
        { id: 'surah-18', surahId: 18, nameAr: 'سُورَةُ الكَهْفِ', page: 293, date: 'سُنَّةُ يَوْمِ الجُمُعَةِ' }
      ];
    } catch (e) {
      return [];
    }
  });
  const [copiedNotification, setCopiedNotification] = useState('');

  // Persist Khatmah plan
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KHATMAH_PLAN, JSON.stringify(khatmahPlan));
    } catch (e) {}
  }, [khatmahPlan]);

  // Persist Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {}
  }, [bookmarks]);

  const filteredSurahs = SURAHS_METADATA.filter((surah) => {
    const matchesSearch =
      surah.nameAr.includes(searchQuery.trim()) ||
      surah.nameEn.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      String(surah.id) === searchQuery.trim() ||
      String(surah.page) === searchQuery.trim();

    if (!matchesSearch) return false;
    if (filterType === 'meccan') return surah.type === 'meccan';
    if (filterType === 'medinan') return surah.type === 'medinan';
    return true;
  });

  const handlePageChange = (delta) => {
    hapticEngine.tap();
    const newPage = Math.max(1, Math.min(604, khatmahPlan.currentPage + delta));
    setKhatmahPlan((prev) => ({
      ...prev,
      currentPage: newPage,
      lastReadDate: new Date().toDateString()
    }));

    if (newPage === 604) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#38bdf8', '#fbbf24']
        });
      } catch (e) {}
    }
  };

  const handleSetGoal = (goal) => {
    hapticEngine.tap();
    const days = goal.id === 'month' ? 30 : goal.id === 'two_months' ? 60 : goal.id === 'three_months' ? 90 : goal.id === 'ramadan' ? 15 : 0;
    setKhatmahPlan((prev) => ({
      ...prev,
      goalId: goal.id,
      targetDays: days
    }));
  };

  const handleAddBookmark = (surah) => {
    hapticEngine.tap();
    if (bookmarks.some((b) => b.surahId === surah.id)) return;
    const newBookmark = {
      id: `surah-${surah.id}`,
      surahId: surah.id,
      nameAr: `سُورَةُ ${surah.nameAr}`,
      page: surah.page,
      date: new Date().toLocaleDateString('ar-EG')
    };
    setBookmarks([newBookmark, ...bookmarks]);
    setCopiedNotification('تم حفظ العلامة المرجعية بنجاح');
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  const handleRemoveBookmark = (id) => {
    hapticEngine.tap();
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  // Khatmah calculations
  const totalPages = 604;
  const currentGoal = KHATMAH_GOALS.find((g) => g.id === khatmahPlan.goalId) || KHATMAH_GOALS[0];
  const progressPercent = Math.min(100, Math.round((khatmahPlan.currentPage / totalPages) * 100));
  const remainingPages = Math.max(0, totalPages - khatmahPlan.currentPage);

  return (
    <div className="quran-view-wrapper" style={{ padding: '16px 12px 90px 12px', minHeight: '100%' }}>
      {/* Top Quran Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold-light)' }}>
          <BookOpen size={24} />
          <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', fontFamily: 'Amiri, serif' }}>
            المُصْحَفُ الشَّرِيفُ وَالخَتَمَاتُ
          </h1>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          فهرس السور الـ ١١٤ • مجمع الملك فهد • مخطط الختمة اليومية
        </p>
      </div>

      {/* Floating Notification */}
      {copiedNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--emerald-deep, #064e3b)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '24px',
            fontSize: '0.82rem',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} color="#f59e0b" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Subtabs Navigation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          background: 'var(--card-bg)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}
      >
        <button
          onClick={() => {
            hapticEngine.tap();
            setActiveSubTab('index');
          }}
          style={{
            padding: '8px 4px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'index' ? 'var(--emerald-light)' : 'transparent',
            color: activeSubTab === 'index' ? '#042f22' : 'var(--text-primary)',
            fontWeight: '700',
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <BookOpen size={15} />
          <span>فهرس السور</span>
        </button>

        <button
          onClick={() => {
            hapticEngine.tap();
            setActiveSubTab('khatmah');
          }}
          style={{
            padding: '8px 4px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'khatmah' ? 'var(--emerald-light)' : 'transparent',
            color: activeSubTab === 'khatmah' ? '#042f22' : 'var(--text-primary)',
            fontWeight: '700',
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Calendar size={15} />
          <span>مخطط الختمة</span>
        </button>

        <button
          onClick={() => {
            hapticEngine.tap();
            setActiveSubTab('bookmarks');
          }}
          style={{
            padding: '8px 4px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'bookmarks' ? 'var(--emerald-light)' : 'transparent',
            color: activeSubTab === 'bookmarks' ? '#042f22' : 'var(--text-primary)',
            fontWeight: '700',
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Bookmark size={15} />
          <span>الفواصل ({bookmarks.length})</span>
        </button>
      </div>

      {/* ===================== TAB 1: SURAH INDEX ===================== */}
      {activeSubTab === 'index' && (
        <div>
          {/* Search Bar & Type Filter */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '8px 14px',
                marginBottom: '10px'
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="ابحث باسم السورة، رقمها، أو الصفحة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Chips: All, Meccan, Medinan */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: `الكل (${SURAHS_METADATA.length})` },
                { id: 'meccan', label: 'مكية (٨٦)' },
                { id: 'medinan', label: 'مدنية (٢٨)' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    hapticEngine.tap();
                    setFilterType(chip.id);
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: filterType === chip.id ? 'var(--gold-light)' : 'var(--card-bg)',
                    color: filterType === chip.id ? '#000' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: filterType === chip.id ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surahs Grid List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredSurahs.map((surah) => {
              const isBookmarked = bookmarks.some((b) => b.surahId === surah.id);

              return (
                <div
                  key={surah.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Surah Number Badge */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--emerald-deep, rgba(16, 185, 129, 0.15))',
                        color: 'var(--emerald-light, #10b981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.88rem',
                        flexShrink: 0
                      }}
                    >
                      {surah.id}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1.05rem',
                            fontWeight: '800',
                            fontFamily: 'Amiri, serif',
                            color: 'var(--text-primary)'
                          }}
                        >
                          سُورَةُ {surah.nameAr}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: surah.type === 'meccan' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: surah.type === 'meccan' ? '#f59e0b' : '#38bdf8',
                            fontWeight: '600'
                          }}
                        >
                          {surah.type === 'meccan' ? 'مكية' : 'مدنية'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span>{surah.versesCount} آيات</span>
                        <span>•</span>
                        <span>الصفحة {surah.page}</span>
                        <span>•</span>
                        <span>الجزء {surah.juz}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleAddBookmark(surah)}
                      title={isBookmarked ? 'محفوظة في الفواصل' : 'إضافة للفاصلة'}
                      style={{
                        background: isBookmarked ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                        border: 'none',
                        color: isBookmarked ? 'var(--gold-light)' : 'var(--text-muted)',
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Bookmark size={18} fill={isBookmarked ? 'var(--gold-light)' : 'none'} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: KHATMAH PLANNER ===================== */}
      {activeSubTab === 'khatmah' && (
        <div>
          {/* Main Khatmah Status Hero Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '18px 16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--gold-light)', marginBottom: '8px' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>متابعة ختمتك الحالية</span>
            </div>

            {/* Circular / Large Progress Display */}
            <div style={{ margin: '12px 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--emerald-light)', lineHeight: '1' }}>
                {progressPercent}%
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                تمت قراءة <bdi dir="ltr" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{khatmahPlan.currentPage}</bdi> من ٦٠٤ صفحة
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                margin: '12px 0'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--emerald-light), var(--gold-light))',
                  borderRadius: '8px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {/* Page Adjuster Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => handlePageChange(-4)}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                -٤ صفحات
              </button>
              <button
                onClick={() => handlePageChange(-1)}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                -١
              </button>

              <div
                style={{
                  background: 'var(--emerald-deep, rgba(16, 185, 129, 0.2))',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.96rem',
                  color: 'var(--emerald-light)'
                }}
              >
                ص {khatmahPlan.currentPage}
              </div>

              <button
                onClick={() => handlePageChange(1)}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                +١
              </button>
              <button
                onClick={() => handlePageChange(4)}
                style={{
                  background: 'var(--emerald-light)',
                  border: 'none',
                  color: '#042f22',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                +٤ صفحات (ورد صلاة)
              </button>
            </div>
          </div>

          {/* Goal Selector */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              🎯 اختر هدف الختمة المناسب لجدولك:
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {KHATMAH_GOALS.map((goal) => {
                const isSelected = khatmahPlan.goalId === goal.id;

                return (
                  <div
                    key={goal.id}
                    onClick={() => handleSetGoal(goal)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--card-bg)',
                      border: `1px solid ${isSelected ? 'var(--emerald-light)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem', color: isSelected ? 'var(--emerald-light)' : 'var(--text-primary)' }}>
                        {goal.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {goal.desc}
                      </div>
                    </div>

                    {isSelected && <CheckCircle size={18} color="var(--emerald-light)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: BOOKMARKS ===================== */}
      {activeSubTab === 'bookmarks' && (
        <div>
          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <BookMarked size={36} style={{ marginBottom: '8px', opacity: 0.6 }} />
              <p>لم تقم بإضافة فواصل قراءة بعد.</p>
              <p style={{ fontSize: '0.78rem' }}>اضغط على أيقونة الفاصلة في فهرس السور لحفظ مكانك المفضل.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bookmark size={20} color="var(--gold-light)" fill="var(--gold-light)" />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                        {bm.nameAr}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        الصفحة {bm.page} • أُضيفت: {bm.date}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveBookmark(bm.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: '6px',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
