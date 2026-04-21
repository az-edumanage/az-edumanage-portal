# Current Task: Phase 5 - Shared Primitive Migration Slice 02

## Objective
Migrate `appTable*` directives to DS table class ownership, validate parity on billing/design-system routes, and add DS showcase coverage for standardized badge/table primitives.

## Status
`Completed`

## Sub-Tasks
- [x] Migrate `appTable*` directive host classes to DS table classes (`src/app/shared/components/data-display/table/table.components.ts`) (`docs/ds-shared-primitive-migration-slice-02.md`).
- [x] Complete DS table class behavior with DS-owned row-divider styling (`src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-02.md`).
- [x] Add standardized primitive demo section (badge + table) in Design System showcase (`src/app/features/design-system/design-system-showcase/*`) (`docs/ds-shared-primitive-migration-slice-02.md`).
- [x] Validate `brand` parity on `owner-billing` + `design-system` (desktop/mobile) and update approved baselines (`docs/ds-shared-primitive-migration-slice-02.md`).

## Scope Guardrails
- Keep existing primitive selectors and directive APIs unchanged.
- Keep migration incremental and route-validated.
- Limit this slice to table/badge/showcase standardization only.

## Exit Criteria
- `appTable*` directives are DS-class owned.
- `design-system` page demonstrates standardized table and badge primitives.
- Focused `brand` parity checks pass for billing + showcase routes.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 03:
- Standardize shared `button` and `card` primitives to DS token classes (remove hardcoded utility bundles from component logic).
- Migrate representative call sites to normalized variant naming where needed.
- Validate parity on topbar + owner-billing + design-system routes.
