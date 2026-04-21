# Current Task: Phase 1 - Baseline & Planning

## Objective
Prepare a zero-regression execution foundation before touching visual implementation.

## Status
`Completed`

## Sub-Tasks
- [x] Create high-level DS program plan (`DS-Plan.md`).
- [x] Create master DS task tracker (`DS-Task.ms`).
- [x] Define and lock the critical route matrix for visual baselines (`docs/ds-critical-route-matrix.md`).
- [x] Define `brand`/light/dark + breakpoint baseline capture strategy (`docs/ds-baseline-capture-strategy.md`).
- [x] Confirm CI integration approach for visual regression checks (`docs/ds-ci-visual-regression.md`, `.github/workflows/visual-regression.yml`).
- [x] Define inline-style migration policy and inventory: move to separated CSS with DS tokens and zero visual delta in `brand` (`docs/ds-inline-style-inventory.md`).
- [x] Create first migration task batch for token foundation scaffolding (`docs/ds-token-foundation-batch-01.md`, `src/styles/tokens/*`, `src/styles.css` import wiring).

## Scope Guardrails
- Do not alter existing UI visuals in this task.
- Do not change feature component markup/styles yet.
- Focus only on planning artifacts and execution readiness.

## Exit Criteria
- Planning docs reviewed and accepted.
- Next implementation task (Token Foundation Scaffolding) is fully scoped and ready.

## Next Task (Active)
Phase 2 - Token Adoption Slice 01:
- Apply DS token usage to one low-risk shared UI primitive.
- Convert one P0 inline-style pattern to class/CSS-variable driven styling.
- Validate `brand` snapshot parity on affected P0 routes.
