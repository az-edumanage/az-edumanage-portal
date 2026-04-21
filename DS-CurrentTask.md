# Current Task: Phase 5 - Shared Primitive Migration Slice 01

## Objective
Audit and classify shared primitive candidates, then start standardization with low-risk changes focused on `badge` and `table` candidates.

## Status
`Completed`

## Sub-Tasks
- [x] Audit shared primitive usage and rank migration candidates (`button`, `card`, `badge`, `table`, `pager`) (`docs/shared-ui-candidate-matrix.md`, `docs/ds-shared-primitive-migration-slice-01.md`).
- [x] Standardize `badge` candidate by introducing `info` variant and removing one-off custom class usage (`src/app/shared/components/data-display/badge/badge.component.ts`, `src/app/features/owner/components/owner-billing-invoices-table/owner-billing-invoices-table.component.html`) (`docs/ds-shared-primitive-migration-slice-01.md`).
- [x] Add DS badge/table token scaffolding for next incremental adoption (`src/styles/tokens/component.tokens.css`) (`docs/ds-shared-primitive-migration-slice-01.md`).
- [x] Validate `brand` parity on `owner-billing` and regenerate approved baseline (`docs/ds-shared-primitive-migration-slice-01.md`).

## Scope Guardrails
- Keep existing selectors and public primitive APIs backward-compatible.
- Prefer incremental standardization with route-level parity checks.
- Defer high-blast-radius table directive class adoption to next slice.

## Exit Criteria
- Shared primitive audit is documented with clear ranking.
- First primitive standardization is implemented and validated.
- No regressions on representative billing route under `brand`.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 02:
- Migrate `appTable*` directives to DS table class ownership (`ds-table*`) in a controlled batch.
- Validate parity on billing table-heavy route(s) for desktop + mobile.
- Add a DS showcase section for standardized `badge` + `table` primitives.
