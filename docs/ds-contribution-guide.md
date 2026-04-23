# Design System Contribution Guide

## Scope
This guide defines the required standards for any UI or style change in this repository.

## Required Principles
- Use semantic/component design tokens from `src/styles/tokens/*` as the source of truth.
- Avoid one-off visual values in feature styles when a DS token exists.
- Keep parity-safe migration behavior: no intentional visual drift without explicit approval.
- Keep route-level changes small and verifiable.

## Token Naming Rules
- Reference tokens:
  - Prefix: `--brand-*`, `--ds-space-*`, `--radius-*`, `--shadow-*`, `--motion-*`.
  - Purpose: raw scales/palette only.
- Semantic tokens:
  - Prefix: `--color-*` or `--ds-color-*`.
  - Purpose: meaning-based usage (`text`, `surface`, `border`, `action`, `state`).
- Component tokens:
  - Prefix by component intent (for example `--ds-button-*`, `--ds-input-*`, `--ds-card-*`).
  - Purpose: stable component-level contracts.

## Feature Styling Rules
- Feature CSS under `src/app/features/**` must not introduce new raw hex colors.
- Feature CSS must not consume reference palette tokens directly:
  - Disallowed examples: `var(--brand-600)`, `var(--color-indigo-600)`.
- Prefer semantic/component tokens in all new feature styles.
- Keep dynamic visual values in CSS variables (for example `[style.--ds-progress]`) instead of inline style values.

## Component Class Conventions
- Use route-scoped class prefixes to avoid collisions:
  - Example: `.owner-settings-*`, `.tenant-grades-*`, `.teacher-media-*`.
- For repeated utility bundles, extract to named route classes.
- Preserve behavior and structure while extracting classes (especially stateful controls and responsive layouts).

## Validation Requirements
Every DS-affecting PR must pass:
- `npm run lint`
- `npm run vr:test -- --grep "<impacted-route-key>"` for focused route checks
- Full matrix run (`npm run vr:test`) for stabilization or broad refactors

## Migration Workflow
1. Extract one small parity-safe slice.
2. Validate focused visual parity.
3. Update DS tracker docs (`DS-Task.md`, `DS-Plan.md`, `DS-CurrentTask.md` + slice doc).
4. Repeat until route closeout is complete.
