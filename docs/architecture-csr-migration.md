# Architecture Migration: SSR to CSR

Date: 2026-04-21

## Goal
Switch project build/runtime configuration from Angular SSR mode to CSR-only mode.

## Implemented Changes
- Updated `angular.json` build options to CSR-only:
  - removed `server: "src/main.server.ts"`
  - removed `outputMode: "server"`
  - removed `ssr.entry: "src/server.ts"`
- Updated `package.json` scripts:
  - removed `serve:ssr:app`
  - kept client scripts (`start`, `dev`, `build`) unchanged

## Result
- `ng build` now produces browser CSR bundles only.
- No SSR server bundle/runtime entry is required for local run or CI checks.

## Validation
- `npm run build -- --configuration development` passes after migration.

## Notes
- SSR source files are currently still present in `src/` but are no longer wired in Angular build options.
- Optional cleanup (future): remove unused SSR-only source files/dependencies after confirming no external runtime depends on them.
