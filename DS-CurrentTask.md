# Current Task: Phase 6 - Feature Adoption (Tenant Slice 03)

## Objective
Apply the Tenant feature adoption extraction pattern to `/tenant/rooms/create` by replacing repeated one-off utility bundles with component-scoped DS-aligned classes.

## Status
`Completed`

## Sub-Tasks
- [x] Add page-scoped DS-aligned classes for repeated page/header/form/equipment/action patterns.
- [x] Replace repeated one-off utility bundles in template while keeping behavior unchanged.
- [x] Promote `/tenant/rooms/create` from P1 to P0 visual matrix coverage.
- [x] Validate build (`npm run build`).
- [x] Validate lint (`npm run lint`).
- [x] Re-baseline and verify focused visual snapshots (`tenant-rooms-create`).

## Exit Criteria
- High-frequency Tenant rooms-create route reduced repeated one-off utility bundles.
- No behavior change introduced.
- Focused route visual checks pass.

## Next Task (Active)
Phase 6 - Feature Adoption (Tenant Slice 04):
- Apply the same extraction pattern to next high-priority tenant surface (`/tenant/grades`).
- Keep route-level parity guardrail via focused visual regression.
