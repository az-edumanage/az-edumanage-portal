# DS Feature Adoption - Teacher Slice 02 (`/teacher/messages`)

## Scope
- Route: `/teacher/messages`
- Component: `teacher-dashboard` (shared with `/teacher/overview` and `/teacher/schedule`)

## Changes
- Preserved extracted page-scoped DS-aligned classes for the shared dashboard-backed teacher route.
- Fixed component style loading by wiring:
  - `src/app/features/teacher/pages/teacher-dashboard/teacher-dashboard.component.ts`
    - added `styleUrl: './teacher-dashboard.component.css'`
- Promoted `/teacher/messages` from P1 to P0 visual baseline:
  - `tests/visual/ds-visual.spec.ts`
  - `docs/ds-critical-route-matrix.md`

## Validation
- `npm run build` (pass)
- `npm run lint` (pass)
- `npm run vr:update -- --grep "teacher-messages"` (pass)
- `npm run vr:test -- --grep "teacher-messages"` (pass)

## Notes
- `/teacher/messages` is currently routed to `TeacherDashboardComponent`; this slice keeps that behavior unchanged and focuses on parity guardrails.
- Existing non-blocking global warnings remain outside this slice scope.
