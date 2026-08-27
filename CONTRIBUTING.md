# 🤝 دليل المساهمة في مشروع صلاتي وأذكاري | Contributing Guide

مرحباً بك وشكراً لاهتمامك بالمساهمة في تطبيق **صلاتي وأذكاري**! 🎉  
هذا المشروع مفتوح المصدر (Open Source) ويهدف لتقديم تطبيق إسلامي سريع، خفيف، بدون إعلانات، ويعمل بالكامل بدون إنترنت (100% Offline-First) على جميع أجهزة الأندرويد.

---

## 📋 جدول المحتويات (Table of Contents)
1. [قواعد السلوك والمبادئ الأساسية](#-المبادئ-الأساسية-للمشروع)
2. [إعداد بيئة التطوير (Development Setup)](#-إعداد-بيئة-التطوير-development-setup)
3. [دورة حياة المساهمة (Contribution Workflow)](#-دورة-حياة-المساهمة-contribution-workflow)
4. [معايير الكود والتصميم (Coding Standards)](#-معايير-الكود-والتصميم)
5. [أدوات التحقق والاختبار (Verification Tools)](#-أدوات-التحقق-والاختبار)
6. [صيغة رسائل الـ Commit والـ PR](#-صيغة-رسائل-الـ-commit-والـ-pr)

---

## 🌟 المبادئ الأساسية للمشروع

- **العمل 100% بدون إنترنت (Offline-First):** لا تعتمد أي ميزة على خوادم أو APIs خارجية. جميع الحسابات (المواقيت، القبلة، التقويم، الأذكار، الصوتيات) تتم محلياً داخل جهاز المستخدم.
- **الأمانة العلمية والدقة الشرعية:** أي نصوص أذكار أو أحاديث أو معادلات حسابية يجب أن تكون من مصادر شرعية وفلكية معتمدة وموثوقة بالتشكيل السليم.
- **الحفاظ على خفة الحجم والسرعة:** تجنب إضافة مكتبات خارجية كبيرة (npm packages) يمكن الاستغناء عنها بكود Vanilla بسيط.
- **التصميم المتجاوب (Responsive & RTL):** الواجهة عربية أصيلة تدعم الاتجاه من اليمين لليسار (RTL) وتتكيف تلقائياً مع مختلف شاشات الأندرويد (الهواتف الصغيرة، الكبيرة، والأجهزة اللوحية Tablets).

---

## 🛠️ إعداد بيئة التطوير (Development Setup)

### المتطلبات الأساسية (Prerequisites)
- **Node.js**: الإصدار 18 أو أحدث (يوصى بـ v20+).
- **npm**: الإصدار 9 أو أحدث.
- **Android Studio** (اختياري، لتجربة التطبيق كـ APK على المحاكي أو جهاز حقيقي).

### خطوات البدء:
```bash
# 1. عمل Fork للمستودع ثم استنساخه
git clone https://github.com/<YOUR_USERNAME>/Prayer-Azkar.git
cd Prayer-Azkar

# 2. تثبيت الحزم والمكتبات
npm install

# 3. تشغيل خادم التطوير المحلي
npm run dev
```

التطبيق سيعمل محلياً على: `http://localhost:3000`

---

## 🔄 دورة حياة المساهمة (Contribution Workflow)

1. **ابحث عن المشاكل المفتوحة أو أنشئ Issue جديدة:**
   - قبل البدء في كتابة كود ميزة كبيرة، يفضل فتح Issue لمناقشة الفكرة مع صاحب المشروع.
2. **أنشئ فرعاً جديداً (Branch):**
   ```bash
   git checkout -b feat/add-fasting-tracker
   # أو
   git checkout -b fix/tasbeeh-touch-debounce
   ```
3. **قم بإجراء التعديلات المطلوبة واختبارها محلياً.**
4. **تأكد من نجاح جميع أدوات الفحص والاختبار** (انظر القسم أدناه).
5. **قم بعمل Commit و Push:**
   ```bash
   git add .
   git commit -m "feat(athkar): add evening athkar audio support"
   git push origin feat/add-fasting-tracker
   ```
6. **افتح Pull Request (PR)** عبر GitHub واملأ القالب المخصص (`PR Template`).

---

## 🧪 أدوات التحقق والاختبار (Verification Tools)

يحتوي المشروع على 4 سكربتات فحص وتحقق آلية يجب تشغيلها والتأكد من نجاحها قبل إرسال أي PR:

```bash
# 1. التحقق من بناء حزمة الإنتاج بدون أخطاء
npm run build

# 2. فحص والتحقق من حسابات المواقيت الـ 12 والأذكار والسبحة
node .agents/skills/islamic-data-verifier/scripts/verify-calculations.mjs

# 3. فحص حسابات القبلة وحساسات البوصلة و Service Worker
node .agents/skills/mobile-sensors-testing/scripts/simulate-sensors.mjs

# 4. فحص اتساق الخطوط العربية و RTL وتوافق شاشات الأندرويد
node .agents/skills/rtl-arabic-ux-linter/scripts/lint-arabic-rtl.mjs

# 5. تدقيق أحجام ملفات الصوت للتأكد من عدم زيادة حجم التطبيق
node .agents/skills/audio-asset-optimizer/scripts/compress-audio.mjs
```

---

## 📐 معايير الكود والتصميم

- **React Components:** نستخدم React 19 الوظيفي (Functional Components + Hooks).
- **التصميم:** نستخدم **Vanilla CSS** مع متغيرات الألوان (CSS Custom Properties) المحددة في `src/index.css`.
- **الخطوط:** نستخدم خطوط جوجل العربية (`Amiri`, `Noto Naskh Arabic`, `Outfit`).
- **الأيقونات:** نستخدم مكتبة `lucide-react`.

---

## 🏷️ صيغة رسائل الـ Commit (Conventional Commits)

يرجى الالتزام بالصيغ الموحدة لرسائل الـ Git Commit:

- `feat(...)`: ميزة جديدة (e.g., `feat(compass): add smooth sensor rotation`)
- `fix(...)`: إصلاح مشكلة (e.g., `fix(prayer): fix isha calculation for high latitudes`)
- `docs(...)`: توثيق (e.g., `docs(readme): add installation guide`)
- `style(...)`: تحسينات تنسيق أو RTL (e.g., `style(tablet): adjust padding for 10-inch screens`)
- `refactor(...)`: إعادة تنظيم الكود دون تغيير السلوك الخارجي
- `perf(...)`: تحسين سرعة أو استهلاك الذاكرة أو حجم الصوتيات

---

## ❓ بحاجة لمساعدة؟
إذا واجهتك أي صعوبة في الإعداد أو لديك استفسار، لا تتردد في فتح [Discussion](https://github.com/Mohamed-Mohamed-Hozien/Prayer-Azkar/discussions) أو التواصل عبر الـ Issues. جزاكم الله خيراً على مساهمتكم!
