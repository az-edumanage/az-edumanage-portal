# Current Task: Phase 2 - Token Adoption Slice 01

## Objective
Start incremental DS adoption with real code changes while preserving `brand` visual parity.

## Status
`In Progress`

## Sub-Tasks
- [x] Apply DS token usage to one low-risk shared UI primitive (`app-pager-button`) (`docs/ds-token-adoption-slice-01.md`).
- [x] Convert one P0 inline-style pattern to class/CSS-variable driven styling (`owner-overview` regional progress) (`docs/ds-token-adoption-slice-01.md`).
- [x] Validate `brand` snapshot parity on affected P0 route (`owner-overview | brand | desktop`) (`docs/ds-token-adoption-slice-01.md`).
- [ ] Extend the same DS progress pattern to next P0 inline-style target (`owner-billing` or `owner-usage-analytics`).
- [ ] Run targeted `brand` visual checks for the next converted P0 route.

## Scope Guardrails
- Keep visual parity in `brand` theme (no intentional UI/layout changes).
- Keep PR scope narrow and reversible.
- Prefer class-based DS styling; allow dynamic `[style.*]` only for data values.

## Exit Criteria
- At least 2 P0 inline-style targets migrated to DS class/CSS-variable pattern.
- Targeted `brand` snapshots pass for migrated P0 routes.
