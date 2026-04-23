# DS Feature Adoption - Cleanup 01 (Duplicate One-Off Patterns)

## Scope
- Routes/components touched:
  - `teacher-dashboard` (`/teacher/overview`, `/teacher/schedule`, `/teacher/messages`)
  - `teacher-media` (`/teacher/media`)
  - `owner-modules-list` (`/owner/modules`) parity verification

## Changes
- Reduced duplicate utility-only icon-size patterns by introducing scoped component classes:
  - `teacher-dashboard-icon-xs|sm|md|lg`
  - `teacher-media-icon-sm`
- Updated templates to consume scoped classes instead of repeated utility bundles (`text-sm`, `text-[18px]`, etc.).
- Kept owner modules visual parity stable by reverting non-critical cleanup class replacement that produced avoidable snapshot noise.

## Validation
- `npm run build` (pass)
- `npm run lint` (pass)
- `npm run vr:test -- --grep "owner-modules"` (pass)
- `npm run vr:test -- --grep "teacher-overview|teacher-schedule|teacher-messages|teacher-media"` (pass)

## Notes
- Existing non-blocking global warnings remain outside this cleanup scope.
