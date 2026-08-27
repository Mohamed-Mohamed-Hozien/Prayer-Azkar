---
name: rtl-arabic-ux-linter
description: Lint and audit Arabic typography, RTL layout consistency, Tashkeel rendering, and mobile safe-area notch clearances across CSS and JSX files.
---

# Arabic RTL & Typography Quality Linter Skill

This skill scans codebase stylesheets and components to detect RTL layout regressions, hardcoded physical directions (`left:` / `right:` vs logical `margin-inline`), Tashkeel diacritics clipping, and notch safe-area padding.

## 🎯 Capabilities
1. **RTL Direction Consistency**: Ensures `dir="rtl"` is configured and flags directional CSS conflicts.
2. **Safe-Area Top & Bottom Clearance**: Validates that all container views respect notch and status bar heights (`--safe-top`, `--safe-bottom`).
3. **Arabic Calligraphy Font Stack Verification**: Checks that fonts like `Amiri`, `Scheherazade New`, and `Noto Naskh Arabic` are declared with proper fallback chains.
4. **Touch Target Size Compliance**: Ensures interactive touch targets (Tasbeeh bead, category pills, muadhin preview buttons) meet mobile ergonomics (minimum 44×44px).

## 🚀 Execution

Run the RTL and typography linter script:

```bash
node .agents/skills/rtl-arabic-ux-linter/scripts/lint-arabic-rtl.mjs
```
