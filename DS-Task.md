# Design System Task Tracker

Status legend:
- `Not Started`
- `In Progress`
- `Blocked`
- `Done`

## Epic 0: Architecture Alignment
- [x] `Done` Switch project build mode from SSR to CSR (`angular.json` CSR-only build options, remove SSR serve script) (`docs/architecture-csr-migration.md`).

## Epic 1: Safety Net & Baseline
- [x] `Done` Create page inventory for Owner/Tenant/Teacher critical flows.
- [x] `Done` Define visual snapshot matrix (light/dark + key breakpoints).
- [x] `Done` Create baseline execution strategy for `brand`/light/dark + desktop/mobile matrix (`docs/ds-baseline-capture-strategy.md`).
- [x] `Done` Add visual regression job to CI pipeline (`.github/workflows/visual-regression.yml`, `playwright.visual.config.ts`, `tests/visual/ds-visual.spec.ts`).
- [ ] `Not Started` Add manual smoke checklist for DS-sensitive interactions.
- [x] `Done` Add acceptance thresholds and diff approval policy (`docs/ds-baseline-capture-strategy.md`).
- [x] `Done` Expand P0 route matrix to include migrated owner analytics/detail routes for brand snapshot coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include owner subscription details for migrated inline-style visual coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).

## Epic 2: Token Foundation
- [x] `Done` Create `src/styles/tokens` directory structure.
- [x] `Done` Create reference token files (color, type, spacing, radius, shadow, motion).
- [x] `Done` Create semantic token files (text, surface, border, state, action).
- [x] `Done` Create component token files (button, input, card, table, badge).
- [x] `Done` Add backward-compatible aliases for existing variables.
- [x] `Done` Wire token imports into `src/styles.css`.
- [x] `Done` Add `brand` token map that preserves current visual values as migration baseline.
- [x] `Done` Execute Batch 01 scaffolding and document implementation (`docs/ds-token-foundation-batch-01.md`).

## Epic 3: Theme System
- [x] `Done` Introduce `.theme-light` and `.theme-dark` token scopes.
- [x] `Done` Introduce `.theme-brand` as default parity theme for existing UI.
- [x] `Done` Ensure root theme class application is centralized at app startup (`src/app/app.ts`, `src/app/core/services/dashboard.service.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).
- [x] `Done` Verify localStorage/theme persistence remains unchanged for toggle flow (`tests/visual/theme-toggle-regression.spec.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).
- [x] `Done` Add future-ready hook for additional tenant brand themes (class namespace + token override entrypoint + runtime orchestration) (`src/app/core/services/dashboard.service.ts`, `src/styles/tokens/theme.tenant-overrides.css`) (`docs/ds-theme-system-hardening-slice-02.md`).
- [x] `Done` Add core shell regression checks for theme toggling semantics across owner/tenant/teacher with `theme-brand` + light/dark classes (`tests/visual/theme-toggle-regression.spec.ts`) (`docs/ds-theme-system-hardening-slice-01.md`).
- [x] `Done` Define tenant theme override contract and fallback rules (`docs/ds-tenant-theme-contract.md`) (`docs/ds-theme-system-hardening-slice-02.md`).
- [x] `Done` Add non-default tenant theme smoke checks without affecting `brand` parity (`tests/visual/tenant-theme-smoke.spec.ts`) (`docs/ds-theme-system-hardening-slice-02.md`).

## Epic 4: Tailwind & Material Alignment
- [x] `Done` Map Tailwind token consumption to semantic CSS variables via parity-safe bridge (`src/styles/tokens/tailwind.semantic-bridge.css`) (`docs/ds-tailwind-material-alignment-slice-01.md`).
- [x] `Done` Ensure existing utility classes remain visually identical through compatibility aliases and representative `brand` regression checks (`docs/ds-tailwind-material-alignment-slice-01.md`).
- [x] `Done` Configure Angular Material semantic token bridge to DS variables (`src/styles/tokens/material.semantic-bridge.css`) (`docs/ds-tailwind-material-alignment-slice-02.md`).
- [x] `Done` Validate Material + Tailwind parity in representative shared screens under `brand` (`owner-overview`, `tenant-rooms`, `teacher-media`) (`docs/ds-tailwind-material-alignment-slice-02.md`).

## Epic 5: Shared Primitive Migration
- [x] `Done` Audit and classify reusable UI candidates with usage counts and migration target ranking (`docs/shared-ui-candidate-matrix.md`, `docs/ds-shared-primitive-migration-slice-01.md`).
- [x] `Done` Execute low-risk shared primitive token adoption pilot (`app-pager-button` -> `ds-pager-button`) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Standardize button primitive variants with DS class ownership and normalized `danger` mapping (`src/app/shared/components/ui/button/button.component.ts`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-03.md`).
- [x] `Done` Standardize card primitive variants with DS class ownership (`src/app/shared/components/ui/card/card.component.html`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-03.md`).
- [x] `Done` Standardize input/select/form control primitives with DS directives (`appInput`, `appSelect`) and token classes (`src/app/shared/components/form/form-controls.components.ts`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-04.md`).
- [x] `Done` Standardize checkbox/radio/toggle control primitives with DS directives (`appCheckbox`, `appRadio`, `appToggleInput`, `appToggleTrack`) and token classes (`src/app/shared/components/form/form-controls.components.ts`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-05.md`).
- [x] `Done` Standardize table + badge + pager primitives (`src/app/shared/components/data-display/table/table.components.ts`, `src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-02.md`).
- [x] `Done` Update DS showcase with migrated primitives (badge/table/button/card/form/checkable examples) (`src/app/features/design-system/design-system-showcase/*`) (`docs/ds-shared-primitive-migration-slice-02.md`, `docs/ds-shared-primitive-migration-slice-03.md`, `docs/ds-shared-primitive-migration-slice-04.md`, `docs/ds-shared-primitive-migration-slice-05.md`).
- [x] `Done` Start shared primitive standardization with `badge` variant normalization (`info`) and remove one-off badge style override in billing invoice table (`docs/ds-shared-primitive-migration-slice-01.md`).
- [x] `Done` Adopt DS table classes for `appTable*` directives and preserve parity on billing/design-system routes (`docs/ds-shared-primitive-migration-slice-02.md`).
- [x] `Done` Update DS showcase with standardized `badge` + `table` primitive demos (`docs/ds-shared-primitive-migration-slice-02.md`).
- [x] `Done` Execute Slice 03 button/card primitive migration and validate parity on owner-overview/owner-billing/design-system (`docs/ds-shared-primitive-migration-slice-03.md`).
- [x] `Done` Execute Slice 04 form primitive migration (`input/select`) and validate parity on owner-billing/design-system (`docs/ds-shared-primitive-migration-slice-04.md`).
- [x] `Done` Execute Slice 05 checkable primitive migration (`checkbox/radio/toggle`) and validate parity on owner-compliance/design-system (`docs/ds-shared-primitive-migration-slice-05.md`).
- [x] `Done` Execute Slice 06 extended form primitive adoption on owner high-usage forms (`owner-plan-create`, `owner-provisioning-settings`) (`docs/ds-shared-primitive-migration-slice-06.md`).

## Epic 6: Feature-by-Feature Adoption
- [ ] `Not Started` Migrate Owner feature styles to semantic/component tokens.
- [ ] `Not Started` Migrate Tenant feature styles to semantic/component tokens.
- [ ] `Not Started` Migrate Teacher feature styles to semantic/component tokens.
- [x] `Done` Audit and inventory inline styles (`style=\"...\"`, `[style.*]`, `[ngStyle]`) by feature (`docs/ds-inline-style-inventory.md`).
- [x] `Done` Execute first P0 inline-style conversion to DS CSS-variable pattern (`owner-overview` regional progress bars) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Execute second P0 inline-style conversion to DS CSS-variable pattern (`owner-billing` revenue bars) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Execute third P0 inline-style conversion to DS CSS-variable pattern (`owner-usage-analytics` bars) (`docs/ds-token-adoption-slice-02.md`).
- [x] `Done` Execute fourth P0 static-width conversion to DS class utility pattern (`owner-tenant-details` bars) (`docs/ds-token-adoption-slice-02.md`).
- [x] `Done` Execute fifth P0 static-width conversion to DS class utility pattern (`owner-subscription-details` bars) (`docs/ds-token-adoption-slice-03.md`).
- [x] `Done` Execute P0 inline-style layering conversion (`owner-tenant-create` z-index) to component CSS + DS token (`docs/ds-token-adoption-slice-03.md`).
- [ ] `Not Started` Convert inline styles to separated component CSS/SCSS using DS tokens while preserving exact visuals.
- [x] `Done` Add and run first regression checkpoint under `brand` theme for adopted P0 route (`owner-overview`) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Add and run second regression checkpoint under `brand` theme for adopted P0 route (`owner-billing`) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Add and run third/fourth regression checkpoints under `brand` theme (`owner-analytics`, `owner-tenant-details`) (`docs/ds-token-adoption-slice-02.md`).
- [x] `Done` Add and run fifth/sixth regression checkpoints under `brand` theme (`owner-subscription-details`, `owner-tenants-create`) (`docs/ds-token-adoption-slice-03.md`).
- [x] `Done` Execute owner inline-dimension conversion (`owner-tenants-list` search input) to separated component CSS class (`docs/ds-token-adoption-slice-04.md`).
- [x] `Done` Execute tenant progress-width conversions to DS CSS-variable pattern (`tenant-room-details`, `tenant-group-details`, `tenant-group-attendance`) (`docs/ds-token-adoption-slice-04.md`).
- [x] `Done` Add and run seventh/eighth/ninth regression checkpoints under `brand` theme (`owner-tenants`, `tenant-groups-details`, `tenant-rooms`) (`docs/ds-token-adoption-slice-04.md`).
- [x] `Done` Execute tenant static-width conversion to DS utility pattern (`tenant-grade-details`) (`docs/ds-token-adoption-slice-05.md`).
- [x] `Done` Execute owner compliance progress conversion to DS CSS-variable pattern (`owner-compliance`) (`docs/ds-token-adoption-slice-05.md`).
- [x] `Done` Add and run tenth/eleventh regression checkpoints under `brand` theme (`owner-compliance`, `tenant-grade-details`) (`docs/ds-token-adoption-slice-05.md`).
- [x] `Done` Execute final Owner/Tenant inline-style sweep and confirm zero raw `style="..."` attributes remain (`docs/ds-token-adoption-slice-06.md`).
- [x] `Done` Expand migrated-route visual coverage to include `tenant-group-attendance` in automated snapshots (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`, `docs/ds-token-adoption-slice-06.md`).
- [x] `Done` Execute broader `brand` regression sweep for all migrated Owner/Tenant routes on desktop + mobile (`24 passed`) (`docs/ds-token-adoption-slice-06.md`).
- [x] `Done` Execute Slice 07 visual baseline coverage closure for DS form-adopted Owner routes (`owner-plan-create`, `owner-provisioning-settings`) with full theme/viewport snapshots (`docs/ds-shared-primitive-migration-slice-07.md`, `docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [ ] `Not Started` Remove duplicate one-off style patterns after replacement.

## Epic 7: Governance & Enforcement
- [ ] `Not Started` Add lint rule for disallowing raw hex values in feature styles.
- [ ] `Not Started` Add lint rule for disallowing token bypass where semantic token exists.
- [ ] `Not Started` Add DS contribution guide and naming rules.
- [ ] `Not Started` Add review template requiring DS checks for UI PRs.

## Epic 8: Stabilization & Cleanup
- [ ] `Not Started` Remove compatibility aliases no longer needed.
- [ ] `Not Started` Remove dead legacy CSS/utility paths.
- [ ] `Not Started` Final regression sweep across all critical routes.
- [ ] `Not Started` Mark DS v1 migration complete.
