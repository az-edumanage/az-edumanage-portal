# Architecture Categorization Audit

## Scope
- Workspace: `src/app`
- Focus: `features/owner` categorization against `STRUCTURE.md`
- Date: 2026-04-21

## Categorization Result

### 1) Shared (Domain-Agnostic)
- Located in `src/app/shared/*`
- Reusable primitives/directives/pipes/utils/types/validators are centralized.

### 2) Feature Reusable Components (Owner)
- Located in `src/app/features/owner/components/*`
- Folder-per-component convention is applied for owner reusable components.

### 3) Feature Data/State Boundaries (Owner)
- Domain models: `src/app/features/owner/models/*`
- Data-access: `src/app/features/owner/data-access/*`
- State/facades: `src/app/features/owner/state/*`

### 4) Route-Level Feature Pages (Owner)
- Route pages are currently split into two buckets:
  - New/target placement: `src/app/features/owner/pages/*`
  - Legacy-but-active placement: `src/app/features/owner/owner-*`

## Compliance Status vs STRUCTURE.md
- `components are clearly categorized as shared/native/feature`: PASS
- `codebase matches STRUCTURE.md` strictly: PARTIAL

Reason for partial:
- A set of route-level owner pages still live under `features/owner/owner-*` rather than `features/owner/pages/*`.
- These are page containers, not reusable components, so they are correctly outside `owner/components`.

## Non-Breaking Migration Recommendation
1. Keep `owner/components/*` unchanged (already correct boundary).
2. Relocate remaining `owner-*` page folders incrementally into `owner/pages/*` in small batches.
3. After each batch: update route imports, run lint/test/build, and verify deep links.
4. Avoid any HTML/CSS edits during relocation; move files and fix imports only.
