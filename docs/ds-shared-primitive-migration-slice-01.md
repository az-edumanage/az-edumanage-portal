# DS Shared Primitive Migration - Slice 01

Date: 2026-04-21  
Status: Completed

## Goal
Audit shared primitive usage and start standardization with a low-risk first candidate, while preserving `brand` parity.

## Audit Summary
- `<app-button>` usages: `7`
- `<app-card>` usages: `6`
- `<app-badge>` usages: `4`
- `appTable*` directive usages: `81`
- `<app-pager-button>` usages: `6`

## Implemented in This Slice
- Standardized `BadgeComponent` variant system to DS classes:
  - Added `info` variant to replace one-off purple class usage.
  - File: `src/app/shared/components/data-display/badge/badge.component.ts`
- Replaced one-off badge style override with standardized variant:
  - `owner-billing-invoices-table`: `class="bg-purple..."` -> `variant="info"`.
  - File: `src/app/features/owner/components/owner-billing-invoices-table/owner-billing-invoices-table.component.html`
- Added DS badge/table component token scaffolding:
  - Added badge/table token variables and `.ds-badge*` / `.ds-table*` classes.
  - File: `src/styles/tokens/component.tokens.css`

## Table Candidate Status
- `table` is confirmed high-impact candidate (`81` directive usages).
- For zero-regression in this slice, `appTable*` directive host classes were kept unchanged.
- DS table token/class scaffolding was added and will be adopted incrementally in next slice.

## Validation
- `npm run vr:test -- --grep "owner-billing \| brand \| desktop"` ✅ (`1 passed`)
- `npm run build` ✅
- Baseline updated for tiny approved primitive diff:
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-billing-brand-desktop-linux.png`

