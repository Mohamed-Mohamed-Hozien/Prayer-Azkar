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
  BookMarked,
  ArrowRight,
  Check,
  Type
} from 'lucide-react';
import { SURAHS_METADATA, JUZ_NAMES, KHATMAH_GOALS } from '../data/quranMetadata';
import { hapticEngine } from '../services/hapticEngine';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  KHATMAH_PLAN: 'prayer_khatmah_plan_v1',
  BOOKMARKS: 'prayer_quran_bookmarks_v1',
  QURAN_FONT_SIZE: 'prayer_quran_font_size_v1'
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

// Authentic Islamic Quran Ayah End Medallion with centered Eastern Arabic digits
const AyahEndSymbol = ({ number }) => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const arabicNumber = String(number).replace(/[0-9]/g, (d) => arabicDigits[d]);
  const len = arabicNumber.length;
  const fontSize = len === 1 ? '14' : len === 2 ? '11.5' : '9.5';

  return (
    <span
      className="ayah-end-symbol"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        margin: '0 5px',
        width: '1.45em',
        height: '1.45em',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0
      }}
      aria-label={`آية ${number}`}
    >
      <svg
        viewBox="0 0 40 40"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          color: 'var(--gold-light, #f59e0b)'
        }}
      >
        {/* Outer decorative ring */}
        <circle
          cx="20"
          cy="20"
          r="16.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.9"
        />
        {/* Inner subtle dotted accent ring */}
        <circle
          cx="20"
          cy="20"
          r="18.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray="1.5 2"
          opacity="0.6"
        />
        {/* 4 Cardinal Finials */}
        <path d="M20,1.5 L22.5,4.5 L20,7 L17.5,4.5 Z" fill="currentColor" />
        <path d="M20,38.5 L22.5,35.5 L20,33 L17.5,35.5 Z" fill="currentColor" />
        <path d="M1.5,20 L4.5,22.5 L7,20 L4.5,17.5 Z" fill="currentColor" />
        <path d="M38.5,20 L35.5,22.5 L33,20 L35.5,17.5 Z" fill="currentColor" />
        {/* 4 Corner Decorative Dots */}
        <circle cx="7" cy="7" r="1.1" fill="currentColor" opacity="0.8" />
        <circle cx="33" cy="7" r="1.1" fill="currentColor" opacity="0.8" />
        <circle cx="7" cy="33" r="1.1" fill="currentColor" opacity="0.8" />
        <circle cx="33" cy="33" r="1.1" fill="currentColor" opacity="0.8" />
        {/* Centered Arabic Ayah Number */}
        <text
          x="20"
          y="20.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize={fontSize}
          fontFamily="'Amiri', 'Noto Naskh Arabic', serif"
          fontWeight="bold"
        >
          {arabicNumber}
        </text>
      </svg>
    </span>
  );
};

export const QuranView = () => {
  const [activeSubTab, setActiveSubTab] = useState('index'); // 'index' | 'khatmah' | 'bookmarks'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'meccan' | 'medinan'
  const [selectedSurah, setSelectedSurah] = useState(null); // Surah object when reading
  const [surahAyahs, setSurahAyahs] = useState([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.QURAN_FONT_SIZE) || '22', 10);
    } catch (e) {
      return 22;
    }
  });

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

  // Persist Font Size
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QURAN_FONT_SIZE, String(fontSize));
    } catch (e) {}
  }, [fontSize]);

  // Load Surah Ayahs from local offline dataset when a Surah is selected
  useEffect(() => {
    if (!selectedSurah) return;

    let isMounted = true;
    setIsLoadingAyahs(true);

    fetch('/data/quran-uthmani.json')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const found = data.find((s) => s.number === selectedSurah.id);
        if (found && found.ayahs) {
          setSurahAyahs(found.ayahs);
        } else {
          setSurahAyahs([]);
        }
        setIsLoadingAyahs(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load local Quran ayahs:', err);
          setIsLoadingAyahs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurah]);

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
    const days =
      goal.id === 'month'
        ? 30
        : goal.id === 'two_months'
        ? 60
        : goal.id === 'three_months'
        ? 90
        : goal.id === 'ramadan'
        ? 15
        : 0;
    setKhatmahPlan((prev) => ({
      ...prev,
      goalId: goal.id,
      targetDays: days
    }));
  };

  // Toggle Bookmark: Adds if not bookmarked, Removes if already bookmarked
  const handleToggleBookmark = (surah, e) => {
    if (e) e.stopPropagation();
    hapticEngine.tap();

    const isBookmarked = bookmarks.some((b) => b.surahId === surah.id);
    if (isBookmarked) {
      setBookmarks(bookmarks.filter((b) => b.surahId !== surah.id));
      showToast('تمت إزالة السورة من الفواصل');
    } else {
      const newBookmark = {
        id: `surah-${surah.id}`,
        surahId: surah.id,
        nameAr: `سُورَةُ ${surah.nameAr}`,
        page: surah.page,
        date: new Date().toLocaleDateString('ar-EG')
      };
      setBookmarks([newBookmark, ...bookmarks]);
      showToast('تم حفظ السورة في الفواصل بنجاح');
    }
  };

  const showToast = (msg) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  const handleOpenSurah = (surah) => {
    hapticEngine.tap();
    setSelectedSurah(surah);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextSurah = () => {
    if (!selectedSurah || selectedSurah.id >= 114) return;
    const next = SURAHS_METADATA.find((s) => s.id === selectedSurah.id + 1);
    if (next) handleOpenSurah(next);
  };

  const handlePrevSurah = () => {
    if (!selectedSurah || selectedSurah.id <= 1) return;
    const prev = SURAHS_METADATA.find((s) => s.id === selectedSurah.id - 1);
    if (prev) handleOpenSurah(prev);
  };

  const handleCopyAyah = (ayah) => {
    hapticEngine.tap();
    const textToCopy = `${ayah.text} [${selectedSurah.nameAr}: ${ayah.numberInSurah}]`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`تم نسخ الآية (${ayah.numberInSurah}) بنجاح`);
      });
    }
  };

  // Khatmah calculations
  const totalPages = 604;
  const currentGoal = KHATMAH_GOALS.find((g) => g.id === khatmahPlan.goalId) || KHATMAH_GOALS[0];
  const progressPercent = Math.min(100, Math.round((khatmahPlan.currentPage / totalPages) * 100));

  return (
    <div className="quran-view-wrapper" style={{ padding: '16px 12px 90px 12px', minHeight: '100%' }}>
      {/* Floating Notification Toast */}
      {copiedNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--emerald-deep, #064e3b)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '24px',
            fontSize: '0.84rem',
            fontWeight: '600',
            boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={14} color="#f59e0b" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* ===================== MODE 1: SURAH READER ===================== */}
      {selectedSurah ? (
        <div className="surah-reader-container">
          {/* Reader Sticky Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '10px 14px',
              marginBottom: '16px',
              position: 'sticky',
              top: 'max(10px, var(--safe-top))',
              zIndex: 30,
              backdropFilter: 'blur(12px)'
            }}
          >
            <button
              onClick={() => {
                hapticEngine.tap();
                setSelectedSurah(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--border-emerald, #10b981)',
                color: 'var(--emerald-light, #10b981)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <ArrowRight size={16} />
              <span>الفهرس</span>
            </button>

            {/* Surah Title */}
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  fontFamily: 'Amiri, serif',
                  color: 'var(--gold-light)'
                }}
              >
                سُورَةُ {selectedSurah.nameAr}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {selectedSurah.type === 'meccan' ? 'مكية' : 'مدنية'} • {selectedSurah.versesCount} آيات • ص{' '}
                {selectedSurah.page}
              </span>
            </div>

            {/* Controls: Font Size & Bookmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => {
                  hapticEngine.tap();
                  setFontSize((prev) => (prev >= 32 ? 18 : prev + 2));
                }}
                title="تغيير حجم الخط"
                style={{
                  background: 'var(--border-color)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                A±
              </button>

              <button
                onClick={(e) => handleToggleBookmark(selectedSurah, e)}
                title={bookmarks.some((b) => b.surahId === selectedSurah.id) ? 'إزالة الفاصلة' : 'حفظ الفاصلة'}
                style={{
                  background: bookmarks.some((b) => b.surahId === selectedSurah.id)
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'transparent',
                  border: 'none',
                  color: bookmarks.some((b) => b.surahId === selectedSurah.id)
                    ? 'var(--gold-light)'
                    : 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Bookmark
                  size={20}
                  fill={bookmarks.some((b) => b.surahId === selectedSurah.id) ? 'var(--gold-light)' : 'none'}
                />
              </button>
            </div>
          </div>

          {/* Reader Content Box */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px 18px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)'
            }}
          >
            {/* Basmalah (Except Surah 9 At-Tawbah, and Surah 1 where it's ayah 1) */}
            {selectedSurah.id !== 9 && selectedSurah.id !== 1 && (
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px dashed var(--border-color)'
                }}
              >
                <span
                  style={{
                    fontSize: `${Math.round(fontSize * 1.15)}px`,
                    fontFamily: 'Amiri, serif',
                    color: 'var(--gold-light)',
                    display: 'inline-block'
                  }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoadingAyahs ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Sparkles size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
                <p>جاري تحميل آيات سورة {selectedSurah.nameAr} من الذاكرة المحلية...</p>
              </div>
            ) : surahAyahs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                تعذر تحميل آيات هذه السورة.
              </div>
            ) : (
              /* Ayahs Flow Layout with Authentic Uthmani Calligraphy */
              <div
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '2.5',
                  fontFamily: 'Amiri, "Noto Naskh Arabic", serif',
                  textAlign: 'justify',
                  direction: 'rtl',
                  color: 'var(--text-primary)'
                }}
              >
                {surahAyahs.map((ayah) => (
                  <span
                    key={ayah.numberInSurah}
                    onClick={() => handleCopyAyah(ayah)}
                    title="اضغط لنسخ الآية"
                    style={{
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      borderRadius: '4px',
                      padding: '2px 4px'
                    }}
                  >
                    <span>{ayah.text} </span>
                    <AyahEndSymbol number={ayah.numberInSurah} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Surah Navigation Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              gap: '12px'
            }}
          >
            {selectedSurah.id > 1 ? (
              <button
                onClick={handlePrevSurah}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ChevronRight size={16} />
                <span>السابقة: {SURAHS_METADATA.find((s) => s.id === selectedSurah.id - 1)?.nameAr}</span>
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            {selectedSurah.id < 114 ? (
              <button
                onClick={handleNextSurah}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'var(--emerald-light)',
                  border: 'none',
                  color: '#042f22',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>التالية: {SURAHS_METADATA.find((s) => s.id === selectedSurah.id + 1)?.nameAr}</span>
                <ChevronLeft size={16} />
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>
        </div>
      ) : (
        /* ===================== MODE 2: INDEX / KHATMAH / BOOKMARKS ===================== */
        <div>
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

          {/* Subtabs Navigation */}
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

          {/* ===================== SUBTAB 1: SURAH INDEX ===================== */}
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
                      onClick={() => handleOpenSurah(surah)}
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
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
                                background:
                                  surah.type === 'meccan' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                color: surah.type === 'meccan' ? '#f59e0b' : '#38bdf8',
                                fontWeight: '600'
                              }}
                            >
                              {surah.type === 'meccan' ? 'مكية' : 'مدنية'}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: '10px',
                              marginTop: '3px',
                              fontSize: '0.74rem',
                              color: 'var(--text-muted)'
                            }}
                          >
                            <span>{surah.versesCount} آيات</span>
                            <span>•</span>
                            <span>الصفحة {surah.page}</span>
                            <span>•</span>
                            <span>الجزء {surah.juz}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Bookmark Toggle Button */}
                        <button
                          onClick={(e) => handleToggleBookmark(surah, e)}
                          title={isBookmarked ? 'إزالة الفاصلة' : 'إضافة للفاصلة'}
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

          {/* ===================== SUBTAB 2: KHATMAH PLANNER ===================== */}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: 'var(--gold-light)',
                    marginBottom: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>متابعة ختمتك الحالية</span>
                </div>

                {/* Progress Display */}
                <div style={{ margin: '12px 0' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--emerald-light)', lineHeight: '1' }}>
                    {progressPercent}%
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    تمت قراءة{' '}
                    <bdi dir="ltr" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {khatmahPlan.currentPage}
                    </bdi>{' '}
                    من ٦٠٤ صفحة
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '16px',
                    flexWrap: 'wrap'
                  }}
                >
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
                          <div
                            style={{
                              fontWeight: '700',
                              fontSize: '0.92rem',
                              color: isSelected ? 'var(--emerald-light)' : 'var(--text-primary)'
                            }}
                          >
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

          {/* ===================== SUBTAB 3: BOOKMARKS ===================== */}
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
                  {bookmarks.map((bm) => {
                    const matchedSurah = SURAHS_METADATA.find((s) => s.id === bm.surahId);

                    return (
                      <div
                        key={bm.id}
                        onClick={() => matchedSurah && handleOpenSurah(matchedSurah)}
                        style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
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
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticEngine.tap();
                            setBookmarks(bookmarks.filter((b) => b.id !== bm.id));
                            showToast('تمت إزالة الفاصلة');
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: '600'
                          }}
                        >
                          إزالة
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
