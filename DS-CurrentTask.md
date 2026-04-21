# Current Task: Phase 4 - Tailwind & Material Alignment Slice 02

## Objective
Introduce a low-risk Angular Material semantic token bridge mapped to DS variables and validate Material + Tailwind parity on representative `brand` routes.

## Status
`Completed`

## Sub-Tasks
- [x] Add Material semantic bridge token file and wire it globally (`src/styles/tokens/material.semantic-bridge.css`, `src/styles/tokens/index.css`) (`docs/ds-tailwind-material-alignment-slice-02.md`).
- [x] Map core Material semantic variables (`primary/surface/on-surface/outline`) to DS semantic tokens with MDC-compatible fallbacks (`docs/ds-tailwind-material-alignment-slice-02.md`).
- [x] Validate representative `brand` routes on desktop (`owner-overview`, `tenant-rooms`, `teacher-media`) (`docs/ds-tailwind-material-alignment-slice-02.md`).
- [x] Confirm build stability after bridge integration (`docs/ds-tailwind-material-alignment-slice-02.md`).

## Scope Guardrails
- Keep changes token-level only (no Material component selector overrides).
- Preserve `brand` visual parity and existing utility-driven UI.
- Keep this slice isolated from primitive/component refactors.

## Exit Criteria
- Material semantic bridge is present and imported in global token chain.
- Representative `brand` route checks pass with no regressions.
- Build remains green.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 01:
- Audit and classify shared primitive candidates (`button`, `badge`, `table`, `input/select` wrappers).
- Define migration order and ownership for shared components used across Owner/Tenant/Teacher.
- Execute first shared primitive standardization candidate with parity checkpoints.
