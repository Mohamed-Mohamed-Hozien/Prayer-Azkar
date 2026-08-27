# 🔄 Rule 04: Git & Contributor Workflow Standards

## 🎯 Purpose

Maintain clean, atomic, and well-documented git commits, branch lifecycles, and Pull Request verifications.

## 📌 Non-Negotiable Rules

1. **Conventional Commits**:
   - Format: `<type>(<scope>): <short description>`
   - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.
   - Example: `feat(tasbeeh): add daily midnight reset and manual button`

2. **Pre-Commit Verification**:
   - Before committing or creating a PR, always run:

     ```bash
     npm run build
     node .agents/skills/islamic-data-verifier/scripts/verify-calculations.mjs
     node .agents/skills/mobile-sensors-testing/scripts/simulate-sensors.mjs
     node .agents/skills/rtl-arabic-ux-linter/scripts/lint-arabic-rtl.mjs
     ```

3. **Android Native Synchronization**:
   - Whenever web assets or configs change and are meant for release, sync with Capacitor:

     ```bash
     npx cap sync android
     ```

4. **Pull Request Protocol**:
   - Use `.github/PULL_REQUEST_TEMPLATE.md`.
   - Never force-push to `main`.
   - Use `Squash and merge` for merging feature PRs into `main`.
