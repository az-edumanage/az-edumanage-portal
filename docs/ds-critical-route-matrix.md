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
| `/owner/plans/create` | owner | High-usage Owner form route migrated to DS form directives. |
| `/owner/plans/plan-001` | owner | Details layout with cards/sections. |
| `/owner/subscriptions` | owner | Core subscription listing with filters/status/action patterns. |
| `/owner/subscriptions/templates` | owner | Template catalog cards and template-management actions. |
| `/owner/subscriptions/templates/TMP_001` | owner | Subscription template details with configuration and pricing side panels. |
| `/owner/subscriptions/sub-001` | owner | Subscription detail page with plan utilization metrics. |
| `/owner/subscriptions/create` | owner | Subscription template creation form with dense policy/notification controls. |
| `/owner/subscriptions/orders` | owner | Dense admin page with mixed controls. |
| `/owner/billing` | owner | Financial table and filters. |
| `/owner/analytics` | owner | Usage analytics tables and feature adoption progress bars. |
| `/owner/security` | owner | Security controls and dense settings UI. |
| `/owner/notifications` | owner | Notification list table/actions and status chips. |
| `/owner/modules` | owner | Module listing cards with category chip/filter variants. |
| `/owner/integrations` | owner | Integration cards with status/mode toggles and configure actions. |
| `/owner/users` | owner | User list patterns and badges/chips. |
| `/owner/tenants/tenant-001` | owner | Tenant details page with utilization progress metrics. |
| `/owner/tenants/tenant-001/edit` | owner | Tenant edit form with dense dropdown/control combinations. |
| `/owner/provisioning/settings` | owner | High-usage Owner provisioning form route migrated to DS form directives. |
| `/owner/settings` | owner | Settings toggles and form controls. |
| `/tenant/overview` | tenant | Tenant dashboard baseline. |
| `/tenant/teachers` | tenant | Teacher directory with grid/list mode, advanced filters, and action menus. |
| `/tenant/students` | tenant | Standard list/table rendering. |
| `/tenant/students/create` | tenant | Create form coverage. |
| `/tenant/groups` | tenant | Group list and action buttons. |
| `/tenant/groups/create` | tenant | Complex multi-section form coverage. |
| `/tenant/groups/group-001` | tenant | Detail view and schedule sections. |
| `/tenant/groups/group-001/attendance` | tenant | Attendance page with DS-migrated progress bars. |
| `/tenant/rooms` | tenant | List + card/table hybrid layout. |
| `/teacher/overview` | teacher | Teacher main dashboard baseline. |
| `/teacher/media` | teacher | Teacher feature page with cards/actions. |
| `/design-system` | all | DS showcase must remain stable as reference surface. |

## P1 Routes (Manual Required, Auto Optional in Phase 1)

| Route | Role | Note |
|---|---|---|
| `/owner/compliance` | owner | Compliance request progress bars and policy controls. |
| `/tenant/schedule` | tenant | Calendar/schedule visual area. |
| `/tenant/rooms/create` | tenant | Additional create form path. |
| `/tenant/grades` | tenant | Grades list/table patterns. |
| `/tenant/grades/grade-001` | tenant | Grade details with static performance progress bars. |
| `/teacher/schedule` | teacher | Shared dashboard variant route. |

## Fixture ID Policy
- Use deterministic IDs only (examples: `plan-001`, `group-001`, `tenant-001`).
- If backend data is required, seed fixtures before snapshots.
- Never use production/random IDs in baseline scripts.

## Change Control
- Any modification to this matrix requires:
  - DS reviewer approval.
  - Update in `DS-Task.md` and `DS-CurrentTask.md`.
  - Regenerated baseline snapshots for changed scope.
