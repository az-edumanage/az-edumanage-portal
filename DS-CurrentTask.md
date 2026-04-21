# Current Task: Phase 5 - Shared Primitive Migration Slice 05

## Objective
Standardize shared checkable primitives (`checkbox`, `radio`, toggle input/track) to DS token classes/directives and validate parity on representative routes.

## Status
`Completed`

## Sub-Tasks
- [x] Add shared checkable directives (`appCheckbox`, `appRadio`, `appToggleInput`, `appToggleTrack`) with standalone exports (`src/app/shared/components/form/form-controls.components.ts`, `src/app/shared/components/form/index.ts`) (`docs/ds-shared-primitive-migration-slice-05.md`).
- [x] Add DS-owned checkable token classes (`ds-checkbox`, `ds-radio`, `ds-toggle-input`, `ds-toggle-track`) with parity-safe focus/accent behavior (`src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-05.md`).
- [x] Migrate representative high-density route (`owner-compliance`) checkable controls to standardized directives (`src/app/features/owner/pages/owner-compliance/*`) (`docs/ds-shared-primitive-migration-slice-05.md`).
- [x] Update design-system showcase form controls with standardized checkable examples (`src/app/features/design-system/design-system-showcase/design-system-showcase.component.html`) (`docs/ds-shared-primitive-migration-slice-05.md`).
- [x] Validate `brand` parity on `owner-compliance` + `design-system` (desktop/mobile) (`4 passed`) and confirm `npm run build` pass (`docs/ds-shared-primitive-migration-slice-05.md`).

## Scope Guardrails
- Keep existing primitive selectors and directive APIs unchanged.
- Keep migration incremental and route-validated.
- Limit this slice to checkable primitives and representative-route adoption only.

## Exit Criteria
- `appCheckbox`, `appRadio`, and toggle directives exist and are reusable.
- `design-system` page demonstrates standardized checkable form primitives.
- Focused `brand` parity checks pass for compliance + showcase routes.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 06:
- Expand DS form primitive adoption (input/select/checkable) across additional high-usage forms (`owner-plan-create`, `owner-provisioning-settings`) incrementally.
- Replace repeated raw utility bundles with directives while preserving exact spacing/layout classes.
- Validate `brand` parity on selected route set (desktop/mobile) before broader rollout.
