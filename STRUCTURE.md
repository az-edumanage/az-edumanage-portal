# Enterprise Angular Structure

```txt
src/app/
  core/                               # app-wide singletons + cross-cutting concerns
    auth/                             # auth service, token/session handling
    http/                             # interceptors, api client base, error mapping
    guards/                           # auth/role/feature guards
    layout/                           # shell-level layout primitives (if globally owned)
    config/                           # runtime/app config
    services/                         # global services only (non-feature)

  shared/                             # domain-agnostic reusable building blocks
    ui/                               # button/card/table primitives, shared presentational components
    directives/                       # generic directives (clickOutside, autofocus, etc.)
    pipes/                            # generic pipes (date/currency/text helpers)
    utils/                            # pure helper functions
    types/                            # shared types/contracts
    validators/                       # reusable validators

  features/                           # vertical business slices
    owner/
      pages/                          # route-level smart components
      components/                     # owner-only presentational/reusable components
      data-access/                    # owner API services, repositories, DTO mappers
      state/
        owner.facade.ts               # owner facade (feature API for UI)
        owner.store.ts                # signals/store/query state
      models/                         # owner domain models/types
      directives/                     # owner-specific directives
      pipes/                          # owner-specific pipes
      routes.ts                       # lazy feature routes

    tenant/
      pages/
      components/
      data-access/
      state/
        tenant.facade.ts
        tenant.store.ts
      models/
      directives/
      pipes/
      routes.ts

    teacher/
      pages/
      components/
      data-access/
      state/
        teacher.facade.ts
        teacher.store.ts
      models/
      directives/
      pipes/
      routes.ts

  app.routes.ts                       # root routes, lazy-load feature routes
  app.config.ts
```

## Component Folder Convention

All components inside `features/*/components` must use folder-per-component:

```txt
features/<feature>/components/<component-name>/
  <component-name>.component.ts
  <component-name>.component.html
  <component-name>.component.css
```

This convention is mandatory for all newly created feature components.
