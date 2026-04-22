# Current Task: Phase 6 - Feature Adoption (Owner Slice 20)

## Objective
Apply the Owner feature adoption extraction pattern to `/owner/security` by replacing repeated one-off utility bundles with component-scoped DS-aligned classes.

## Status
`Completed`

## Sub-Tasks
- [x] Enable external stylesheet metadata for owner-security page component (`styleUrl`).
- [x] Add page-scoped DS-aligned classes for repeated page/header/card/field/toggle patterns.
- [x] Replace repeated one-off utility bundles in template while keeping security form behavior unchanged.
- [x] Expand P0 visual matrix to include `/owner/security` route key.
- [x] Patch and harden `/owner/subscriptions/create` styles with safe CSS variable fallbacks and dark overrides (regression fix).
- [x] Validate build (`npm run build`).
- [x] Validate lint (`npm run lint`).
- [x] Re-baseline and verify focused visual snapshots (`owner-subscription-create`, `owner-security`).

## Exit Criteria
- High-frequency Owner security route reduced repeated one-off utility bundles.
- No behavior change introduced.
- Focused route visual checks pass.

## Next Task (Active)
Phase 6 - Feature Adoption (Owner Slice 21):
- Apply the same extraction pattern to next high-frequency Owner surface (`/owner/notifications`).
- Keep route-level parity guardrail via focused visual regression.
