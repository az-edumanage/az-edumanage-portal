# DS Feature Adoption - Teacher Slice 01 (`/teacher/schedule`)

## Scope
- Route: `/teacher/schedule`
- Component: `teacher-dashboard` (shared with `/teacher/overview`)

## Changes
- Extracted repeated one-off utility bundles into page-scoped classes in:
  - `src/app/features/teacher/pages/teacher-dashboard/teacher-dashboard.component.css`
  - `src/app/features/teacher/pages/teacher-dashboard/teacher-dashboard.component.html`
- Promoted `/teacher/schedule` from P1 to P0 visual baseline:
  - `tests/visual/ds-visual.spec.ts`
  - `docs/ds-critical-route-matrix.md`

## Validation
- `npm run build` (pass)
- `npm run lint` (pass)
- `npm run vr:update -- --grep "teacher-schedule"` (pass)
- `npm run vr:test -- --grep "teacher-schedule"` (pass)

## Notes
- `/teacher/schedule` is currently routed to `TeacherDashboardComponent`; extraction preserves this shared behavior.
- Existing non-blocking global warnings remain outside this slice scope.
