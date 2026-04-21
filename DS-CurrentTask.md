# Current Task: Phase 5 - Shared Primitive Migration Slice 04

## Objective
Standardize shared form primitives (`input`, `select`) to DS token classes/directives and validate parity on representative routes.

## Status
`Completed`

## Sub-Tasks
- [x] Add shared form directives (`appInput`, `appSelect`) with standalone exports (`src/app/shared/components/form/form-controls.components.ts`, `src/app/shared/components/form/index.ts`) (`docs/ds-shared-primitive-migration-slice-04.md`).
- [x] Add DS-owned `ds-input` / `ds-select` token classes for form control base styling and focus behavior (`src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-04.md`).
- [x] Migrate representative usage in `owner-billing` filter panel to `appInput`/`appSelect` while preserving layout classes (`src/app/features/owner/components/owner-billing-filter-panel/*`) (`docs/ds-shared-primitive-migration-slice-04.md`).
- [x] Update design-system showcase form controls to use standardized directives (`src/app/features/design-system/design-system-showcase/*`) (`docs/ds-shared-primitive-migration-slice-04.md`).
- [x] Validate `brand` parity on `owner-billing` + `design-system` (desktop/mobile) (`4 passed`) and confirm `npm run build` pass (`docs/ds-shared-primitive-migration-slice-04.md`).

## Scope Guardrails
- Keep existing primitive selectors and directive APIs unchanged.
- Keep migration incremental and route-validated.
- Limit this slice to `input` + `select` primitives and representative-route adoption only.

## Exit Criteria
- `appInput` and `appSelect` directives exist and are reusable.
- `design-system` page demonstrates standardized form-control primitives.
- Focused `brand` parity checks pass for billing + showcase routes.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 05:
- Standardize checkable controls (`checkbox`, `radio`, toggle wrapper patterns) with DS directives/classes.
- Adopt in one representative route with high control density.
- Validate `brand` parity on selected route set (desktop/mobile) before broader rollout.
