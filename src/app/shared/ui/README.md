# Shared UI

Place domain-agnostic reusable UI primitives here.

Rules:
- Reuse across 2+ features before promoting a component to this layer.
- Keep business logic out of shared UI.
- Preserve current visual language and tokens.
- Naming convention:
  - Keep existing selectors unchanged (`app-button`, `app-card`, `app-badge`) to avoid breakage.
  - New shared primitives should use the project selector prefix (`app-*`) and folder-first naming.
  - File names stay kebab-case and colocated (`shared/ui/<primitive>/<primitive>.component.*`).

Current shared/ui primitives:
- `app-pager-button`: non-business pagination edge button wrapper for repeated previous/next controls.
