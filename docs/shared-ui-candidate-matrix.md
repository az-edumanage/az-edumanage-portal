# Shared UI Candidate Matrix

Purpose: identify where shared primitives are justified by real reuse, while preserving current layout and styling direction.

## Decision Rules
- Promote to `shared/ui` only when the same structure/pattern appears in at least 3 places or across 2+ features.
- Keep domain-specific variants inside `features/*/components`.
- Keep one-off controls native in page templates.
- Do not change visual tokens, spacing, or layout behavior during extraction.

## Reuse Candidates (Promote)

1. **Secondary reset-link action**
- Pattern: `text-[10px] font-bold text-red-600 ... uppercase tracking-wider`
- Seen in: `tenant-groups`, `tenant-teachers`, `tenant-users`, `tenant-grades`, `tenant-students`, `tenant-rooms`
- Recommendation: add `UiInlineAction` variant (`danger-reset`) in `shared/ui`.

2. **Pagination edge buttons**
- Pattern: `px-3 py-1 border ... rounded hover:bg-... disabled:opacity-50`
- Seen in: `owner-tenants-list`, `owner-subscriptions-list`, `owner-audit-logs`
- Recommendation: add `UiPagerButton` primitive in `shared/ui/table`.

3. **Primary save button**
- Pattern: `px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white ...`
- Seen in: multiple save actions under `owner-settings`
- Recommendation: normalize usage via existing shared button API where no styling deviation exists.

## Keep Native (Do Not Promote Yet)

1. Editor toolbar icon controls in `owner-notification-form`.
2. Security policy inline save links in `owner-security`.
3. Feature workflow actions (`Preview`, `Manage`, `Process`) with domain semantics.
4. Feature-specific status badges with domain colors where current `app-badge` does not fully capture semantics.

## Notes
- This matrix is intentionally incremental and non-destructive.
- Apply extraction in small PR-sized steps with visual regression checks after each promoted primitive.
