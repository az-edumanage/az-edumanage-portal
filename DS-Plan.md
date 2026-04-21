# Design System Migration Plan (Zero Regression)

## 1) Mission
Build an enterprise-grade Design System on top of the current Angular + Tailwind + Angular Material stack, while keeping all existing UI behavior, layout, and visual output stable during migration.

## 2) Core Goals
- Unify all styling decisions under a single token-driven system.
- Support scalable theming (light, dark, future brand themes) without per-feature CSS drift.
- Standardize reusable UI primitives and patterns.
- Enforce consistency with linting, review rules, and CI checks.
- Achieve migration with incremental, reversible, low-risk changes.

## 3) Non-Negotiable Safety Rules
- No intentional visual changes during architectural migration phases.
- No raw hardcoded color values in feature-level code once tokenized equivalents exist.
- No one-off spacing/typography overrides that bypass DS tokens.
- No breaking selector/class contracts used by existing pages unless migration compatibility is provided.
- Every DS change must pass visual regression and functional smoke checks.
- Keep each PR small and scoped (single domain: tokens, one primitive family, one feature slice, etc.).
- Use alias/backward-compatibility layers before deleting legacy style paths.

## 4) Technical Direction
- Token model:
  - Reference tokens: raw values (palette, spacing scale, font families, radii, shadows, motion).
  - Semantic tokens: meaning-based tokens (`--color-text-primary`, `--surface-default`, etc.).
  - Component tokens: per-component tokens (`--btn-primary-bg`, `--card-border`, etc.).
- Theme strategy:
  - Root theme classes (`.theme-light`, `.theme-dark`) at app shell level.
  - Semantic tokens resolve differently per theme scope.
- Framework integration:
  - Tailwind utilities should map to semantic tokens through CSS variable bindings.
  - Angular Material theme setup should consume the same semantic layer.

## 5) Architecture Rules
- Single source of truth: `src/styles/tokens/*`.
- Feature code consumes semantic/component tokens, not raw palette values.
- Shared UI primitives live under `src/app/shared/ui/*` and remain business-agnostic.
- Feature components can style layout, but must use DS tokens for visual properties.
- Token names must be stable, clear, and domain-neutral.
- DS documentation route remains available and updated with every primitive/token addition.

## 6) Migration Phases
1. Baseline + safety net
   - Capture visual baselines for critical pages/states.
   - Add CI checks for regression gates.
2. Token foundation
   - Extract current values into reference + semantic tokens without visual changes.
   - Add compatibility aliases for existing variables/classes.
3. Tailwind and Material alignment
   - Bind Tailwind and Angular Material to semantic token layer.
4. Primitive standardization
   - Migrate shared UI primitives first (button/card/form/table/badge/pager).
5. Feature adoption
   - Migrate feature-by-feature usage to DS primitives and semantic tokens.
6. Hardening
   - Enforce lint rules and remove dead legacy style paths once adoption is complete.

## 7) Definition of Done (Program Level)
- 100% critical views pass visual comparison in light/dark themes.
- Design tokens are centralized and documented.
- Angular Material + Tailwind styles are both driven by the DS token model.
- Shared primitives cover repeated UI patterns.
- Lint/CI prevents token bypass and style drift.
- Legacy style compatibility shims are removed only after full adoption.

## 8) PR Checklist (Mandatory)
- Scope is small and clearly isolated.
- No unintended visual delta in snapshots.
- Theme toggle behavior still works.
- Responsive behavior still works (mobile + desktop).
- No raw visual values introduced where token exists.
- Docs updated (`DS-Task.ms`, DS route docs, and relevant READMEs).
