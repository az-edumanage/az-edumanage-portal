# Current Task: Phase 3 - Theme System Hardening Slice 01

## Objective
Centralize root theme class application, preserve theme persistence behavior, and add regression checks for theme toggling on core shell routes.

## Status
`Completed`

## Sub-Tasks
- [x] Move theme initialization to app startup (`src/app/app.ts`) and remove layout-level init (`src/app/core/layout/main-layout/main-layout.component.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).
- [x] Apply consistent root classes (`theme-brand`, `theme-light`/`theme-dark`, `dark`) from a single service path (`src/app/core/services/dashboard.service.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).
- [x] Add core shell theme-toggle regression checks for owner/tenant/teacher routes (`tests/visual/theme-toggle-regression.spec.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).
- [x] Align visual snapshot theme helper with runtime class semantics (`tests/visual/ds-visual.spec.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).

## Scope Guardrails
- Preserve `brand` visual parity.
- Keep theme persistence key and behavior backward-compatible.
- Keep changes limited to theme orchestration and verification.

## Exit Criteria
- Root theme classes are applied from one startup path.
- Theme toggle persists and applies expected classes on core shell routes.
- Regression checks pass for theme toggle behavior.

## Next Task (Active)
Phase 3 - Theme System Hardening Slice 02:
- Add future-ready hook for additional tenant brand themes (class namespace + token override entry points).
- Define and document tenant-theme override contract (allowed semantic/component tokens and fallback rules).
- Add initial non-default tenant theme smoke route/check without affecting `brand` parity.
