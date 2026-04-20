# Migration Task Checklist

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

## 1) Foundation Tasks
- [ ] Create migration branch (`feat/architecture-restructure`).
- [ ] Add checkpoints: `phase-1`, `phase-2`, ... tags/commits.
- [ ] Capture baseline screenshots for key pages (owner/tenant/teacher overview).
- [x] Add manual smoke checklist document for shell interactions.

## 2) Target Folder Setup
- [x] Create `src/app/core/auth`.
- [x] Create `src/app/core/http`.
- [x] Create `src/app/core/guards`.
- [x] Create `src/app/core/layout`.
- [x] Create `src/app/core/config`.
- [x] Create `src/app/core/services`.
- [x] Create `src/app/shared/ui`.
- [x] Create `src/app/shared/directives`.
- [x] Create `src/app/shared/pipes`.
- [x] Create `src/app/shared/utils`.
- [x] Create `src/app/shared/types`.
- [x] Create `src/app/shared/validators`.
- [x] Create `src/app/features/owner`.
- [x] Create `src/app/features/tenant`.
- [x] Create `src/app/features/teacher`.

## 3) Shell/Layout Migration (No Visual Changes)
- [x] Move `layout/main-layout` -> `core/layout/main-layout`.
- [x] Move `layout/sidebar` -> `core/layout/sidebar`.
- [x] Move `layout/topbar` -> `core/layout/topbar`.
- [x] Move `layout/task-bar` -> `core/layout/task-bar`.
- [x] Update imports across app.
- [x] Verify collapse, theme toggle, task bar functionality.

## 4) Route Refactor Tasks
- [x] Create `src/app/features/owner/routes.ts`.
- [x] Create `src/app/features/tenant/routes.ts`.
- [x] Create `src/app/features/teacher/routes.ts`.
- [x] Move owner routes out of `app.routes.ts`.
- [x] Move tenant routes out of `app.routes.ts`.
- [x] Move teacher routes out of `app.routes.ts`.
- [x] Keep all path strings identical (no URL breaks).
- [x] Switch root routes to lazy loading.
- [x] Verify deep-link navigation for all major pages.

## 5) Component Conversion Strategy

## 5.1 Shared Components (Domain-Agnostic)
- [x] Keep/normalize `shared/ui/button`.
- [x] Keep/normalize `shared/ui/card`.
- [x] Keep/normalize `shared/components/data-display/badge`.
- [x] Keep/normalize table directives into `shared/ui/table` or `shared/directives`.
- [x] Add shared naming convention (`app-*` selector prefix + folder-first convention).
- [x] Replace duplicate button/card/table markup in at least 3 pages.
- [x] Add usage docs in `shared/ui/README.md`.

## 5.2 Native Components (Do Not Over-Abstract)
- [x] Define and document "native-first" rule:
  - Use raw HTML + Tailwind + Angular Material for one-off UI.
  - Do not create shared component unless reuse exists.
- [x] Keep one-off screen-specific controls as native in page/component templates.
- [x] Review existing raw controls and mark abstraction candidates only when reused.

## 5.3 Feature Components (Domain-Specific)
- [x] For `owner`, create:
  - [x] `features/owner/pages`
  - [x] `features/owner/components`
  - [x] `features/owner/models`
  - [x] `features/owner/state`
  - [x] `features/owner/data-access`
- [x] For `tenant`, create:
  - [x] `features/tenant/pages`
  - [x] `features/tenant/components`
  - [x] `features/tenant/models`
  - [x] `features/tenant/state`
  - [x] `features/tenant/data-access`
- [x] For `teacher`, create:
  - [x] `features/teacher/pages`
  - [x] `features/teacher/components`
  - [x] `features/teacher/models`
  - [x] `features/teacher/state`
  - [x] `features/teacher/data-access`

## 6) High-Priority Feature Page Splits
  - [x] Split `owner-billing` page:
  - [x] Keep container in `features/owner/pages/owner-billing`.
  - [x] Extract filter panel to `components`.
  - [x] Extract each tab table to `components`.
  - [x] Move data logic to facade/data-access.
  - [x] Split `owner-tenant-create` page:
  - [x] Extract dropdown/select blocks to `components`.
  - [x] Move submit logic to facade.
  - [x] Split `tenant-group-create` page:
  - [x] Extract schedule section and selectors to `components`.
  - [x] Move draft/task restore flow to facade.
  - [x] Split `owner-subscription-orders-list` page into page + table/filter/modals components.

## 7) State and Facade Tasks
- [x] Create `features/owner/state/owner.facade.ts`.
- [x] Create `features/owner/state/owner.store.ts`.
- [x] Create `features/tenant/state/tenant.facade.ts`.
- [x] Create `features/tenant/state/tenant.store.ts`.
- [x] Create `features/teacher/state/teacher.facade.ts`.
- [x] Create `features/teacher/state/teacher.store.ts`.
- [~] Move view-model derivations from large components into stores/computed selectors.
- [~] Expose UI-friendly APIs from facades only.

## 8) Data-Access Tasks
- [x] Create owner repositories/services in `features/owner/data-access`.
- [x] Create tenant repositories/services in `features/tenant/data-access`.
- [x] Create teacher repositories/services in `features/teacher/data-access`.
- [~] Migrate mock arrays and submit handlers out of page components.
- [x] Replace `setTimeout` simulated calls with facade repository methods.

## 9) Core Hardening Tasks
- [x] Add `core/guards/role.guard.ts`.
- [x] Add route-level role metadata.
- [x] Add `core/http` interceptors (auth, error normalization).
- [x] Move platform-wide config to `core/config`.

## 10) Shared Utilities Cleanup
- [x] Replace placeholder `shared/*/index.ts` files with real exports.
- [x] Centralize reusable validators in `shared/validators`.
- [x] Centralize reusable pure helpers in `shared/utils`.
- [x] Centralize common shared types in `shared/types`.

## 11) Quality Gates
- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run test -- --watch=false`
- [x] Fix existing lint error(s) before continuing.
- [x] Add at least one unit test per migrated facade/store.

## 12) Visual Regression Checklist
- [x] Owner dashboard layout unchanged.
- [x] Tenant dashboard layout unchanged.
- [x] Teacher dashboard layout unchanged.
- [x] Sidebar behavior unchanged.
- [x] Topbar actions unchanged.
- [x] Dark/light theme unchanged.
- [x] Form styling unchanged.
- [x] Tables and badges styling unchanged.

## 13) Definition of Done
- [ ] Codebase matches `STRUCTURE.md`.
- [ ] Components are clearly categorized as shared/native/feature.
- [x] No broken routes.
- [x] No shell/layout/style regressions.
- [x] Build/lint/test green.
