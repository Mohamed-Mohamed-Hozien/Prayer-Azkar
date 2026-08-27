# 📱 Rule 03: Android Responsive UX, RTL, & Styling Standards

## 🎯 Purpose

Deliver a luxury Islamic aesthetic with flawless RTL alignment, fluid adaptability across all screen sizes (small phones, large phones, foldables, tablets), and lag-free Android touch interactions.

## 📌 Non-Negotiable Rules:

1. **Styling Paradigm**:
   - Use **Vanilla CSS** with design tokens defined in `src/index.css`.
   - Do NOT install or introduce TailwindCSS or bulky utility frameworks unless explicitly requested.

2. **RTL & Typography**:
   - Root `<html>` must maintain `lang="ar"` and `dir="rtl"`.
   - Use Google Fonts calligraphy stack (`Amiri`, `Noto Naskh Arabic`, `Scheherazade New`, `Outfit`).
   - Use logical CSS properties (`margin-inline-start`, `padding-inline-end`) where appropriate.

3. **Dynamic Responsive Layout**:
   - Use `clamp()`, `min()`, and `max()` for scalable font sizes and button dimensions.
   - On tablets (`@media (min-width: 640px/768px)`), utilize multi-column responsive grids (`repeat(auto-fill, minmax(..., 1fr))`) for cards, presets, and settings.
   - Support safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) to prevent notch and gesture pill collisions.

4. **Android Native Touch Performance**:
   - Apply `touch-action: manipulation` on all tap buttons to eliminate the 300ms mobile tap delay.
   - Trigger `hapticEngine.tap()` on interactive actions.

5. **Verification Step**:
   - Run the RTL linter:
     ```bash
     node .agents/skills/rtl-arabic-ux-linter/scripts/lint-arabic-rtl.mjs
     ```
