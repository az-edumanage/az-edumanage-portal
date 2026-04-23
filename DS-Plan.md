# Design System Migration Plan (Zero Regression)

## 1) Mission
Build an enterprise-grade Design System on top of the current Angular + Tailwind + Angular Material stack, while keeping all existing UI behavior, layout, and visual output stable during migration.

## 2) Core Goals
- Unify all styling decisions under a single token-driven system.
- Support scalable theming (light, dark, future brand themes) without per-feature CSS drift.
- Standardize reusable UI primitives and patterns.
- Enforce consistency with linting, review rules, and CI checks.
- Achieve migration with incremental, reversible, low-risk changes.

## 3) Non-Negotiable Safety Rules
- No intentional visual changes during architectural migration phases.
- No raw hardcoded color values in feature-level code once tokenized equivalents exist.
- No one-off spacing/typography overrides that bypass DS tokens.
- No breaking selector/class contracts used by existing pages unless migration compatibility is provided.
- Every DS change must pass visual regression and functional smoke checks.
- Keep each PR small and scoped (single domain: tokens, one primitive family, one feature slice, etc.).
- Use alias/backward-compatibility layers before deleting legacy style paths.

## 4) Technical Direction
- Token model:
  - Reference tokens: raw values (palette, spacing scale, font families, radii, shadows, motion).
  - Semantic tokens: meaning-based tokens (`--color-text-primary`, `--surface-default`, etc.).
  - Component tokens: per-component tokens (`--btn-primary-bg`, `--card-border`, etc.).
- Theme strategy:
  - Root theme classes (`.theme-light`, `.theme-dark`) at app shell level.
  - Semantic tokens resolve differently per theme scope.
- Framework integration:
  - Tailwind utilities should map to semantic tokens through CSS variable bindings.
  - Angular Material theme setup should consume the same semantic layer.

## 5) Architecture Rules
- Single source of truth: `src/styles/tokens/*`.
- Feature code consumes semantic/component tokens, not raw palette values.
- Shared UI primitives live under `src/app/shared/ui/*` and remain business-agnostic.
- Feature components can style layout, but must use DS tokens for visual properties.
- Token names must be stable, clear, and domain-neutral.
- DS documentation route remains available and updated with every primitive/token addition.

## 6) Migration Phases
1. Baseline + safety net
2. Token foundation
3. Tailwind and Material alignment
4. Primitive standardization
5. Feature adoption
6. Hardening

## 7) Definition of Done (Program Level)
- 100% critical views pass visual comparison in light/dark themes.
- Design tokens are centralized and documented.
- Angular Material + Tailwind styles are both driven by the DS token model.
- Shared primitives cover repeated UI patterns.
- Lint/CI prevents token bypass and style drift.
- Legacy style compatibility shims are removed only after full adoption.

## Current Execution Status
- Epic 5 slices are completed through Slice 07.
- Epic 6 Owner Slice 01 is completed (`/owner/provisioning/settings`).
- Epic 6 Owner Slice 02 is completed (`/owner/plans/create`).
- Epic 6 Owner Slice 03 is completed (`/owner/tenants`).
- Epic 6 Owner Slice 04 is completed (`/owner/tenants/create`).
- Epic 6 Owner Slice 05 is completed (`/owner/tenants/:id`).
- Epic 6 Owner Slice 06 is completed (`/owner/tenants/:id/edit`).
- Epic 6 Owner Slice 07 is completed (`/owner/users`).
- Epic 6 Owner Slice 08 is completed (`/owner/plans`).
- Epic 6 Owner Slice 09 is completed (`/owner/billing`).
- Epic 6 Owner Slice 10 is completed (`/owner/subscriptions`).
- Epic 6 Owner Slice 11 is completed (`/owner/subscriptions/orders`).
- Epic 6 Owner Slice 12 is completed (`/owner/subscriptions/templates`).
- Epic 6 Owner Slice 13 is completed (`/owner/subscriptions/templates/:id`).
- Epic 6 Owner Slice 14 is completed (`/owner/subscriptions/:id`).
- Epic 6 Owner Slice 15 is completed (`/owner/subscriptions/create`).
- Epic 6 Owner Slice 16 is completed (`/owner/overview`).
- Epic 6 Owner Slice 17 is completed (`/owner/analytics`).
- Epic 6 Owner Slice 18 is completed (`/owner/compliance`).
- Epic 6 Owner Slice 19 is completed (`/owner/settings`).
- Epic 6 Owner Slice 20 is completed (`/owner/security`).
- Epic 6 Owner Slice 21 is completed (`/owner/notifications`).
- Epic 6 Owner Slice 22 is completed (`/owner/modules`).
- Epic 6 Owner Slice 23 is completed (`/owner/integrations`).
- Epic 6 Tenant Slice 01 is completed (`/tenant/teachers`).
- Epic 6 Tenant Slice 02 is completed (`/tenant/schedule`).
- Epic 6 Tenant Slice 03 is completed (`/tenant/rooms/create`).
- Epic 6 Tenant Slice 04 is completed (`/tenant/grades`).
- Epic 6 Teacher Slice 01 is completed (`/teacher/schedule`).
- Epic 6 Teacher Slice 02 is completed (`/teacher/messages`).
- Epic 6 Teacher Slice 03 is completed (`/teacher/media`).
- Feature Adoption Cleanup 01 is completed (duplicate one-off style patterns reduced on impacted migrated routes).
- Safety Net Checklist 01 is completed (`docs/manual-smoke-checklist.md`).
- Feature Adoption Closeout 01 is in progress (`docs/ds-feature-adoption-owner-closeout-01.md`).
- Feature Adoption Closeout 02 is completed for `owner-module-details` (`docs/ds-feature-adoption-owner-closeout-02.md`).
- Feature Adoption Closeout 03 is completed for `owner-settings` icon utility extraction (`docs/ds-feature-adoption-owner-closeout-03.md`).
- Feature Adoption Closeout 04 is completed for `owner-settings` non-layout text utility extraction (`docs/ds-feature-adoption-owner-closeout-04.md`).
- `owner-tenant-details` closeout extraction remains rollback-protected pending parity-safe strategy.
- Next active slice is Owner Closeout 01 / Slice 5 (continue parity-safe micro extractions in `owner-settings`; keep `owner-tenant-details` rollback-protected until parity-safe pattern is identified).
