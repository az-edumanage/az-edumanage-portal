# Current Task: Phase 5 - Shared Primitive Migration Slice 06

## Objective
Expand DS form primitive adoption (`appInput`, `appSelect`, `appCheckbox`, toggle directives) across additional high-usage Owner forms while preserving layout parity.

## Status
`Completed`

## Sub-Tasks
- [x] Wire `FORM_COMPONENTS` into `owner-plan-create` and `owner-provisioning-settings` standalone imports (`src/app/features/owner/pages/owner-plan-create/owner-plan-create.component.ts`, `src/app/features/owner/pages/owner-provisioning-settings/owner-provisioning-settings.component.ts`) (`docs/ds-shared-primitive-migration-slice-06.md`).
- [x] Replace repeated raw form utility bundles with DS directives in `owner-plan-create` (`appInput`, `appCheckbox`, `appToggleInput`, `appToggleTrack`) while preserving layout classes (`src/app/features/owner/pages/owner-plan-create/owner-plan-create.component.html`) (`docs/ds-shared-primitive-migration-slice-06.md`).
- [x] Replace repeated raw form utility bundles with DS directives in `owner-provisioning-settings` (`appInput`, `appSelect`, `appCheckbox`, `appToggleInput`, `appToggleTrack`) while preserving layout classes (`src/app/features/owner/pages/owner-provisioning-settings/owner-provisioning-settings.component.html`) (`docs/ds-shared-primitive-migration-slice-06.md`).
- [x] Validate build (`npm run build`) and focused baseline visual checks (`owner-compliance` + `design-system` under `brand`, desktop/mobile) (`4 passed`) (`docs/ds-shared-primitive-migration-slice-06.md`).

## Scope Guardrails
- Keep existing primitive selectors and directive APIs unchanged.
- Keep migration incremental and route-validated.
- Limit this slice to additional Owner high-usage forms; avoid broad route-wide refactors.

## Exit Criteria
- High-usage Owner forms use DS form directives for most repeated control patterns.
- No template/build regressions introduced.
- Focused baseline visual checks remain green for validated routes.

## Next Task (Active)
Phase 5 - Shared Primitive Migration Slice 07:
- Add missing visual baseline coverage for high-usage Owner form routes affected by Slice 06.
- Validate `owner-plan-create` and `owner-provisioning-settings` route parity under `brand` (desktop/mobile).
- Finalize Epic 5 closure notes and handoff to broader feature adoption track.
