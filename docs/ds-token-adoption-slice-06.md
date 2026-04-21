# DS Token Adoption - Slice 06

Date: 2026-04-21
Status: Completed

## Goal
Execute the final inline-style sweep for Owner/Tenant migrated pages and run a broader `brand` regression sweep across migrated routes.

## Changes
- Expanded automated coverage with migrated route:
  - Added `tenant-group-attendance` to visual regression matrix/spec.
- Ran final Owner/Tenant inline-style sweep:
  - Query: `rg -n "style=\"|\[style\.|\[ngStyle\]" src/app/features/owner src/app/features/tenant`
  - Result: only DS-approved dynamic bindings (`[style.--ds-progress]`, `[style.--ds-bar-height]`), no raw `style="..."`.
- Generated missing `brand` baselines for migrated route set (mostly mobile snapshots + new attendance route).
- Re-ran strict compare pass for the same migrated route set and confirmed green.

## Validation
- Baseline generation:
  - `npm run vr:update -- --grep "(owner-overview|owner-billing|owner-analytics|owner-tenant-details|owner-subscription-details|owner-tenants-create|owner-tenants|owner-compliance|tenant-groups-details|tenant-group-attendance|tenant-rooms|tenant-grade-details) \| brand \| (desktop|mobile)"`
- Strict compare:
  - `npm run vr:test -- --grep "(owner-overview|owner-billing|owner-analytics|owner-tenant-details|owner-subscription-details|owner-tenants-create|owner-tenants|owner-compliance|tenant-groups-details|tenant-group-attendance|tenant-rooms|tenant-grade-details) \| brand \| (desktop|mobile)"`
  - Result: `24 passed`.

## Artifacts
- Updated: `tests/visual/ds-visual.spec.ts`
- Updated: `docs/ds-critical-route-matrix.md`
- Added snapshots:
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-overview-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-tenants-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-tenants-create-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-subscription-details-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-billing-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-analytics-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-compliance-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-tenant-details-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/tenant-groups-details-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/tenant-group-attendance-brand-desktop-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/tenant-group-attendance-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/tenant-rooms-brand-mobile-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/tenant-grade-details-brand-mobile-linux.png`

