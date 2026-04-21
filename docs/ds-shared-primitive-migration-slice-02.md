# DS Shared Primitive Migration - Slice 02

Date: 2026-04-21  
Status: Completed

## Goal
Migrate `appTable*` directives to DS table class ownership and add DS showcase coverage for standardized badge/table primitives with parity validation.

## Implemented Changes
- Migrated table directive host classes to DS-owned class names:
  - `table[appTable]` -> `ds-table`
  - `thead[appTableHeader]` -> `ds-table-header`
  - `tbody[appTableBody]` -> `ds-table-body`
  - `tr[appTableRow]` -> `ds-table-row`
  - `th[appTableHead]` -> `ds-table-head`
  - `td[appTableCell]` -> `ds-table-cell`
  - File: `src/app/shared/components/data-display/table/table.components.ts`
- Completed DS table class behavior in tokens:
  - Added DS-owned row divider rules for `ds-table-body` with dark-mode parity.
  - File: `src/styles/tokens/component.tokens.css`
- Expanded design system showcase with standardized primitive section:
  - Added `app-badge` variant examples.
  - Added `appTable*` directive demo table.
  - Files:
    - `src/app/features/design-system/design-system-showcase/design-system-showcase.component.ts`
    - `src/app/features/design-system/design-system-showcase/design-system-showcase.component.html`

## Validation
- Focused `brand` route checks:
  - `owner-billing | brand | desktop`
  - `owner-billing | brand | mobile`
  - `design-system | brand | desktop`
  - `design-system | brand | mobile`
  - Result: `4 passed`
- Build:
  - `npm run build` passed.

## Baseline Updates
- Regenerated approved baseline snapshots:
  - `tests/visual/ds-visual.spec.ts-snapshots/owner-billing-brand-desktop-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/design-system-brand-desktop-linux.png`
  - `tests/visual/ds-visual.spec.ts-snapshots/design-system-brand-mobile-linux.png`

