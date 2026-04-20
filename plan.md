# Architecture Migration Plan

## Goal
Migrate the current codebase to the target enterprise structure in [STRUCTURE.md](/home/hussein/Public/education-center-management/STRUCTURE.md) without breaking existing layout, styling, or routes behavior.

## Non-Negotiables
- Keep current UI shell and styling direction intact.
- No destructive rewrite.
- Migrate incrementally with buildable checkpoints.
- Preserve existing URLs while moving to feature route files.

## Success Criteria
- `src/app` matches target layered structure (`core`, `shared`, `features`).
- Components are clearly classified and placed as:
  - `shared`: domain-agnostic reusable UI/behavior.
  - `native`: keep as built-in HTML/Angular Material usage where abstraction is unnecessary.
  - `feature`: domain-specific components inside feature slices.
- Routes are split by feature and lazy-loaded.
- Each feature has `pages`, `components`, `data-access`, `state`, `models`.
- No visual regressions in shell (`main-layout`, `sidebar`, `topbar`, `task-bar`).

## Phase 0: Baseline and Guardrails
1. Freeze visual contract:
   - Keep `src/styles.css` tokens and Tailwind classes unchanged.
   - Keep current shell composition unchanged.
2. Add migration branch and commit checkpoints per phase.
3. Add a smoke checklist for manual verification:
   - Owner overview, tenant overview, teacher overview.
   - Sidebar collapse/expand.
   - Theme toggle.
   - Task bar draft restore flows.

## Phase 1: Folder Skeleton and Low-Risk Moves
1. Create target directories under `src/app`:
   - `core/{auth,http,guards,layout,config,services}`
   - `shared/{ui,directives,pipes,utils,types,validators}`
   - `features/{owner,tenant,teacher}`
2. Move existing files without logic changes:
   - `layout/*` -> `core/layout/*` (keep selector names).
   - Existing global services in `core/services`.
   - Existing shared primitives remain in/under `shared`.
3. Keep app compiling after each move (import-path updates only).

## Phase 2: Route Refactor (No URL Changes)
1. Create:
   - `features/owner/routes.ts`
   - `features/tenant/routes.ts`
   - `features/teacher/routes.ts`
2. Move route definitions from `app.routes.ts` into feature route files.
3. Keep same paths and components.
4. Convert feature route loading to lazy loading from root routes.

## Phase 3: Component Classification and Placement
1. Apply classification rules:
   - Shared component: reused across 2+ domains and business-agnostic.
   - Native component: simple one-off markup using HTML/Material; no abstraction.
   - Feature component: business/domain specific UI.
2. For each large page:
   - Keep page container in `features/*/pages`.
   - Extract repeated view blocks into `features/*/components` first.
   - Promote to `shared/ui` only if cross-domain reuse is proven.
3. Do not move classes/styles that change visual output unless equivalent snapshots are verified.

## Phase 4: State + Data-Access Hardening
1. Per feature, add:
   - `state/*facade.ts`
   - `state/*store.ts` (signals-based store)
   - `data-access/*api.service.ts` / repository adapters
2. Move mock/business logic out of page components into facade/data-access.
3. Keep templates unchanged where possible.

## Phase 5: Core Platform Hardening
1. Add route guards for role/auth boundaries in `core/guards`.
2. Add HTTP interceptors in `core/http`.
3. Normalize shared types/validators/utilities usage.

## Phase 6: Stabilization and QA
1. Ensure:
   - `npm run build` passes.
   - `npm run lint` passes.
   - `npm run test` passes.
2. Run full smoke pass against all main sections.
3. Fix regressions before next phase merges.

## Rollout Strategy
- Merge one phase at a time.
- Keep PRs small (structure-only, routes-only, feature-only).
- No mixed concerns PRs (avoid structure + logic + visual in one batch).

## Risk Control
- Biggest risk: route and import churn.
- Mitigation:
  - Move files first, behavior later.
  - Preserve selectors and templates.
  - Use frequent build checks after each slice migration.
