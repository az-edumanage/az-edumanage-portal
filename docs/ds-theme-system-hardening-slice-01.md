# DS Theme System Hardening - Slice 01

Date: 2026-04-21  
Status: Completed

## Goal
Centralize root theme class application, preserve theme persistence behavior, and add regression checks for theme toggling on core shell routes.

## Implemented Changes
- Centralized theme initialization at app root:
  - `src/app/app.ts` now initializes theme on app startup.
  - Removed layout-level theme init from `src/app/core/layout/main-layout/main-layout.component.ts`.
- Hardened root class application logic in `DashboardService`:
  - Keeps `theme-brand` present as parity baseline.
  - Applies `theme-dark`/`theme-light` and Tailwind `dark` class from current theme.
  - Sets `document.documentElement.style.colorScheme` to match current theme.
- Added regression test for theme toggling on core shell routes:
  - `tests/visual/theme-toggle-regression.spec.ts`
  - Verifies class and `localStorage` behavior for owner/tenant/teacher routes.
- Updated visual test theme helper to mirror runtime class semantics:
  - `tests/visual/ds-visual.spec.ts` `applyTheme()` now sets `theme-brand` with `theme-light`/`theme-dark` consistently.

## Validation
- Build:
  - `npm run build` ✅
- Theme regression checks:
  - `npm run vr:test -- --grep "Theme Toggle Regression"` ✅ (`3 passed`)

## Notes
- Direct `ng test` execution is currently blocked in this environment by Vitest browser-mode package requirements (`@vitest/browser-*` adapters not installed).  
  Validation for this slice was performed via build + Playwright regression.
