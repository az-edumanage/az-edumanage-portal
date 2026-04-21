# Current Task: Phase 2 - Token Adoption Slice 04

## Objective
Start incremental DS adoption with real code changes while preserving `brand` visual parity.

## Status
`Completed`

## Sub-Tasks
- [x] Migrate `owner-tenants-list` hardcoded inline dimensions to DS class/tokenized sizing (`docs/ds-token-adoption-slice-04.md`).
- [x] Convert tenant progress-width bindings (`tenant-room-details`, `tenant-group-details`, `tenant-group-attendance`) to DS CSS-variable pattern (`docs/ds-token-adoption-slice-04.md`).
- [x] Run targeted `brand` snapshots for affected matrix routes (`owner-tenants`, `tenant-groups-details`, `tenant-rooms`) (`docs/ds-token-adoption-slice-04.md`).

## Scope Guardrails
- Keep visual parity in `brand` theme (no intentional UI/layout changes).
- Keep PR scope narrow and reversible.
- Prefer class-based DS styling; allow dynamic `[style.*]` only for data values.

## Exit Criteria
- Targeted P0 owner route conversions are migrated to DS class/CSS-variable patterns.
- Targeted `brand` snapshots pass for migrated routes.

## Next Task (Active)
Phase 2 - Token Adoption Slice 05:
- Migrate `tenant-grade-details` static inline widths to DS width utilities/classes.
- Migrate `owner-compliance` remaining progress-width binding to DS CSS-variable pattern.
- Run targeted `brand` snapshots for affected matrix routes (or nearest parent route coverage where route is outside P0).
