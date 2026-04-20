# AGENT.md

## Purpose
This document defines the mandatory implementation rules for this Angular project.  
All generated, updated, or refactored code must follow these instructions strictly.

---

## Mandatory Rules

### 1) Component File Separation
Every Angular component **must** use separate files:

- `component-name.component.ts`
- `component-name.component.html`
- `component-name.component.css` or `component-name.component.scss`

### Forbidden
Do **not** use:
- inline templates
- inline styles
- large template strings inside `.ts`
- component-local styling when it belongs to the shared theme

---

## 2) Edit in the Correct File Only
When adding or modifying functionality:

- always locate the **existing target file**
- update the code in its **correct dedicated file**
- do not place HTML inside TypeScript files
- do not place CSS inside TypeScript files
- do not place unrelated logic in the wrong feature/module

### Required behavior
Before making any change:
1. identify the feature
2. identify the exact page/component/service/store/model file
3. place each piece of code in its proper file

Example:
- UI markup → `.html`
- styling → `.css` / `.scss`
- logic → `.ts`
- routes → `*.routes.ts`
- models/interfaces → `models/`
- facade/api calls → `services/` or the approved application layer

---

## 3) Respect the Existing Theme
Always use the existing design system and theme tokens.

### Must use
- existing theme variables
- shared utility classes already approved in the project
- existing spacing, radius, typography, and color system
- existing reusable UI patterns

### Forbidden
Do **not**:
- invent random colors
- hardcode spacing inconsistently
- add one-off styles when an existing theme style already exists
- break visual consistency between pages

If a style already exists in the theme or shared UI, reuse it instead of creating a new variation.

---

## 4) Reuse Existing Components First
Before creating any new component, always check whether an existing reusable component already solves the need.

### Must reuse when available
- shared UI components
- status badge components
- KPI/stat cards
- table wrappers
- filter bars
- form field components
- modal/dialog components
- layout wrappers
- alert/empty/loading components

### Rule
If an existing component can be reused with small configuration changes, **reuse it** instead of creating a duplicate.

---

## 5) Use the Existing Facade Pattern
Pages and smart containers must interact through the existing facade pattern.

### Required
Use:
- facade for orchestration
- api service for HTTP/data access
- store/state for feature state
- presentational components for rendering only

### Forbidden
Do **not**:
- put raw HTTP calls directly inside page components
- put business orchestration directly inside presentational components
- bypass the facade if the feature already uses one
- duplicate state handling across components

### Expected flow
`Page/Container -> Facade -> Store/API Service`

---

## 6) Follow the New Project Structure
All work must respect the approved Angular production structure.

## Standard Structure
```text
src/
└── app/
    ├── core/
    ├── shared/
    ├── features/
    │   ├── auth/
    │   ├── owner/
    │   └── client/
    ├── app.routes.ts
    └── app.config.ts