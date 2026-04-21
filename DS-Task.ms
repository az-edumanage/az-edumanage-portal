# Design System Task Tracker

Status legend:
- `Not Started`
- `In Progress`
- `Blocked`
- `Done`

## Epic 1: Safety Net & Baseline
- [x] `Done` Create page inventory for Owner/Tenant/Teacher critical flows.
- [x] `Done` Define visual snapshot matrix (light/dark + key breakpoints).
- [x] `Done` Create baseline execution strategy for `brand`/light/dark + desktop/mobile matrix (`docs/ds-baseline-capture-strategy.md`).
- [x] `Done` Add visual regression job to CI pipeline (`.github/workflows/visual-regression.yml`, `playwright.visual.config.ts`, `tests/visual/ds-visual.spec.ts`).
- [ ] `Not Started` Add manual smoke checklist for DS-sensitive interactions.
- [x] `Done` Add acceptance thresholds and diff approval policy (`docs/ds-baseline-capture-strategy.md`).

## Epic 2: Token Foundation
- [ ] `Not Started` Create `src/styles/tokens` directory structure.
- [ ] `Not Started` Create reference token files (color, type, spacing, radius, shadow, motion).
- [ ] `Not Started` Create semantic token files (text, surface, border, state, action).
- [ ] `Not Started` Create component token files (button, input, card, table, badge).
- [ ] `Not Started` Add backward-compatible aliases for existing variables.
- [ ] `Not Started` Wire token imports into `src/styles.css`.
- [ ] `Not Started` Add `brand` token map that preserves current visual values as migration baseline.

## Epic 3: Theme System
- [ ] `Not Started` Introduce `.theme-light` and `.theme-dark` token scopes.
- [ ] `Not Started` Introduce `.theme-brand` as default parity theme for existing UI.
- [ ] `Not Started` Ensure root theme class application is centralized in shell.
- [ ] `Not Started` Verify localStorage/theme persistence remains unchanged.
- [ ] `Not Started` Add future-ready hook for additional tenant brand themes.
- [ ] `Not Started` Extend visual snapshots to run `brand` + `light` + `dark`.

## Epic 4: Tailwind & Material Alignment
- [ ] `Not Started` Map Tailwind token consumption to semantic CSS variables.
- [ ] `Not Started` Ensure existing utility classes remain visually identical.
- [ ] `Not Started` Configure Angular Material theming to use DS semantic tokens.
- [ ] `Not Started` Validate Material + Tailwind parity in shared screens.

## Epic 5: Shared Primitive Migration
- [ ] `Not Started` Audit and classify reusable UI candidates.
- [ ] `Not Started` Standardize button primitive variants.
- [ ] `Not Started` Standardize card primitive variants.
- [ ] `Not Started` Standardize input/select/form control primitives.
- [ ] `Not Started` Standardize table + badge + pager primitives.
- [ ] `Not Started` Update DS showcase with migrated primitives.

## Epic 6: Feature-by-Feature Adoption
- [ ] `Not Started` Migrate Owner feature styles to semantic/component tokens.
- [ ] `Not Started` Migrate Tenant feature styles to semantic/component tokens.
- [ ] `Not Started` Migrate Teacher feature styles to semantic/component tokens.
- [x] `Done` Audit and inventory inline styles (`style=\"...\"`, `[style.*]`, `[ngStyle]`) by feature (`docs/ds-inline-style-inventory.md`).
- [ ] `Not Started` Convert inline styles to separated component CSS/SCSS using DS tokens while preserving exact visuals.
- [ ] `Not Started` Add regression checkpoints for each inline-style conversion batch under `brand` theme.
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
