# DS Baseline Capture Strategy

Purpose: run repeatable visual baselines with zero regression during DS migration, with `brand` as the parity source.

## Scope Source
- Route scope is locked in [ds-critical-route-matrix.md](/home/hussein/Public/education-center-management/docs/ds-critical-route-matrix.md).
- P0 routes are mandatory in CI.
- P1 routes are mandatory in manual smoke and can be added to CI incrementally.

## Theme Matrix
- `brand` (parity baseline, must match current visuals)
- `light`
- `dark`

## Viewport Matrix
- `desktop`: `1440x900`
- `mobile`: `390x844`

## Capture Dimensions
For each P0 route:
- 2 viewports x 3 themes = 6 snapshots per route.
- Global run naming convention:
  - `<route-key>__<theme>__<viewport>.png`
  - Example: `owner-overview__brand__desktop.png`

## Execution Standard
- Recommended tool: Playwright visual snapshots.
- Freeze dynamic noise where possible:
  - deterministic fixture IDs (`plan-001`, `group-001`, etc.)
  - stable clocks/timezone in test runtime
  - seeded API/fixture state for dynamic widgets
- Capture full-page screenshot and key-region screenshots for high-change components (tables/charts/forms) when needed.

## CI Gating Policy
- PRs touching UI/token/theme files must run P0 matrix snapshots.
- PR fails on unexpected visual diffs in `brand` unless explicitly approved.
- `light`/`dark` diffs can be approved only when linked to intentional theme work.

## Acceptance Thresholds
- `brand` theme:
  - target: pixel-equivalent to baseline
  - allowed: anti-aliasing noise only
  - reject: spacing, typography, color, border, radius, shadow, or layout shifts
- `light`/`dark` themes:
  - reject structural/layout regressions
  - reject token mismaps (wrong semantic color/surface/text)

## Batch Rollout Rule
- Migrate and validate in small batches (one feature slice or one primitive family).
- Each batch must include:
  - before/after snapshot report
  - affected routes list
  - approval note when any diff is accepted

## Manual Smoke Overlay
In addition to snapshots, run [manual-smoke-checklist.md](/home/hussein/Public/education-center-management/docs/manual-smoke-checklist.md) for:
- shell interactions
- theme toggle persistence
- form draft/task restore

## Exit Criteria for Baseline Phase
- P0 snapshot matrix automation is in CI.
- `brand` baseline approved and locked.
- Diff triage + approval path is documented and followed.
