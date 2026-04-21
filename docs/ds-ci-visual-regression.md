# DS CI Visual Regression Integration

This document defines the implemented CI integration for Design System visual regression.

## Implemented Files
- `.github/workflows/visual-regression.yml`
- `playwright.visual.config.ts`
- `tests/visual/ds-visual.spec.ts`

## NPM Commands
- `npm run vr:test` -> run visual regression checks
- `npm run vr:update` -> update baseline snapshots (intentional changes only)
- `npm run vr:report` -> open Playwright HTML report
- `npm run vr:install` -> install Playwright Chromium dependency

## Matrix Coverage
- Theme modes: `brand`, `light`, `dark`
- Viewports: `desktop (1440x900)`, `mobile (390x844)`
- Routes: P0 set from [ds-critical-route-matrix.md](/home/hussein/Public/education-center-management/docs/ds-critical-route-matrix.md)

## Brand Theme in CI
- `brand` is currently mapped to the existing dark presentation plus `theme-brand` marker class.
- This keeps baseline parity until full DS token theming introduces distinct `.theme-brand` token scopes.

## CI Behavior
- Workflow triggers on PR changes affecting UI, visual tests, and workflow/config files.
- CI installs Chromium and runs `npm run vr:test`.
- Playwright report is uploaded as a CI artifact.

## Snapshot Governance
- Baseline updates are done only with explicit intent using `npm run vr:update`.
- Any unexpected `brand` diff blocks merge until approved.
- Use the artifact report for diff triage and route-level verification.
