import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Check,
  Type,
  Layers,
  FileText
} from 'lucide-react';
import { SURAHS_METADATA, JUZ_NAMES, KHATMAH_GOALS, getSurahByPage } from '../data/quranMetadata';
import { hapticEngine } from '../services/hapticEngine';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  KHATMAH_PLAN: 'prayer_khatmah_plan_v1',
  BOOKMARKS: 'prayer_quran_bookmarks_v1',
  QURAN_FONT_SIZE: 'prayer_quran_font_size_v1',
  READER_MODE: 'prayer_quran_reader_mode_v1'
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

// Helper to clean Tanzil Basmalah prefix from Ayah 1 of Surahs 2-114 if present
const cleanAyahText = (text, surahNumber, ayahNumber) => {
  if (!text) return '';
  if (Number(surahNumber) !== 1 && Number(ayahNumber) === 1) {
    return text.replace(/^[\uFEFF\u00A0\s]*بّ?ِ?سْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/u, '')
               .replace(/^[\uFEFF\u00A0\s]*بّ?ِ?سْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/u, '')
               .replace(/^[\uFEFF\u00A0\s]*بّ?ِ?سْمِ\s+اللهِ\s+الرَّحْمٰنِ\s+الرَّحِيمِ\s*/u, '');
  }
  return text;
};

// Helper to render an Ayah ensuring the end medallion NEVER wraps to a new line alone
const renderAyahContent = (ayah, surahNumber, onCopy) => {
  const cleanedText = cleanAyahText(ayah.text, surahNumber, ayah.numberInSurah);
  const trimmed = cleanedText.trim();
  const lastSpaceIdx = trimmed.lastIndexOf(' ');

  let mainText = '';
  let lastWord = trimmed;

  if (lastSpaceIdx !== -1) {
    mainText = trimmed.slice(0, lastSpaceIdx + 1);
    lastWord = trimmed.slice(lastSpaceIdx + 1);
  }

  return (
    <span
      key={ayah.numberInSurah}
      onClick={() => onCopy && onCopy(ayah)}
      title="اضغط لنسخ الآية"
      className="ayah-inline-segment"
      style={{
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderRadius: '4px',
        padding: '2px 2px'
      }}
    >
      {mainText && <span>{mainText}</span>}
      <span style={{ whiteSpace: 'nowrap', display: 'inline' }}>
        <span>{lastWord}</span>
        <span style={{ marginInlineStart: '6px', display: 'inline-flex', verticalAlign: 'middle' }}>
          <AyahEndSymbol number={ayah.numberInSurah} />
        </span>
      </span>
      {' '}
    </span>
  );
};

export const QuranView = () => {
  const { surahId } = useParams();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState('index'); // 'index' | 'khatmah' | 'bookmarks'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'meccan' | 'medinan'
  const [selectedSurah, setSelectedSurah] = useState(() => {
    if (surahId) {
      const parsed = parseInt(surahId, 10);
      return SURAHS_METADATA.find((s) => s.id === parsed) || null;
    }
    return null;
  });
  const [surahAyahs, setSurahAyahs] = useState([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);

  // Sync selectedSurah with route param /quran/:surahId
  useEffect(() => {
    if (surahId) {
      const parsed = parseInt(surahId, 10);
      const found = SURAHS_METADATA.find((s) => s.id === parsed);
      if (found) {
        setSelectedSurah(found);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setSelectedSurah(null);
    }
  }, [surahId]);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.QURAN_FONT_SIZE) || '22', 10);
    } catch (e) {
      return 22;
    }
  });

  // Reader mode: 'pages' (صفحة صفحة) | 'continuous' (سرد مستمر)
  const [readerMode, setReaderMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.READER_MODE) || 'pages';
    } catch (e) {
      return 'pages';
    }
  });

  const [currentSurahPageIndex, setCurrentSurahPageIndex] = useState(0);

  // Group current surah ayahs into authentic Mushaf pages
  const surahPages = useMemo(() => {
    if (!surahAyahs || surahAyahs.length === 0) return [];
    const map = new Map();
    surahAyahs.forEach((ayah) => {
      const pageNum = ayah.page;
      if (!map.has(pageNum)) {
        map.set(pageNum, {
          pageNumber: pageNum,
          juz: ayah.juz,
          hizbQuarter: ayah.hizbQuarter,
          ayahs: []
        });
      }
      map.get(pageNum).ayahs.push(ayah);
    });
    return Array.from(map.values());
  }, [surahAyahs]);

  // Reset page index when surah changes
  useEffect(() => {
    setCurrentSurahPageIndex(0);
  }, [selectedSurah?.id]);

  // Persist Reader Mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.READER_MODE, readerMode);
    } catch (e) {}
  }, [readerMode]);

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
    navigate('/quran/' + surah.id);
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

  const handleNextPage = () => {
    hapticEngine.tap();
    if (currentSurahPageIndex < surahPages.length - 1) {
      setCurrentSurahPageIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleNextSurah();
    }
  };

  const handlePrevPage = () => {
    hapticEngine.tap();
    if (currentSurahPageIndex > 0) {
      setCurrentSurahPageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handlePrevSurah();
    }
  };

  const handleMarkPageInKhatmah = (pageNum) => {
    hapticEngine.azanAlert();
    setKhatmahPlan((prev) => ({
      ...prev,
      currentPage: pageNum,
      lastReadDate: new Date().toDateString()
    }));
    showToast(`تم تعيين صفحة (${pageNum}) كورد اليوم في الختمة`);
  };

  const handleCopyAyah = (ayah) => {
    hapticEngine.tap();
    const cleanText = cleanAyahText(ayah.text, selectedSurah.id, ayah.numberInSurah);
    const textToCopy = `${cleanText} [${selectedSurah.nameAr}: ${ayah.numberInSurah}]`;
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
              borderRadius: '12px',
              padding: '6px 12px',
              marginBottom: '10px',
              position: 'sticky',
              top: 'max(6px, var(--safe-top))',
              zIndex: 30,
              backdropFilter: 'blur(12px)'
            }}
          >
            <button
              onClick={() => {
                hapticEngine.tap();
                navigate('/quran');
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

            {/* Surah Title & Page / Verses Info */}
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
                {readerMode === 'pages' && surahPages.length > 0
                  ? `صفحة ${surahPages[currentSurahPageIndex]?.pageNumber || selectedSurah.page} من ٦٠٤ (${currentSurahPageIndex + 1} من ${surahPages.length})`
                  : `${selectedSurah.type === 'meccan' ? 'مكية' : 'مدنية'} • ${selectedSurah.versesCount} آيات • ص ${selectedSurah.page}`}
              </span>
            </div>

            {/* Controls: Mode Toggle, Font Size & Bookmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Reader Mode Toggle (Pages vs Continuous) */}
              <button
                onClick={() => {
                  hapticEngine.tap();
                  const newMode = readerMode === 'pages' ? 'continuous' : 'pages';
                  setReaderMode(newMode);
                  showToast(newMode === 'pages' ? 'تم التبديل لعرض المصحف (صفحة صفحة)' : 'تم التبديل لعرض السرد المستمر');
                }}
                title={readerMode === 'pages' ? 'التبديل إلى السرد المستمر' : 'التبديل إلى عرض المصحف بالصفحات'}
                style={{
                  background: readerMode === 'pages' ? 'rgba(16, 185, 129, 0.18)' : 'var(--border-color)',
                  border: readerMode === 'pages' ? '1px solid var(--border-emerald, #10b981)' : 'none',
                  color: readerMode === 'pages' ? 'var(--emerald-light, #10b981)' : 'var(--text-primary)',
                  padding: '6px 9px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {readerMode === 'pages' ? <BookOpen size={14} /> : <Layers size={14} />}
                <span>{readerMode === 'pages' ? 'صفحات' : 'سرد'}</span>
              </button>

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
                  padding: '6px 9px',
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
                  size={19}
                  fill={bookmarks.some((b) => b.surahId === selectedSurah.id) ? 'var(--gold-light)' : 'none'}
                />
              </button>
            </div>
          </div>

          {/* Reader Content Box (All-in-One Mushaf Page Frame) */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: readerMode === 'pages' ? '12px 14px' : '20px 16px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              position: 'relative',
              minHeight: readerMode === 'pages' ? 'calc(100dvh - var(--safe-top, 0px) - var(--safe-bottom, 0px) - 130px)' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
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
            ) : readerMode === 'pages' ? (
              /* ================== DISPLAY MODE A: PAGE-BY-PAGE (FULL SCREEN FIT) ================== */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Top Mushaf Header Margin */}
                  {surahPages[currentSurahPageIndex] && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '8px',
                        marginBottom: '10px',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '0.8rem',
                        color: 'var(--gold-light)',
                        fontFamily: 'Amiri, serif'
                      }}
                    >
                      <span>الجزء {surahPages[currentSurahPageIndex].juz}</span>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>سُورَةُ {selectedSurah.nameAr}</span>
                      <span>الحزب {Math.ceil(surahPages[currentSurahPageIndex].hizbQuarter / 4)}</span>
                    </div>
                  )}

                  {/* Basmalah (Only on Page 1 of the Surah, except At-Tawbah and Al-Fatihah) */}
                  {currentSurahPageIndex === 0 && selectedSurah.id !== 9 && selectedSurah.id !== 1 && (
                    <div
                      style={{
                        textAlign: 'center',
                        marginBottom: '10px',
                        paddingBottom: '8px',
                        borderBottom: '1px dashed var(--border-color)'
                      }}
                    >
                      <span
                        style={{
                          fontSize: `${Math.round(fontSize * 1.05)}px`,
                          fontFamily: 'Amiri, serif',
                          color: 'var(--gold-light)',
                          display: 'inline-block'
                        }}
                      >
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </span>
                    </div>
                  )}

                  {/* Ayahs of Current Mushaf Page */}
                  <div
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.95',
                      fontFamily: 'Amiri, "Noto Naskh Arabic", serif',
                      textAlign: 'justify',
                      direction: 'rtl',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {(surahPages[currentSurahPageIndex]?.ayahs || []).map((ayah) =>
                      renderAyahContent(ayah, selectedSurah.id, handleCopyAyah)
                    )}
                  </div>
                </div>

                {/* Integrated Bottom Mushaf Page Navigation Frame */}
                {surahPages[currentSurahPageIndex] && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                      color: 'var(--gold-light)',
                      gap: '8px'
                    }}
                  >
                    <button
                      onClick={handlePrevPage}
                      disabled={currentSurahPageIndex === 0 && selectedSurah.id === 1}
                      title="الصفحة السابقة"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: (currentSurahPageIndex === 0 && selectedSurah.id === 1) ? 'not-allowed' : 'pointer',
                        opacity: (currentSurahPageIndex === 0 && selectedSurah.id === 1) ? 0.35 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ChevronRight size={15} />
                      <span>السابقة</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        value={currentSurahPageIndex}
                        onChange={(e) => {
                          hapticEngine.tap();
                          setCurrentSurahPageIndex(parseInt(e.target.value, 10));
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid var(--border-emerald, #10b981)',
                          color: 'var(--emerald-light, #10b981)',
                          padding: '5px 8px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'Amiri, serif'
                        }}
                      >
                        {surahPages.map((p, idx) => (
                          <option key={p.pageNumber} value={idx} style={{ background: '#022c22', color: '#fff' }}>
                            — صـَفْحـَة {p.pageNumber} ({idx + 1} من {surahPages.length}) —
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleMarkPageInKhatmah(surahPages[currentSurahPageIndex].pageNumber)}
                        title="تحديد هذه الصفحة كورد اليوم في الختمة"
                        style={{
                          background: khatmahPlan.currentPage === surahPages[currentSurahPageIndex].pageNumber
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: khatmahPlan.currentPage === surahPages[currentSurahPageIndex].pageNumber
                            ? 'var(--emerald-light, #10b981)'
                            : 'var(--gold-light)',
                          cursor: 'pointer',
                          padding: '5px 7px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <CheckCircle size={15} />
                      </button>
                    </div>

                    <button
                      onClick={handleNextPage}
                      title="الصفحة التالية"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: 'var(--emerald-light, #10b981)',
                        border: 'none',
                        color: '#042f22',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>التالية</span>
                      <ChevronLeft size={15} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ================== DISPLAY MODE B: CONTINUOUS SCROLL WITH PAGE DIVIDERS ================== */
              <div>
                {/* Basmalah */}
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
                  {surahPages.map((pageData, pIdx) => (
                    <div key={pageData.pageNumber}>
                      {pIdx > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            margin: '32px 0 24px 0',
                            color: 'var(--gold-light)',
                            opacity: 0.85
                          }}
                        >
                          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                          <span
                            style={{
                              fontSize: '0.78rem',
                              padding: '4px 14px',
                              borderRadius: '16px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontFamily: 'Amiri, serif',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            نهاية ص {surahPages[pIdx - 1].pageNumber} • بداية ص {pageData.pageNumber} (جزء {pageData.juz})
                          </span>
                          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </div>
                      )}
                      {pageData.ayahs.map((ayah) =>
                        renderAyahContent(ayah, selectedSurah.id, handleCopyAyah)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continuous Mode Bottom Nav between Surahs (Only in Continuous Mode) */}
          {readerMode === 'continuous' && (
            /* Continuous Mode Bottom Nav between Surahs */
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
          )}
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

                {/* Direct Link to Read Khatmah Current Page in Mushaf */}
                <button
                  onClick={() => {
                    hapticEngine.tap();
                    const targetSurah = getSurahByPage(khatmahPlan.currentPage);
                    navigate(`/quran/${targetSurah.id}`);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '14px',
                    padding: '11px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--emerald-light), #059669)',
                    color: '#042f22',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <BookOpen size={17} />
                  <span>قراءة الورد (صفحة {khatmahPlan.currentPage}) في المصحف الآن</span>
                </button>
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
