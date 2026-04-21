# Current Task: Phase 5 - Shared Primitive Migration Slice 03

## Objective
Standardize shared `button` + `card` primitives to DS token classes, normalize variant naming parity, and validate representative route coverage.

## Status
`Completed`

## Sub-Tasks
- [x] Migrate `app-button` class composition from hardcoded utility bundles to DS-owned classes and normalize `danger`/`destructive` mapping (`src/app/shared/components/ui/button/button.component.ts`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-03.md`).
- [x] Migrate `app-card` wrapper to DS-owned class (`ds-card`) while preserving parity (`src/app/shared/components/ui/card/card.component.html`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-03.md`).
- [x] Extend Design System showcase standardized primitive section with `app-button` + `app-card` demos (`src/app/features/design-system/design-system-showcase/*`) (`docs/ds-shared-primitive-migration-slice-03.md`).
- [x] Validate `brand` parity on `owner-overview`, `owner-billing`, and `design-system` (desktop/mobile) (`6 passed`) and confirm `npm run build` pass (`docs/ds-shared-primitive-migration-slice-03.md`).

## Scope Guardrails
- Keep existing primitive selectors and directive APIs unchanged.
- Keep migration incremental and route-validated.
- Limit this slice to `button` + `card` primitive standardization and representative route validation only.

## Exit Criteria
- `app-button` and `app-card` are DS-class owned.
- `design-system` page demonstrates standardized button/card examples.
- Focused `brand` parity checks pass for overview + billing + showcase routes.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 04:
- Standardize form primitives (`input`, `select`, related control wrappers) to DS token classes.
- Start with one representative high-traffic route and DS showcase section updates.
- Validate `brand` parity on selected route set (desktop/mobile) before broad rollout.
