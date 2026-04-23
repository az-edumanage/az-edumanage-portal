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
- [x] `Done` Add manual smoke checklist for DS-sensitive interactions (`docs/manual-smoke-checklist.md`).
- [x] `Done` Add acceptance thresholds and diff approval policy (`docs/ds-baseline-capture-strategy.md`).
- [x] `Done` Expand P0 route matrix to include migrated owner analytics/detail routes for brand snapshot coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include owner subscription details for migrated inline-style visual coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include owner security route for migration parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include owner modules route for focused Slice 22 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include owner integrations route for focused Slice 23 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include tenant teachers route for focused Tenant Slice 01 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include tenant schedule route for focused Tenant Slice 02 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include tenant rooms-create route for focused Tenant Slice 03 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include tenant grades route for focused Tenant Slice 04 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include teacher schedule route for focused Teacher Slice 01 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Expand P0 route matrix to include teacher messages route for focused Teacher Slice 02 parity coverage (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).

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
- [x] `Done` Migrate Owner feature styles to semantic/component tokens (`docs/ds-feature-adoption-owner-closeout-01.md`).
- [x] `Done` Migrate Tenant feature styles to semantic/component tokens.
- [x] `Done` Migrate Teacher feature styles to semantic/component tokens.
- [x] `Done` Execute Owner Slice 01 one-off style extraction on high-usage provisioning settings page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-01.md`).
- [x] `Done` Execute Owner Slice 02 one-off style extraction on high-usage plan-create page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-02.md`).
- [x] `Done` Execute Owner Slice 03 one-off style extraction on high-usage tenants-list page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-03.md`).
- [x] `Done` Execute Owner Slice 04 one-off style extraction on high-usage tenant-create page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-04.md`).
- [x] `Done` Execute Owner Slice 05 one-off style extraction on high-usage tenant-details page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-05.md`).
- [x] `Done` Execute Owner Slice 06 one-off style extraction on high-usage tenant-edit page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-06.md`).
- [x] `Done` Execute Owner Slice 07 one-off style extraction on high-usage users-list page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-07.md`).
- [x] `Done` Execute Owner Slice 08 one-off style extraction on high-usage plans-list page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-08.md`).
- [x] `Done` Execute Owner Slice 09 one-off style extraction on high-usage billing page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-09.md`).
- [x] `Done` Execute Owner Slice 10 one-off style extraction on high-usage subscriptions-list page with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-10.md`).
- [x] `Done` Execute Owner Slice 11 one-off style extraction on high-usage subscriptions-orders route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-11.md`).
- [x] `Done` Execute Owner Slice 12 one-off style extraction on high-usage subscriptions-templates route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-12.md`).
- [x] `Done` Execute Owner Slice 13 one-off style extraction on high-usage subscriptions-template-details route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-13.md`).
- [x] `Done` Execute Owner Slice 14 one-off style extraction on high-usage subscription-details route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-14.md`).
- [x] `Done` Execute Owner Slice 15 one-off style extraction on high-usage subscription-create route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-15.md`).
- [x] `Done` Execute Owner Slice 16 one-off style extraction on high-usage owner-overview route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-16.md`).
- [x] `Done` Execute Owner Slice 17 one-off style extraction on high-usage owner-analytics route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-17.md`).
- [x] `Done` Execute Owner Slice 18 one-off style extraction on high-usage owner-compliance route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-18.md`).
- [x] `Done` Execute Owner Slice 19 one-off style extraction on high-usage owner-settings route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-19.md`).
- [x] `Done` Execute Owner Slice 20 one-off style extraction on high-usage owner-security route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-20.md`).
- [x] `Done` Execute Owner Slice 21 one-off style extraction on high-usage owner-notifications route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-21.md`).
- [x] `Done` Execute Owner Slice 22 one-off style extraction on high-usage owner-modules route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-22.md`).
- [x] `Done` Execute Owner Slice 23 one-off style extraction on high-usage owner-integrations route with focused visual re-baseline (`docs/ds-feature-adoption-owner-slice-23.md`).
- [x] `Done` Execute Tenant Slice 01 one-off style extraction on high-usage tenant-teachers route with focused visual re-baseline (`docs/ds-feature-adoption-tenant-slice-01.md`).
- [x] `Done` Execute Tenant Slice 02 one-off style extraction on high-usage tenant-schedule route with focused visual re-baseline (`docs/ds-feature-adoption-tenant-slice-02.md`).
- [x] `Done` Execute Tenant Slice 03 one-off style extraction on high-usage tenant-rooms-create route with focused visual re-baseline (`docs/ds-feature-adoption-tenant-slice-03.md`).
- [x] `Done` Execute Tenant Slice 04 one-off style extraction on high-usage tenant-grades route with focused visual re-baseline (`docs/ds-feature-adoption-tenant-slice-04.md`).
- [x] `Done` Execute Teacher Slice 01 one-off style extraction on high-usage teacher-schedule route (dashboard-backed) with focused visual re-baseline (`docs/ds-feature-adoption-teacher-slice-01.md`).
- [x] `Done` Execute Teacher Slice 02 parity adoption on high-usage teacher-messages route (dashboard-backed) with focused visual re-baseline (`docs/ds-feature-adoption-teacher-slice-02.md`).
- [x] `Done` Execute Teacher Slice 03 one-off style extraction on high-usage teacher-media route with focused visual re-baseline (`docs/ds-feature-adoption-teacher-slice-03.md`).
- [x] `Done` Execute Owner Closeout 02 safe extraction on `owner-module-details` with focused owner-modules parity validation (`docs/ds-feature-adoption-owner-closeout-02.md`).
- [x] `Done` Execute Owner Closeout 03 parity-safe micro extraction on `owner-settings` (icon utility replacement) with focused owner-settings parity validation (`docs/ds-feature-adoption-owner-closeout-03.md`).
- [x] `Done` Execute Owner Closeout 04 parity-safe micro extraction on `owner-settings` (non-layout text utility bundles) with focused owner-settings parity validation (`docs/ds-feature-adoption-owner-closeout-04.md`).
- [x] `Done` Execute Owner Closeout 05 parity-safe extraction on `owner-module-details` (muted-copy/meta-value utility bundles) with focused owner-modules parity validation (`docs/ds-feature-adoption-owner-closeout-05.md`).
- [x] `Done` Execute Owner Closeout 06 parity-safe extraction on `owner-settings` (section headings/subsection labels/helper note utility bundles) with focused owner-settings parity validation (`docs/ds-feature-adoption-owner-closeout-06.md`).
- [x] `Done` Audit and inventory inline styles (`style=\"...\"`, `[style.*]`, `[ngStyle]`) by feature (`docs/ds-inline-style-inventory.md`).
- [x] `Done` Execute first P0 inline-style conversion to DS CSS-variable pattern (`owner-overview` regional progress bars) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Execute second P0 inline-style conversion to DS CSS-variable pattern (`owner-billing` revenue bars) (`docs/ds-token-adoption-slice-01.md`).
- [x] `Done` Execute third P0 inline-style conversion to DS CSS-variable pattern (`owner-usage-analytics` bars) (`docs/ds-token-adoption-slice-02.md`).
- [x] `Done` Execute fourth P0 static-width conversion to DS class utility pattern (`owner-tenant-details` bars) (`docs/ds-token-adoption-slice-02.md`).
- [x] `Done` Execute fifth P0 static-width conversion to DS class utility pattern (`owner-subscription-details` bars) (`docs/ds-token-adoption-slice-03.md`).
- [x] `Done` Execute P0 inline-style layering conversion (`owner-tenant-create` z-index) to component CSS + DS token (`docs/ds-token-adoption-slice-03.md`).
- [x] `Done` Convert inline styles to separated component CSS/SCSS using DS tokens while preserving exact visuals (remaining dynamic `[style.--ds-*]` bindings are intentional DS variable channels, not raw inline styling).
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
- [x] `Done` Expand migrated-route visual coverage to include `owner-tenant-edit` in automated snapshots (`docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`, `docs/ds-feature-adoption-owner-slice-06.md`).
- [x] `Done` Execute broader `brand` regression sweep for all migrated Owner/Tenant routes on desktop + mobile (`24 passed`) (`docs/ds-token-adoption-slice-06.md`).
- [x] `Done` Execute Slice 07 visual baseline coverage closure for DS form-adopted Owner routes (`owner-plan-create`, `owner-provisioning-settings`) with full theme/viewport snapshots (`docs/ds-shared-primitive-migration-slice-07.md`, `docs/ds-critical-route-matrix.md`, `tests/visual/ds-visual.spec.ts`).
- [x] `Done` Remove duplicate one-off style patterns after replacement (`docs/ds-feature-adoption-cleanup-01.md`).

## Epic 7: Governance & Enforcement
- [x] `Done` Add lint rule for disallowing raw hex values in feature styles (`scripts/ds-style-guard.mjs`, `docs/ds-style-guard-baseline.json`, `package.json`).
- [x] `Done` Add lint rule for disallowing token bypass where semantic token exists (`scripts/ds-style-guard.mjs`, `docs/ds-style-guard-baseline.json`, `package.json`).
- [x] `Done` Add DS contribution guide and naming rules (`docs/ds-contribution-guide.md`).
- [x] `Done` Add review template requiring DS checks for UI PRs (`.github/pull_request_template.md`).

## Epic 8: Stabilization & Cleanup
- [x] `Done` Remove compatibility aliases no longer needed (unused `--space-10/12` and `--ds-brand-*` removals were reverted to preserve active backward-compat strategy; cleanup completed on unused Tailwind DS utility bridge aliases in `src/styles/tokens/tailwind.semantic-bridge.css`).
- [x] `Done` Remove dead legacy CSS/utility paths (unused DS utility bridge aliases removed from `src/styles/tokens/tailwind.semantic-bridge.css`).
- [x] `Done` Final regression sweep across all critical routes (`npm run vr:update` and `npm run vr:test`, full matrix `257 passed`).
- [x] `Done` Mark DS v1 migration complete (`docs/ds-v1-complete.md`).
