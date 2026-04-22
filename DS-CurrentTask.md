# Current Task: Phase 6 - Feature Adoption (Tenant Slice 02)

## Objective
Apply the Tenant feature adoption extraction pattern to `/tenant/schedule` by replacing repeated one-off utility bundles with component-scoped DS-aligned classes.

## Status
`Completed`

## Sub-Tasks
- [x] Add page-scoped DS-aligned classes for repeated page/header/filter/grid/session-card patterns.
- [x] Replace repeated one-off utility bundles in template while keeping behavior unchanged.
- [x] Promote `/tenant/schedule` from P1 to P0 visual matrix coverage.
- [x] Validate build (`npm run build`).
- [x] Validate lint (`npm run lint`).
- [x] Re-baseline and verify focused visual snapshots (`tenant-schedule`).

## Exit Criteria
- High-frequency Tenant schedule route reduced repeated one-off utility bundles.
- No behavior change introduced.
- Focused route visual checks pass.

## Next Task (Active)
Phase 6 - Feature Adoption (Tenant Slice 03):
- Apply the same extraction pattern to next high-priority tenant surface (`/tenant/rooms/create`).
- Keep route-level parity guardrail via focused visual regression.
