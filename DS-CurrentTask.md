# Current Task: Design System Program Closeout

## Objective
Finalize DS migration governance/stabilization and close the DS v1 program with full regression validation.

## Status
`Done`

## Sub-Tasks
- [x] Add DS style guard enforcement for raw hex and semantic-token bypass (`scripts/ds-style-guard.mjs`, `docs/ds-style-guard-baseline.json`, `package.json`).
- [x] Add DS contribution guide and naming rules (`docs/ds-contribution-guide.md`).
- [x] Add UI PR DS review checklist template (`.github/pull_request_template.md`).
- [x] Apply parity-safe owner closeout continuation and integrations layout fix (`owner-settings`, `owner-integrations`).
- [x] Run full visual baseline refresh for critical route matrix (`npm run vr:update`).
- [x] Run full non-update visual regression verification (`npm run vr:test`, `257 passed`).
- [x] Record DS v1 completion artifact (`docs/ds-v1-complete.md`).

## Exit Criteria
- Governance/lint enforcement active in CI lint pipeline.
- Contribution/review standards documented.
- Full critical route matrix passes regression verification.
- DS task tracker contains no remaining open migration/stabilization items.

## Next Task (Active)
None. DS v1 is complete.
