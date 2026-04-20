# Current Task

## Goal
Replace remaining simulated API `setTimeout` flows with data-access service methods.

## Checklist
- [x] Add owner data-access async methods for remaining owner simulated flows.
- [x] Add tenant data-access async methods for remaining tenant simulated flows.
- [x] Replace owner component-level `setTimeout` submit/fetch/health flows with service calls.
- [x] Replace tenant component-level `setTimeout` submit flows with service calls.
- [x] Run lint/build/test and update `task.md` Task 8 as complete.

## Result
- Remaining `setTimeout` usage is only UI notification timing in `owner-tenants-list` copy feedback, not API simulation.

---

# Current Task (Next)

## Goal
Add baseline unit tests for newly migrated stores/facades.

## Checklist
- [x] Add store unit tests for:
  - `owner-tenant-create.store`
  - `tenant-group-create.store`
  - `owner-subscription-orders.store`
- [x] Add facade unit tests for:
  - `owner-tenant-create.facade`
  - `tenant-group-create.facade`
  - `owner-subscription-orders.facade`
- [x] Run test suite and update `task.md` quality gate progress.

---

# Current Task (Next)

## Goal
Prepare manual verification artifacts for remaining open checks.

## Checklist
- [x] Create shell/theme/taskbar manual smoke checklist document.
- [x] Create deep-link verification matrix document.
- [x] Mark corresponding documentation task in `task.md`.

---

# Current Task (Next)

## Goal
Automate key verification checks for shell behavior and route deep-links.

## Checklist
- [x] Add route deep-link verification test matrix (`app.routes.spec.ts`).
- [x] Add shell-state unit tests for dashboard/task services.
- [x] Run test/lint/build and stabilize test environment mocks.
- [x] Mark Task 3 and Task 4 verification items as complete in `task.md`.

---

# Current Task (Next)

## Goal
Harden shared/native boundaries with an explicit candidate audit (no visual/layout changes).

## Checklist
- [x] Create a reusable UI candidate matrix from current templates.
- [x] Mark abstraction candidates only where repeated across multiple pages/features.
- [x] Keep one-off UI controls explicitly documented as native-first.
- [x] Update `task.md` for the completed architecture-hardening checklist item.

---

# Current Task (Next)

## Goal
Start non-breaking shared primitive adoption for repeated markup (pilot scope).

## Checklist
- [x] Select first safe duplicate target set (pagination/reset patterns) from candidate matrix.
- [x] Implement one shared primitive pilot without changing existing visual output.
- [x] Apply pilot primitive in at least 3 pages with identical markup pattern.
- [x] Run visual/manual regression check for affected pages and update `task.md`.

---

# Current Task (Next)

## Goal
Normalize existing shared primitives boundary (`button`, `card`, `badge`, `table`) without changing styling.

## Checklist
- [x] Audit current usage footprint of shared button/card/badge/table primitives.
- [x] Define minimal normalization actions needed (naming/export/location only, no visual changes).
- [x] Apply non-breaking normalization patches.
- [x] Run lint/test/build and update `task.md` relevant open items.

---

# Current Task (Next)

## Goal
Close pending visual regression checklist items for owner/tenant/teacher shell and page style parity.

## Checklist
- [x] Validate owner dashboard/layout parity against baseline.
- [x] Validate tenant dashboard/layout parity against baseline.
- [x] Validate teacher dashboard/layout parity against baseline.
- [x] Validate sidebar/topbar/theme/form/table/badge styling parity.
- [x] Mark Task 12 and Definition of Done items that are fully verified.

---

# Current Task (Next)

## Goal
Close remaining migration gaps in state/data-access and final structure compliance.

## Checklist
- [x] Migrate `owner-tenants-list` view-model/data from component into `data-access + store + facade`.
- [x] Migrate next large page VM/data orchestration out of component (completed: `tenant-users`).
- [x] Migrate additional large page VM/data orchestration out of component (completed: `tenant-students`).
- [ ] Complete Task 7 pending items (`view-model derivations`, `facade UI APIs`) for remaining large components.
- [ ] Complete Task 8 pending item (move remaining mock arrays/submit handlers from pages).
- [ ] Validate and close Definition of Done: structure compliance + shared/native/feature categorization.
- [ ] Run final lint/test/build and mark remaining checklist items complete.
