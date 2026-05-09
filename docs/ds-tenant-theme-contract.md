# DS Tenant Theme Override Contract

Purpose: define a safe, incremental contract for tenant-specific branding without breaking `brand` parity.

## Scope
- Tenant themes are opt-in and class-driven.
- Default platform behavior remains `theme-brand` + `theme-tenant-default`.
- Owner/Teacher routes must never apply non-default tenant theme classes.

## Root Class Rules
- Root always carries one tenant class:
  - `theme-tenant-default` (parity fallback)
  - or `theme-tenant-<name>` (opt-in override)
- Current shipped non-default example:
  - `theme-tenant-ocean`

## Allowed Override Surface (Phase 1)
- Semantic tokens:
  - `--ds-color-primary`
  - `--ds-color-primary-hover`
- Component tokens derived from brand accents:
  - `--ds-progress-fill-bg`
  - `--ds-revenue-column-bg-hover`

## Guardrails
- Do not override layout/spacing/typography/radius/shadow tokens in tenant themes.
- Keep tenant themes additive and isolated under `.theme-tenant-*`.
- Never alter `theme-brand` baseline values when introducing tenant themes.

## Fallback Rules
- If persisted tenant theme key is missing/unknown -> use `theme-tenant-default`.
- Non-tenant roles (`owner`, `teacher`) always force `theme-tenant-default`.
- Theme mode (`light`/`dark`) remains independent from tenant theme class.

## Persistence Keys
- Platform mode: `localStorage['theme']` (`light` | `dark`)
- Tenant theme: `localStorage['tenant-theme']` (`default` | allowed theme ids)

