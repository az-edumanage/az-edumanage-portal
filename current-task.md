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
