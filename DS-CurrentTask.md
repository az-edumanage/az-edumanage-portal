# Current Task: Phase 2 - Token Adoption Slice 03

## Objective
Start incremental DS adoption with real code changes while preserving `brand` visual parity.

## Status
`Completed`

## Sub-Tasks
- [x] Migrate `owner-subscription-details` static inline-width bars (`docs/ds-token-adoption-slice-03.md`).
- [x] Migrate `owner-tenant-create` inline `z-index` style into component CSS/token (`docs/ds-token-adoption-slice-03.md`).
- [x] Run targeted `brand` snapshots for affected owner routes (`owner-subscription-details`, `owner-tenants-create`) (`docs/ds-token-adoption-slice-03.md`).

## Scope Guardrails
- Keep visual parity in `brand` theme (no intentional UI/layout changes).
- Keep PR scope narrow and reversible.
- Prefer class-based DS styling; allow dynamic `[style.*]` only for data values.

## Exit Criteria
- Targeted P0 owner route conversions are migrated to DS class/CSS-variable patterns.
- Targeted `brand` snapshots pass for migrated routes.

## Next Task (Active)
Phase 2 - Token Adoption Slice 04:
- Migrate `owner-tenants-list` hardcoded inline dimensions to DS class/tokenized sizing.
- Start tenant route conversions for inline progress widths (`tenant-room-details`, `tenant-group-details`, `tenant-group-attendance`).
- Run targeted `brand` snapshots for affected matrix routes.
