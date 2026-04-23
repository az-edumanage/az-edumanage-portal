# Manual Smoke Checklist (DS-Sensitive)

Purpose: lightweight manual pass for interactions most likely to regress during DS/token/class extraction work.

## How To Run
- Run after UI-affecting DS changes even when snapshot tests pass.
- Validate in both `desktop` (`1440x900`) and `mobile` (`390x844`) where marked.
- Validate at least `brand` and one of `light`/`dark`; include both for theme-related changes.

## Shell / Navigation
- [ ] Sidebar collapse/expand behaves correctly on desktop.
- [ ] Sidebar/drawer remains usable on mobile (open/close, route navigation).
- [ ] Topbar role switch (Owner/Tenant/Teacher) changes route context correctly.
- [ ] Active nav highlight and section grouping are visually correct after role switch.
- [ ] Breadcrumb/page title area remains aligned and readable on all three roles.

## Theme / Token Semantics
- [ ] Theme toggle switches mode and persists after refresh.
- [ ] Text contrast is acceptable for primary/muted/action text on core cards/tables/forms.
- [ ] Borders, shadows, and surfaces map correctly in `brand`, `light`, and `dark`.
- [ ] Status semantics remain distinct (success/warning/danger/info) in chips/badges/labels.
- [ ] Focus states remain visible for keyboard navigation (inputs/buttons/selects/toggles).

## DS-Critical Route Interactions
- [ ] `/owner/modules`: filter pills switch states correctly; card actions/links remain aligned.
- [ ] `/owner/subscriptions/create`: dense form controls preserve spacing, labels, and validation states.
- [ ] `/tenant/grades`: grid/list mode and filter controls preserve layout parity.
- [ ] `/tenant/rooms/create`: equipment/toggle controls retain correct spacing and interaction feedback.
- [ ] `/teacher/overview` + `/teacher/schedule` + `/teacher/messages`: shared dashboard-backed UI remains visually consistent.
- [ ] `/teacher/media`: tab switch + media card controls (preview/share/delete) remain aligned and clickable.

## Form Draft / Restore
- [ ] Start owner tenant create form, navigate away, verify draft appears in task bar.
- [ ] Reopen draft and confirm values restore (including select/toggle/checkbox fields).
- [ ] Start tenant group create flow, navigate away, verify draft appears.
- [ ] Reopen tenant draft and confirm schedule/day selections restore correctly.

## Responsive / Overflow
- [ ] No clipped headers/buttons/chips on mobile for Owner/Tenant/Teacher key pages.
- [ ] Dense tables/cards scroll/stack correctly without overlapping content.
- [ ] Long labels and values truncate/wrap as designed (no layout break).

## Sign-off
- [ ] Smoke run date/time recorded in PR/task notes.
- [ ] Any accepted visual diffs documented with route + rationale.
