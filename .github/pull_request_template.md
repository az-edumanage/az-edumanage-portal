## Summary
- [ ] Briefly describe what changed.
- [ ] Link related issue/task if applicable.

## Design System Checklist (Required For UI Changes)
- [ ] I used DS semantic/component tokens for visual properties.
- [ ] I did not add new raw hex values in feature styles.
- [ ] I did not bypass semantic tokens with reference palette tokens where semantic tokens exist.
- [ ] I extracted repeated utility bundles into scoped component/route classes when touched.
- [ ] I verified impacted routes in visual regression (`npm run vr:test -- --grep "<route-key>"`).
- [ ] I ran `npm run lint`.

## Visual Validation
- [ ] Attach before/after evidence or reference updated snapshots.
- [ ] Confirm no unintended visual drift.

## Risk Notes
- [ ] List any parity risks or known follow-up items.
