# Current Task: Phase 6 - Feature Adoption (Cleanup 01)

## Objective
Remove duplicate one-off style patterns introduced during feature slice extraction while preserving route-level parity.

## Status
`Completed`

## Sub-Tasks
- [x] Replace repeated utility-only icon sizing bundles with scoped component classes on migrated teacher surfaces.
- [x] Keep owner modules parity by reverting non-critical cleanup that introduced avoidable snapshot noise.
- [x] Validate build (`npm run build`).
- [x] Validate lint (`npm run lint`).
- [x] Verify focused visual snapshots for impacted routes (`owner-modules`, `teacher-overview`, `teacher-schedule`, `teacher-messages`, `teacher-media`).

## Exit Criteria
- Duplicate one-off style patterns reduced in recently migrated routes.
- No behavior or visual regressions introduced.
- Focused route visual checks pass.

## Next Task (Active)
Phase 1 - Safety Net & Baseline (Checklist 01):
- Add manual smoke checklist for DS-sensitive interactions.
