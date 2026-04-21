# DS Inline Style Inventory

Purpose: inventory current inline style usage before migrating to separated CSS/DS tokens with zero visual delta in `brand` theme.

## Detection Query
`rg -n "style=\"|\[style\.|\[ngStyle\]" src/app`

## Summary
- Total unique hits: `21`
- Owner feature hits: `15`
- Tenant feature hits: `6`
- Teacher feature hits: `0`
- Migrated in Slice 01:
  - `owner-overview` progress width pattern moved to DS CSS-variable class pattern.
  - `owner-billing` revenue bar height pattern moved to DS CSS-variable class pattern.
- Migrated in Slice 02:
  - `owner-usage-analytics` module and feature-adoption bars moved to DS CSS-variable/class patterns.
  - `owner-tenant-details` static utilization bars moved to DS class utility pattern.
- Migrated in Slice 03:
  - `owner-subscription-details` static utilization bars moved to DS class utility pattern.
  - `owner-tenant-create` inline `z-index` moved to separated CSS using DS layer token.
- Migrated in Slice 04:
  - `owner-tenants-list` inline dimensions moved to separated component CSS class.
  - `tenant-room-details`, `tenant-group-details`, and `tenant-group-attendance` progress bars moved to DS CSS-variable pattern.
- Migrated in Slice 05:
  - `tenant-grade-details` static widths moved to DS width utility classes.
  - `owner-compliance` progress width binding moved to DS CSS-variable pattern.

## Current Findings

| File | Count | Pattern Type | Priority | Migration Note |
|---|---:|---|---|---|
| `src/app/features/owner/pages/owner-usage-analytics/owner-usage-analytics.component.html` | 4 | `[style.width.%]` + `style="width:..."` | P0 | Migrated to DS progress class/CSS-variable pattern in Slice 02. |
| `src/app/features/owner/pages/owner-tenant-details/owner-tenant-details.component.html` | 3 | `style="width:..."` | P0 | Migrated to DS progress width utility classes in Slice 02. |
| `src/app/features/owner/pages/owner-subscription-details/owner-subscription-details.component.html` | 3 | `style="width:..."` | P0 | Migrated to DS progress width utility classes in Slice 03. |
| `src/app/features/tenant/pages/tenant-room-details/tenant-room-details.component.html` | 2 | `[style.width.%]` | P1 | Migrated to DS CSS-variable + `ds-progress-fill` in Slice 04. |
| `src/app/features/tenant/pages/tenant-grade-details/tenant-grade-details.component.html` | 2 | `style="width:..."` | P1 | Migrated to DS width utility classes in Slice 05. |
| `src/app/features/owner/pages/owner-billing/owner-billing-page.component.html` | 1 | `[style.height.%]` | P0 | Migrated to DS CSS-variable + `ds-revenue-column` in Slice 01. |
| `src/app/features/owner/pages/owner-compliance/owner-compliance.component.html` | 1 | `[style.width.%]` | P1 | Migrated to DS CSS-variable + `ds-progress-fill` in Slice 05. |
| `src/app/features/owner/pages/owner-overview/owner-overview.component.html` | 1 | `[style.width.%]` | P0 | Migrated to DS CSS-variable + `ds-progress-fill` in Slice 01. |
| `src/app/features/owner/pages/owner-tenant-create/owner-tenant-create-page.component.html` | 1 | `style="z-index:..."` | P0 | Migrated to component CSS class + DS layer token in Slice 03. |
| `src/app/features/owner/pages/owner-tenants-list/owner-tenants-list.component.html` | 1 | `style="height/width"` | P0 | Migrated to separated component CSS class in Slice 04. |
| `src/app/features/tenant/pages/tenant-group-attendance/tenant-group-attendance.component.html` | 1 | `[style.width.%]` | P1 | Migrated to DS CSS-variable + `ds-progress-fill` in Slice 04. |
| `src/app/features/tenant/pages/tenant-group-details/tenant-group-details.component.html` | 1 | `[style.width.%]` | P1 | Migrated to DS CSS-variable + `ds-progress-fill` in Slice 04. |

## Migration Policy (No Regression)
- Keep dynamic data bindings, but move visual rules into DS classes/component CSS.
- Prefer CSS custom properties for dynamic dimensions:
  - template: `[style.--ds-progress]="value + '%'"`
  - css: `width: var(--ds-progress);`
- Replace static inline style attributes with class-based styles in component CSS.
- Use `brand` snapshots as hard gate for each conversion batch.

## Execution Order
1. Owner P0 pages with dashboard and details bars.
2. Owner fixed inline layout styles (`z-index`, hard dimensions).
3. Tenant pages using repeated progress-bar bindings.
4. Remaining static width cleanup.

## Completion Criteria
- No `style="..."` in migrated target files (except approved edge cases).
- `[style.*]` usage only for data-driven values with DS class ownership.
- `brand` snapshot diff is clean for affected routes.
