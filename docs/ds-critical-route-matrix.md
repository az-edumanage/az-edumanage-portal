# DS Critical Route Matrix (Locked)

Purpose: define the minimum visual-regression baseline coverage for zero-regression Design System migration.

## Lock Rules
- P0 routes are mandatory in visual regression CI (`brand` + `light` + `dark`).
- P1 routes are required for manual smoke each migration PR and should be added to automated snapshots incrementally.
- All snapshots must run on `desktop` and `mobile` viewports.
- Dynamic routes must use stable fixture IDs.

## Viewports
- `desktop`: 1440x900
- `mobile`: 390x844

## Theme Modes
- `brand` (default parity theme, must match current production visuals)
- `light`
- `dark`

## Brand Theme Rule
- `brand` is the visual parity theme and represents current existing style.
- During inline-style migration, visuals in `brand` must remain pixel-equivalent to baseline snapshots.
- Any inline style moved to separate CSS must be mapped to DS tokens or DS component classes with no intentional design/layout changes.

## P0 Baseline Routes (Must Cover in CI)

| Route | Role | Why P0 |
|---|---|---|
| `/owner/overview` | owner | Main owner dashboard and shared shell patterns. |
| `/owner/tenants` | owner | Core data table/list patterns. |
| `/owner/tenants/create` | owner | Complex form layout and validation styles. |
| `/owner/plans` | owner | Table + filter composition used widely. |
| `/owner/plans/plan-001` | owner | Details layout with cards/sections. |
| `/owner/subscriptions/orders` | owner | Dense admin page with mixed controls. |
| `/owner/billing` | owner | Financial table and filters. |
| `/owner/analytics` | owner | Usage analytics tables and feature adoption progress bars. |
| `/owner/users` | owner | User list patterns and badges/chips. |
| `/owner/tenants/tenant-001` | owner | Tenant details page with utilization progress metrics. |
| `/owner/settings` | owner | Settings toggles and form controls. |
| `/tenant/overview` | tenant | Tenant dashboard baseline. |
| `/tenant/students` | tenant | Standard list/table rendering. |
| `/tenant/students/create` | tenant | Create form coverage. |
| `/tenant/groups` | tenant | Group list and action buttons. |
| `/tenant/groups/create` | tenant | Complex multi-section form coverage. |
| `/tenant/groups/group-001` | tenant | Detail view and schedule sections. |
| `/tenant/rooms` | tenant | List + card/table hybrid layout. |
| `/teacher/overview` | teacher | Teacher main dashboard baseline. |
| `/teacher/media` | teacher | Teacher feature page with cards/actions. |
| `/design-system` | all | DS showcase must remain stable as reference surface. |

## P1 Routes (Manual Required, Auto Optional in Phase 1)

| Route | Role | Note |
|---|---|---|
| `/owner/notifications` | owner | Notification list patterns. |
| `/owner/security` | owner | Security controls and dense settings UI. |
| `/owner/modules` | owner | Module listing variants. |
| `/owner/integrations` | owner | Integration list/detail patterns. |
| `/tenant/teachers` | tenant | Secondary list coverage. |
| `/tenant/schedule` | tenant | Calendar/schedule visual area. |
| `/tenant/rooms/create` | tenant | Additional create form path. |
| `/tenant/grades` | tenant | Grades list/table patterns. |
| `/teacher/schedule` | teacher | Shared dashboard variant route. |

## Fixture ID Policy
- Use deterministic IDs only (examples: `plan-001`, `group-001`, `tenant-001`).
- If backend data is required, seed fixtures before snapshots.
- Never use production/random IDs in baseline scripts.

## Change Control
- Any modification to this matrix requires:
  - DS reviewer approval.
  - Update in `DS-Task.ms` and `DS-CurrentTask.md`.
  - Regenerated baseline snapshots for changed scope.
