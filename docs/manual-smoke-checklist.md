# Manual Smoke Checklist

## Shell / Layout
- [ ] Sidebar collapse/expand toggles correctly on desktop.
- [ ] Sidebar remains usable on mobile viewport.
- [ ] Topbar actions are clickable and visible.
- [ ] Task bar displays active draft/task items.
- [ ] Navigating to a task item opens the expected route.

## Theme
- [ ] Theme toggle switches between light/dark modes.
- [ ] Theme selection persists after refresh.
- [ ] Core pages are readable in both themes (contrast/check visibility).

## Routing / Deep Links
- [ ] Directly open `/owner/overview` in address bar.
- [ ] Directly open `/owner/tenants/create`.
- [ ] Directly open `/owner/billing`.
- [ ] Directly open `/owner/subscriptions/orders`.
- [ ] Directly open `/tenant/overview`.
- [ ] Directly open `/tenant/groups/create`.
- [ ] Directly open `/teacher/overview`.

## Form / Task Restore
- [ ] Start filling owner tenant create form, navigate away, verify task appears in task bar.
- [ ] Reopen draft from task bar and verify values restored.
- [ ] Start filling tenant group create form, navigate away, verify task appears.
- [ ] Reopen draft and verify selected days and schedule configuration restored.

## Regression Focus
- [ ] Owner dashboard layout unchanged.
- [ ] Tenant dashboard layout unchanged.
- [ ] Teacher dashboard layout unchanged.
- [ ] Form styling unchanged for migrated pages.
- [ ] Table and badge styling unchanged for migrated pages.
