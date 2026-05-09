# Module Details Follow-up Tasks

## Pending

1. Backend change log API for module details page (`/owner/modules/:id`).
- Add an audit/event table for module-level actions (create, update, status change, feature assignment changes).
- Expose endpoint: `GET /api/v1/module-catalog/modules/{id}/changelog`.
- Replace current Change Log placeholder in frontend with real API-driven timeline.
