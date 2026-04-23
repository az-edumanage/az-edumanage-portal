# Current Task: Phase 6 - Feature Adoption (Teacher Slice 03)

## Objective
Apply the Teacher feature adoption extraction pattern to `/teacher/media` by replacing repeated one-off utility bundles with component-scoped DS-aligned classes.

## Status
`Completed`

## Sub-Tasks
- [x] Add page-scoped DS-aligned classes for repeated header/action/tab/media-card patterns.
- [x] Replace repeated one-off utility bundles in template while keeping behavior unchanged.
- [x] Keep `/teacher/media` route-level parity guardrail under focused visual regression.
- [x] Validate build (`npm run build`).
- [x] Validate lint (`npm run lint`).
- [x] Re-baseline and verify focused visual snapshots (`teacher-media`).

## Exit Criteria
- High-frequency Teacher media surface reduced repeated one-off utility bundles.
- No behavior change introduced.
- Focused route visual checks pass.

## Next Task (Active)
Phase 6 - Feature Adoption (Cleanup 01):
- Remove duplicate one-off style patterns after replacement.
- Keep route-level parity guardrail via focused visual regression.
