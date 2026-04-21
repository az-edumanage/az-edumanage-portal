# Current Task: Phase 2 - Token Adoption Slice 06

## Objective
Complete final inline-style cleanup verification for Owner/Tenant migrated pages and broaden `brand` regression safety coverage.

## Status
`Completed`

## Sub-Tasks
- [x] Run final inline-style sweep for Owner/Tenant pages and confirm only DS-approved dynamic bindings remain (`docs/ds-token-adoption-slice-06.md`).
- [x] Add `tenant-group-attendance` to automated visual regression coverage (`docs/ds-token-adoption-slice-06.md`).
- [x] Run broad `brand` regression pass for migrated Owner/Tenant routes on desktop + mobile (`24 passed`) (`docs/ds-token-adoption-slice-06.md`).

## Scope Guardrails
- Preserve visual parity in `brand` theme.
- Keep changes incremental and reversible.
- Keep dynamic style bindings only where data-driven and DS-owned.

## Exit Criteria
- No raw `style="..."` attributes remain in Owner/Tenant migrated feature pages.
- Broad migrated-route `brand` sweep is passing on desktop and mobile.

## Next Task (Active)
Phase 3 - Theme System Hardening Slice 01:
- Centralize root theme class application in layout shell/app bootstrap.
- Verify `localStorage` theme persistence behavior remains unchanged.
- Add regression check for theme toggling across `brand`, `light`, and `dark` on core shell routes.
