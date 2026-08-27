## 📝 وصف التغييرات / Description of Changes

<!--
اذكر باختصار ما تم تغييره والهدف من هذا الـ PR.
Please provide a brief summary of the changes introduced by this PR and the problem it solves.
-->

### 🔗 المشكلة المرتبطة / Related Issue

Fixes #<!-- اكتب رقم الـ Issue هنا إن وجد / Issue number if applicable -->

---

## 🏷️ نوع التعديل / Type of Change

- [ ] 🐛 **إصلاح خطأ (Bug fix)** — تعديل يعالج سلوكاً غير متوقع
- [ ] ✨ **ميزة جديدة (New feature)** — إضافة إمكانية جديدة دون كسر التوافق
- [ ] 🕌 **تصحيح بيانات إسلامية (Islamic Data Correction)** — تصحيح نص ذكر أو حديث أو معادلة مواقيت
- [ ] 🎨 **تحسينات واجهة ومظهر (UI / Arabic RTL & Typography)** — تحسينات في التصميم وتوافق الشاشات
- [ ] ⚡ **أداء وتحسين موارد (Performance / Audio Optimization)** — تحسين سرعة أو تقليل حجم
- [ ] 📝 **توثيق (Documentation)** — تعديل أو إضافة في ملفات الشرح والتوثيق
- [ ] 🔧 **صيانة وإعدادات (Refactoring / Build / Tooling)**

---

## 🧪 قائمة التحقق قبل طلب المراجعة / Pre-Review Checklist

يرجى التأكد من استيفاء المعايير التالية قبل إرسال الـ PR:

- [ ] قمت باختبار الكود محلياً باستخدام `npm run dev` و `npm run build`.
- [ ] قمت بتشغيل اختبارات التحقق الآلية وجميعها نجحت (All Passed):
  - [ ] `node .agents/skills/islamic-data-verifier/scripts/verify-calculations.mjs`
  - [ ] `node .agents/skills/mobile-sensors-testing/scripts/simulate-sensors.mjs`
  - [ ] `node .agents/skills/rtl-arabic-ux-linter/scripts/lint-arabic-rtl.mjs`
  - [ ] `node .agents/skills/audio-asset-optimizer/scripts/compress-audio.mjs`
- [ ] في حال تعديل أي أذكار أو أحاديث، تم إرفاق التخريج والتشكيل الصحيح من مصادر موثوقة (صحيح البخاري، مسلم، رياض الصالحين، حصن المسلم).
- [ ] التصميم متوافق مع الاتجاه من اليمين لليسار (RTL) ويعمل بسلاسة على الموبايل والتابلت.
- [ ] لم يتم إدخال أي مكتبات خارجية ثقيلة غير ضرورية تؤثر على حجم الـ APK أو كفاءة العمل بدون إنترنت (Offline-first).

---

## 📸 لقطات الشاشة (قبل / بعد) — Screenshots (Before & After)

<!-- إن كان التعديل بصرياً، يرجى إرفاق صور للمقارنة على الموبايل أو التابلت -->

| قبل التعديل (Before)  |  بعد التعديل (After)  |
| :-------------------: | :-------------------: |
| <!-- أضف صورة هنا --> | <!-- أضف صورة هنا --> |
