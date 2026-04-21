# Current Task: Phase 5 - Shared Primitive Migration Slice 07

## Objective
Add missing automated visual baseline coverage for the two high-usage Owner form routes migrated in Slice 06 and verify parity across theme/viewport matrix.

## Status
`Completed`

## Sub-Tasks
- [x] Add `owner-plan-create` (`/owner/plans/create`) to automated visual matrix (`tests/visual/ds-visual.spec.ts`).
- [x] Add `owner-provisioning-settings` (`/owner/provisioning/settings`) to automated visual matrix (`tests/visual/ds-visual.spec.ts`).
- [x] Update locked route matrix documentation to include both routes in P0 (`docs/ds-critical-route-matrix.md`).
- [x] Generate baseline snapshots for both routes under `brand`/`light`/`dark` and desktop/mobile (`npm run vr:update -- --grep "owner-plan-create|owner-provisioning-settings"`).
- [x] Validate focused visual regression run for both routes (`npm run vr:test -- --grep "owner-plan-create|owner-provisioning-settings"`).

## Exit Criteria
- Both Slice 06 high-usage Owner form routes are included in CI visual matrix.
- Baseline snapshots exist for all required theme/viewport combinations.
- Focused visual checks pass with no regressions.

## Next Task (Active)
Phase 6 - Feature Adoption (Owner Slice 01):
- Start Owner feature-wide semantic/component token adoption.
- Prioritize high-frequency Owner pages still using one-off patterns.
- Keep route-by-route parity validation under `brand` as migration guardrail.
