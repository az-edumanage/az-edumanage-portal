# Current Task: Phase 3 - Theme System Hardening Slice 02

## Objective
Add a future-ready tenant-theme hook (class namespace + token override entrypoint), document the override contract, and add an initial non-default tenant theme smoke check without impacting `brand` parity.

## Status
`Completed`

## Sub-Tasks
- [x] Add tenant theme runtime hook and class namespace orchestration (`theme-tenant-default`, `theme-tenant-ocean`) (`src/app/core/services/dashboard.service.ts`) (`docs/ds-theme-system-hardening-slice-02.md`).
- [x] Add tenant theme token override entrypoint and wire it into token imports (`src/styles/tokens/theme.tenant-overrides.css`, `src/styles/tokens/index.css`) (`docs/ds-theme-system-hardening-slice-02.md`).
- [x] Define tenant-theme override contract and fallback rules (`docs/ds-tenant-theme-contract.md`) (`docs/ds-theme-system-hardening-slice-02.md`).
- [x] Add non-default tenant theme smoke checks on tenant/owner routes (`tests/visual/tenant-theme-smoke.spec.ts`) (`docs/ds-theme-system-hardening-slice-02.md`).

## Scope Guardrails
- Keep `brand` as parity baseline and avoid intentional visual changes.
- Keep tenant overrides token-scoped and opt-in via class namespace.
- Keep owner/teacher routes on `theme-tenant-default` fallback.

## Exit Criteria
- Tenant theme classes and token entrypoint exist and are documented.
- Smoke checks pass for non-default tenant theme application and owner fallback isolation.
- Build remains green.

## Next Task (Active)
Phase 4 - Tailwind & Material Alignment Slice 01:
- Map core Tailwind color/surface utilities to DS semantic variables where safe.
- Keep visual parity by introducing compatibility aliases for existing utility usage.
- Validate representative Owner/Tenant/Teacher routes under `brand` after mapping.
