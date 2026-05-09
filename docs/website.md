# Website Dashboard Plan and Content Inventory

Operational run commands and URL mapping are documented in `docs/website-runbook.md`.

## Scope
Build `Owner > Web Settings` in `/home/hussein/Public/education-center-management` to control content/configuration of the official website project at `/home/hussein/Public/remix_-edumanage-pro`, using the current backend (`/home/hussein/Public/be-edu`) as source of truth.

This document includes:
- Full phased implementation plan
- Backend design (tables, APIs, security)
- Frontend structure (pages/components/facade/data-access)
- Data flow (Owner Dashboard <-> Backend <-> Website)
- Step-by-step execution plan
- Extracted existing hardcoded/mock website data (to seed later)

---

## Full Plan (Phases)

### Phase 1: Foundation and Content Model
1. Define a normalized `website_content` domain in backend for:
- navigation
- hero
- feature cards
- pricing/plans
- testimonials
- CTA blocks
- footer
- legal/static pages metadata
2. Add multilingual fields (`en`, `ar`) where needed.
3. Add publish model: draft vs published.
4. Add versioning/audit trail for changes.

### Phase 2: Backend APIs and Security
1. Implement read APIs for public website (published only).
2. Implement owner-only management APIs for Web Settings (draft CRUD + publish).
3. Add validation and deterministic ordering.
4. Add role checks (`SUPER_ADMIN`, `OWNER`) for management endpoints.

### Phase 3: Web Settings Dashboard UI
1. Replace scaffold in `owner-web-settings` with sectioned editor:
- Navigation
- Home Hero
- Home Features
- Pricing
- Testimonials
- CTA
- Footer
- Static Pages metadata
2. Add table/forms/reorder/toggle for each section.
3. Add draft save/publish actions with status modal + loader.

### Phase 4: Website Integration
1. Refactor `remix_-edumanage-pro` to fetch content from backend public API.
2. Keep hardcoded constants only as local fallback during migration.
3. Wire route pages to dynamic content by section key.

### Phase 5: Seeding and Migration
1. Seed backend with exact extracted data in this file.
2. Verify rendered output matches current website text/order/flags.
3. Remove old hardcoded content from website project after verification.

### Phase 6: QA and Hardening
1. Backend tests for CRUD/order/publish/permissions.
2. Frontend tests for rendering and empty states.
3. End-to-end checks from Owner Web Settings to public website.

---

## Backend Design

### Data Model (proposed)

#### `ws_section`
- `id` (uuid, pk)
- `key` (varchar, unique) e.g. `home.hero`, `home.features`, `home.pricing`, `global.nav`, `global.footer`
- `title` (varchar)
- `description` (varchar null)
- `content_type` (varchar) e.g. `object`, `array`, `richtext`
- `is_active` (boolean)
- `created_at`, `updated_at`

#### `ws_section_version`
- `id` (uuid, pk)
- `section_id` (fk ws_section)
- `version_no` (int)
- `status` (varchar: `DRAFT`, `PUBLISHED`, `ARCHIVED`)
- `payload_json` (jsonb)
- `change_note` (varchar null)
- `updated_by` (fk user)
- `created_at`

#### `ws_publish_state`
- `id` (uuid, pk)
- `environment` (varchar default `production`)
- `published_version_map_json` (jsonb) // sectionKey -> versionId
- `published_at`
- `published_by` (fk user)

#### `ws_asset` (optional for media)
- `id` (uuid)
- `url`
- `alt_en`, `alt_ar`
- `type`
- timestamps

### API Design

#### Owner (authenticated)
- `GET /api/v1/web-settings/sections`
- `GET /api/v1/web-settings/sections/{key}` (latest draft + published snapshot)
- `PUT /api/v1/web-settings/sections/{key}` (save draft)
- `POST /api/v1/web-settings/sections/{key}/publish`
- `POST /api/v1/web-settings/publish-all`
- `GET /api/v1/web-settings/history/{key}`

#### Public website (read-only)
- `GET /api/v1/web-content/{key}` (published)
- `GET /api/v1/web-content/bundle?keys=global.nav,home.hero,...`

### Validation
- enforce required keys per section schema
- enforce stable ordering field for arrays
- enforce unique nav labels per locale where needed
- enforce price fields numeric and >= 0

### Security
- Owner APIs require JWT + role in (`SUPER_ADMIN`, `OWNER`)
- Public APIs anonymous read, published data only
- Audit: each draft update and publish event recorded with actor/time

---

## Frontend Structure (Owner Dashboard)

### Route
- `/owner/settings/web-settings`

### Feature folder proposal
- `src/app/features/owner/pages/owner-web-settings/`
- `src/app/features/owner/components/website-settings/*`
- `src/app/features/owner/data-access/website-settings-api.service.ts`
- `src/app/features/owner/domain/website-settings.facade.ts`

### UI Components
- `web-settings-shell`
- `web-settings-nav-editor`
- `web-settings-hero-editor`
- `web-settings-features-editor`
- `web-settings-pricing-editor`
- `web-settings-testimonials-editor`
- `web-settings-footer-editor`
- `web-settings-publish-bar`

### Facade Responsibilities
- load section drafts + published snapshots
- track dirty state per section
- save draft
- publish single/all
- expose loading/success/error signals

### Data-access responsibilities
- strict request/response DTO mapping
- error normalization for toast/modal display

---

## Data Flow

1. Owner edits content in `/owner/settings/web-settings`.
2. Dashboard sends `PUT /web-settings/sections/{key}` to save draft.
3. Backend stores new version in `ws_section_version` with `DRAFT`.
4. On publish, backend marks chosen versions in `ws_publish_state`.
5. Public website fetches `GET /web-content/bundle` and renders published JSON.
6. Any new publish is visible immediately on website next fetch cycle.

---

## Step-by-Step Execution Plan

1. Create DB migrations for `ws_section`, `ws_section_version`, `ws_publish_state`.
2. Add seed migration containing extracted content in this document.
3. Build backend entities/repos/services/controllers for owner + public APIs.
4. Add role guards and audit logging.
5. Implement owner Web Settings dashboard UI sections with form validation.
6. Add save draft + publish workflows with loader/status modal.
7. Refactor website project to consume public content bundle endpoints.
8. Remove hardcoded constants only after parity verification.
9. Run tests and build checks in backend/frontend.

---

## Extracted Existing Website Data (Hardcoded/Mock)
Source: `/home/hussein/Public/remix_-edumanage-pro/src/app/*`

### 1) Routes
```json
[
  {"path":"","component":"Home"},
  {"path":"customizer","component":"Customizer"},
  {"path":"login","component":"Login"},
  {"path":"signup","component":"Signup"},
  {"path":"onboarding","component":"Onboarding"},
  {"path":"trial-dashboard","component":"TrialDashboard"},
  {"path":"features","component":"FeatureDetail"},
  {"path":"terms","component":"Terms"},
  {"path":"help","component":"HelpCenter"},
  {"path":"about","component":"About"}
]
```

### 2) Home page data (`home.ts` + `home.html`)

#### 2.1 Hero
```json
{
  "badge":"New Version 4.0",
  "title":"All-in-One Platform for Educational Centers",
  "description":"Institutional modernism meets effortless automation. Manage student performance, teacher subscriptions, and complex logistics through a single, frictionless interface.",
  "primaryCta":"Start Free Trial",
  "secondaryCta":"Explore Features"
}
```

#### 2.2 Promo banner
```json
{
  "icon":"campaign",
  "text":"Seasonal Offer: Get 30% off on Enterprise annual plans before September 1st.",
  "cta":"Claim Discount"
}
```

#### 2.3 Feature cards
```json
[
  {"icon":"domain","title":"Center Management","description":"Centralize administrative tasks with automated workflows and branch oversight."},
  {"icon":"person_pin","title":"Teacher Subscriptions","description":"Manage faculty billing, attendance, and professional development portals."},
  {"icon":"family_restroom","title":"Parent Portal","description":"Frictionless communication between home and school with real-time updates."},
  {"icon":"school","title":"Advanced LMS","description":"Dynamic content delivery with support for multimedia and interactive learning."},
  {"icon":"quiz","title":"Question Bank","description":"Vast repository of assessment items with automated exam generation features."},
  {"icon":"payments","title":"Finance & Payments","description":"Secure, integrated payment processing for tuition and administrative fees."},
  {"icon":"hub","title":"Multi-Branch","description":"Unified dashboard for managing multiple locations and franchises globally."},
  {"icon":"analytics","title":"Bloom's Taxonomy","description":"Deep performance analytics mapping student progress to cognitive levels."}
]
```

#### 2.4 How it works
```json
[
  {"step":"01","title":"Create Account","description":"Simple, secure onboarding for your primary institutional admin."},
  {"step":"02","title":"Choose Plan","description":"Select the module density that fits your center's specific needs."},
  {"step":"03","title":"Setup Center","description":"Import data, customize branding, and invite your core teaching staff."},
  {"step":"04","title":"Start Managing","description":"Unleash the full potential of automated academic administration."}
]
```

#### 2.5 Integrations section
```json
{
  "title":"Seamless Data Ecosystem",
  "description":"Connect with the tools your team already loves. Our real-time sync ensures that every department—from finance to faculty—is working with the same version of the truth.",
  "items":["Institutional Email","Finance Integration","Global Calendar"],
  "bullets":["Open API for custom integrations","Zero-latency real-time database","High-security enterprise encryption"]
}
```

#### 2.6 Pricing cards
```json
[
  {
    "name":"Basic",
    "subtitle":"For startup centers",
    "price":"$99/mo",
    "features":["Up to 50 Students","Basic LMS","Attendance Tracker"],
    "excluded":["Finance Management"],
    "cta":"Select Basic"
  },
  {
    "name":"Pro",
    "subtitle":"For established institutions",
    "price":"$249/mo",
    "badge":"Recommended",
    "features":["Unlimited Students","Parent Portal Access","Advanced Bloom's Analytics","Finance & Payments"],
    "cta":"Get Started with Pro"
  },
  {
    "name":"Enterprise",
    "subtitle":"For educational networks",
    "price":"Custom",
    "features":["Multi-Branch Control","API & Webhook Access","Dedicated Account Manager","24/7 Priority Support"],
    "cta":"Contact Sales"
  }
]
```

#### 2.7 Custom plan CTA block
```json
{
  "title":"Need a bespoke solution?",
  "description":"Build your own plan by selecting only the modules you need.",
  "cta":"Build Your Plan",
  "link":"/customizer"
}
```

#### 2.8 Testimonials
```json
[
  {
    "quote":"The transition to EduManage Pro was the single best decision for our multi-branch center. The clarity in data reporting is unparalleled.",
    "author":"Dr. Elena Rodriguez",
    "role":"Director, Global Arts Academy",
    "avatar":"https://lh3.googleusercontent.com/aida-public/AB6AXuC9AIqrYtE-D-WRb7wyW1AQWIpWRaUk7GN-iHHOSseOHfgKD-dz7j2SNwopw3rMIsMX8uHsryOdWSLPFxSTqnjYdf7y2Jhk3EPCZqkhRbU12L3DxtGATticYsY4hr8y4dFMnq_KkjLxEQtvPamNIaUOce5_yg5cdxPGiZ6Pu20US37YkVyDJMdbcz2nD8Dx7oPsdVZUANCGs-DQ4SlfZYTmXhNG3j11IzjC65XQe2u_kllXCPTWo-YHc-yhPOskQIa4ZCtzppOhopo"
  },
  {
    "quote":"As a parent, the portal is incredibly intuitive. I love having real-time visibility into my child's performance and bloom's metrics.",
    "author":"Marcus Chen",
    "role":"Parent & Tech Executive",
    "avatar":"https://lh3.googleusercontent.com/aida-public/AB6AXuAFEyG7Z72QY762j88X_0uCspHCKFLGK3WCxbZqsouMhxrB0ifU-QLNNG5TpfP--Kd6H5NN99oFrOd08jw6tYHzla-C_fthhBsAd3N-0pT2ysnpo5jdG2DboQyRW_yKDZXDHOtj3fxONFKwacr-Yk9z-8U1LvXYEkPkJcVrufDm1iWV-OwLdRQV5ZfCGRnl2xPISBgwP0c0tyJAM3sUXSlShbhKBgZH2iis82LwpHyJsOgQ3FXugIQHCFV4yHGsc37DhO4AW3wZqkc"
  },
  {
    "quote":"The question bank and automated exam generation saved our faculty hundreds of hours this semester alone. Simply indispensable.",
    "author":"Sarah Jenkins",
    "role":"Head of Faculty, Science Hub",
    "avatar":"https://lh3.googleusercontent.com/aida-public/AB6AXuAW2khkhe_wI-BbDGeL5e2nmRcZO7PPrFwfNdiRvH2VZU9BcUs1pLk4hQbVT4Pk4i3QBx7G1hMwMQl4l6VqzHNjq_GjjhLhie5Lj7MdPOxB8fWgWjzZsQiu_x9l_nrKSwsCT2cHKBACmk5p9Wg2nXqn3a-vquh6wC6KmWmvINyIa5RoUXrX7oKmpI0zLjwzpCKxqui7Ls5fPfGhVf1bCocIDTDYQTDUepTh_F6XzqaJXVkvMd5bfUe5s7km3p59w0xfRpIaS9mUzRU"
  }
]
```

#### 2.9 Trial CTA
```json
{
  "title":"Start Your 14-Day Free Trial",
  "description":"No credit card required. Experience the full suite of EduManage Pro features today and transform your institution.",
  "inputPlaceholder":"Enter your work email",
  "cta":"Sign Up Now",
  "legal":"By signing up, you agree to our Terms of Service."
}
```

#### 2.10 Contact section
```json
{
  "title":"Let's Discuss Your Institution's Needs",
  "description":"Our advisors are ready to help you architect the perfect management ecosystem for your center's unique requirements.",
  "contacts":[
    {"label":"Global HQ","value":"101 Innovation Blvd, Palo Alto, CA"},
    {"label":"Phone","value":"+1 (800) EDU-PRO-1"},
    {"label":"Email","value":"advisory@edumanagepro.com"}
  ],
  "formFields":["First Name","Last Name","Institution Name","Message"],
  "cta":"Send Inquiry"
}
```

### 3) Customizer page data (`customizer.ts` + `customizer.html`)

```json
{
  "modules":[
    {"id":"sis","title":"Student Information System","description":"The core engine for managing enrollments, demographics, and academic records in a centralized repository.","price":199,"icon":"school","color":"bg-indigo-50 text-indigo-600","selected":true},
    {"id":"library","title":"Library Management","description":"Digital cataloging, automated lending workflows, and inventory tracking for physical and digital assets.","price":49,"icon":"library_books","color":"bg-emerald-50 text-emerald-600","selected":false},
    {"id":"exam","title":"Advanced Exam Module","description":"Generate dynamic question banks, automate grading, and produce complex institutional report cards.","price":89,"icon":"quiz","color":"bg-blue-50 text-blue-600","selected":true},
    {"id":"parent","title":"Parent Portal","description":"Enable real-time communication between guardians and the school. View attendance and grades instantly.","price":59,"icon":"family_restroom","color":"bg-slate-100 text-slate-800","selected":true},
    {"id":"teacher","title":"Teacher Analytics","description":"Deep data insights into classroom performance, curriculum progress, and predictive outcomes.","price":129,"icon":"analytics","color":"bg-cyan-50 text-cyan-600","selected":false},
    {"id":"finance","title":"Finance & Payments","description":"Automated fee collection, payroll processing, and end-to-end financial reporting.","price":149,"icon":"payments","color":"bg-blue-600 text-white","selected":false}
  ],
  "staticItems":{
    "hosting":"Cloud Hosting (Included)",
    "hostingPrice":"FREE",
    "sidebarTitle":"Your Configuration",
    "summaryLabel":"Estimated Monthly Total",
    "annualSavingsLabel":"Annual Savings",
    "cta":"Start Free Trial with Custom Plan",
    "testimonial":"Revolutionized our administrative workflow within 3 months.",
    "testimonialBy":"Dr. Sarah Chen, St. Peter's Academy"
  }
}
```

### 4) Onboarding and trial mock data (`onboarding.ts`, `trial-dashboard.ts`)

```json
{
  "onboardingPlans":[
    {"id":"basic","name":"Basic","price":"$99/mo","tag":"Startup"},
    {"id":"professional","name":"Professional","price":"$249/mo","tag":"Most Popular"},
    {"id":"enterprise","name":"Enterprise","price":"Custom","tag":"Full Power"}
  ],
  "provisioningTasks":[
    {"label":"Creating workspace","status":"pending"},
    {"label":"Configuring trial plan","status":"pending"},
    {"label":"Preparing demo data","status":"pending"},
    {"label":"Securing dashboard access","status":"pending"},
    {"label":"Activating subdomain","status":"pending"}
  ],
  "demoFillValues":{
    "fullName":"Dr. Sarah Jenkins",
    "phoneNumber":"+1 (555) 000-0000",
    "subdomain":"edu-trial-v42",
    "username":"sarah.jenkins",
    "password":"Password123!",
    "confirmPassword":"Password123!",
    "plan":"professional"
  },
  "trialDashboardDefaults":{
    "institutionName":"Sterling Academy of Arts",
    "supportEmail":"support@sterling.edu",
    "timezone":"UTC -5 (Eastern Time)",
    "apiEnabled":true,
    "brandColor":"#4f46e5"
  },
  "trialUserDefaults":{
    "fullName":"Alexander Sterling",
    "username":"asterling_admin",
    "phoneNumber":"+1 (555) 012-3456",
    "subdomain":"academy.edumanagepro.com",
    "status":"Trial Active",
    "planName":"Pro Trial",
    "planPrice":"$249/mo"
  },
  "trialPlanMap":{
    "basic":{"name":"Basic Trial","price":"$99/mo"},
    "professional":{"name":"Pro Trial","price":"$249/mo"},
    "enterprise":{"name":"Enterprise Trial","price":"Custom"}
  },
  "trialFeatures":[
    "Up to 50 branches",
    "Advanced analytics",
    "Parent portal",
    "LMS access",
    "Question bank",
    "API integrations"
  ],
  "trialSetupSteps":[
    {"label":"Account Created","description":"Completed Aug 31, 2026","status":"completed"},
    {"label":"Domain Verified","description":"Completed Sept 01, 2026","status":"completed"},
    {"label":"Add Payment Method","description":"Required for transition","status":"current"},
    {"label":"Configure LMS","description":"Optional step","status":"pending"}
  ]
}
```

### 5) Global navigation links (observed)

```json
{
  "brand":"EduManage Pro",
  "mainLinksVariants":[
    ["Features","Pricing","About Us","Contact Us","News"],
    ["Features","How It Works","Pricing","Integrations","Testimonials"]
  ],
  "authCtas":["Login","Start Free Trial"]
}
```

### 6) Footer links/content (observed)

```json
{
  "brand":"EduManage Pro",
  "tagline":"Institutional Modernism for Global Education. Empowering the next generation of academic leaders.",
  "columns":{
    "Product":["LMS","Analytics","Finance"],
    "Solutions":["Private Centers","Franchises","Universities"],
    "Company":["About Us","Careers","News"],
    "Support":["Help Center","Documentation","API Reference","Status"]
  },
  "legalLinks":["Privacy Policy","Terms of Service"],
  "copyrightVariants":[
    "© 2026 EduManage Pro. Institutional Modernism for Global Education.",
    "© 2024 EduManage Pro. Institutional Modernism for Global Education."
  ]
}
```

### 7) Other static pages content inventory

#### `about.html`
- hero badge: `Our Mission`
- hero title: `Architecting the Future of Academic Excellence.`
- story section heading: `Born from Necessity`
- values: `Institutional Integrity`, `Radical Simplicity`, `Global Accessibility`
- stats: `450+ Partnerships`, `2.4M Students Managed`, `99.9% System Uptime`

#### `help-center.html`
- hero title: `How can we help?`
- search placeholder: `Search for guides, tutorials, and more...`
- categories: `Getting Started`, `Billing & Finance`, `Account Security`
- FAQ questions:
  - `How secure is my institutional data?`
  - `Can I migrate data from my current system?`
  - `What happens after my 14-day trial?`
- support CTA: `Still need help?`

#### `terms.html`
- header: `Terms & Conditions`
- last updated text: `Last updated: May 2, 2026`
- sections:
  - `1. Acceptance of Terms`
  - `2. User Accounts`
  - `3. SaaS Subscription & Trial`
  - `4. Data Privacy & Institutional Records`
  - `5. Limitation of Liability`
- contact email: `legal@edumanage.pro`

#### `feature-detail.html`
- article header label: `Platform Core`
- title: `Institutional Modernism: Redefining Academic Administration`
- sections:
  - `Unified Intelligence Layer`
  - `Institutional Finance & Grant Tracking`
  - `Student Outcome Prediction`
- bottom CTA: `Experience the Future of Education`

#### `login.html` and `signup.html`
- static marketing blocks + SSO buttons (`Google`, `Microsoft`)
- login heading: `Welcome Back`
- signup heading: `Create your account`

---

## Notes for seeding accuracy
- Preserve order exactly for arrays (features, testimonials, pricing items, nav/footer links).
- Preserve original casing/punctuation (including `Bloom's`, `14-day`, `No credit card required`).
- Preserve all initial `selected` flags and mock statuses.
- Keep both footer copyright variants observed in current templates.


---

## Execution Note (2026-05-02) - Phase 2 Backend

Status: Completed (backend only)

### Implemented in `/home/hussein/Public/be-edu`

1. Flyway migration added:
- `src/main/resources/db/migration/V11__create_website_settings.sql`

2. New tenant-aware structured tables created (no generic CMS blob):
- `ws_site_config`
- `ws_page_config`
- `ws_home_hero`
- `ws_nav_link`
- `ws_feature_item`
- `ws_testimonial_item`
- `ws_pricing_plan`
- `ws_pricing_plan_feature`
- `ws_cta_block`
- `ws_footer_link`
- `ws_publish_state`

3. Seed data inserted from extracted `website.md` content:
- Seed tenant key used: `platform-owner`
- Seeded sections: site config, pages, hero, nav, features, testimonials, pricing (+ plan features), CTA blocks, footer links
- Initial publish state seeded as published

4. New backend module added:
- Package: `com.edu.beedu.websitesettings`
- Layered structure used:
  - `api`
  - `api.request`
  - `application`
  - `application.dto`
  - `infrastructure.persistence.entity`
  - `infrastructure.persistence.repository`

5. Explicit APIs implemented:
- Public aggregated endpoint (published website config):
  - `GET /api/v1/public/website-settings/{tenantId}`
- Owner dashboard management endpoints:
  - `GET /api/v1/owner/website-settings/{tenantId}`
  - `PUT /api/v1/owner/website-settings/{tenantId}/draft`
  - `POST /api/v1/owner/website-settings/{tenantId}/publish`

6. Security updated:
- Public endpoint permitted anonymously
- Owner endpoints restricted to roles: `SUPER_ADMIN`, `OWNER`
- File updated: `shared/security/SecurityConfig.java`

7. Validation/build verification:
- Command: `cd /home/hussein/Public/be-edu && ./mvnw -q test`
- Result: Passed, including Flyway migration up to `v11`

### Notes
- Phase 2 intentionally stopped at backend implementation only.
- No frontend implementation started yet.
- Next phase is Owner Dashboard integration (`/owner/web-settings`) after confirmation.

## Execution Note (2026-05-02) - Phase 3 Owner Dashboard

Status: Completed

### Implemented in `/home/hussein/Public/education-center-management`

1. Added Web Settings data-access service:
- `src/app/features/owner/data-access/owner-website-settings-data.service.ts`
- Wired endpoints:
  - `GET /api/v1/owner/website-settings/{tenantId}`
  - `PUT /api/v1/owner/website-settings/{tenantId}/draft`
  - `POST /api/v1/owner/website-settings/{tenantId}/publish`

2. Added Web Settings facade:
- `src/app/features/owner/state/owner-web-settings.facade.ts`
- Handles:
  - tenant resolution (`identity.tenantId` fallback to `platform-owner`)
  - loading/saving/publishing states
  - load/save/publish actions

3. Replaced `/owner/web-settings` scaffold with real editor page:
- `src/app/features/owner/pages/owner-web-settings/owner-web-settings.component.ts`
- `src/app/features/owner/pages/owner-web-settings/owner-web-settings.component.html`
- `src/app/features/owner/pages/owner-web-settings/owner-web-settings.component.css`

4. Implemented structured section editing in UI:
- Site Config
- Hero
- Pages
- Navigation
- Features
- Testimonials
- Pricing Plans (+ plan features)
- CTA Blocks
- Footer Links

5. Added required interaction behavior:
- Save Draft button
- Publish button
- Loading states on actions
- Form validation (`required` fields + `markAllAsTouched`)
- Status modal for success/failure with root-cause message parsing

### Verification
- Frontend build run:
  - `npm run build --silent`
- Result:
  - Build passed successfully
  - Existing project warnings remain (unrelated budgets/CommonJS warnings)

### Notes
- Phase 3 implemented only Owner Dashboard integration as requested.
- Public website binding (`remix_-edumanage-pro`) remains next phase.

## Execution Note (2026-05-02) - Phase 4 Website Binding

Status: In progress (core binding completed)

### Implemented in `/home/hussein/Public/remix_-edumanage-pro`

1. Added website config loader service:
- `src/app/core/website-config.service.ts`
- Loads published config from backend aggregated endpoint:
  - `GET http://localhost:18080/api/v1/public/website-settings/platform-owner`
- Exposes structured computed state for:
  - site name
  - navigation
  - hero
  - features
  - testimonials
  - pricing plans
  - CTA blocks
  - footer links

2. Added app-init loading:
- Updated `src/app/app.config.ts`:
  - added `provideHttpClient()`
  - added `APP_INITIALIZER` to load website config at startup before app render

3. Replaced hardcoded content usage on key pages:
- `src/app/home.ts` and `src/app/home.html`
  - brand/site name from backend
  - top navigation from backend (ordered + visibility)
  - hero content from backend
  - features grid from backend
  - pricing plans (+ included/excluded features) from backend
  - testimonials from backend
  - CTA blocks from backend
  - footer sections/links from backend (ordered + visibility)
- `src/app/customizer.ts` and `src/app/customizer.html`
  - brand/site name from backend
  - top navigation from backend
  - module cards now derived from backend feature catalog
  - footer sections/links from backend

4. Visibility/order handling:
- All listed dynamic lists are filtered by `visible === true`
- Sorted by `displayOrder`

### Verification
- Command: `cd /home/hussein/Public/remix_-edumanage-pro && npm run build --silent`
- Result: Build completed successfully.
- Observed warning/error during prerender:
  - `ReferenceError: localStorage is not defined`
  - This is from existing SSR-prerender behavior in other routes that read localStorage in server context (not introduced by website-settings binding).

### Remaining work for full Phase 4 completion
- Migrate remaining static pages (`login`, `signup`, `onboarding`, `trial-dashboard`, `about`, `help`, `terms`, `feature-detail`) to fully consume backend config where applicable (shared nav/footer blocks and configurable static sections).

---

## Execution Note (2026-05-02)

### Phase 4 Progress Update
- Continued backend-binding in `/home/hussein/Public/remix_-edumanage-pro` and fixed the runtime regression where nav/sections could appear empty when backend config is unavailable.
- Added safe fallback behavior in website config service:
  - `src/app/core/website-config.service.ts` now initializes with default full config and reuses fallback on load failure.
- Completed dynamic website binding for remaining pages (top nav + footer data sources):
  - `src/app/about.ts`, `src/app/about.html`
  - `src/app/help-center.ts`, `src/app/help-center.html`
  - `src/app/terms.ts`, `src/app/terms.html`
  - `src/app/feature-detail.ts`, `src/app/feature-detail.html`
  - `src/app/login.ts`, `src/app/login.html`
  - `src/app/signup.ts`, `src/app/signup.html`
  - `src/app/onboarding.ts`, `src/app/onboarding.html`
  - `src/app/trial-dashboard.ts`, `src/app/trial-dashboard.html`
- Added SSR-safe guards for localStorage access to prevent prerender crashes:
  - `src/app/onboarding.ts`
  - `src/app/trial-dashboard.ts`

### Verification
- Website build check executed in `remix_-edumanage-pro`:
  - `npm run build --silent` => **passed** (prerendered routes completed).
- Remaining output warnings are non-blocking:
  - `NG8107` optional-chain warnings in `home.html`
  - bundle size warning (`+4.01 kB` over initial budget)

### Next (remaining in Phase 4)
- Replace final static text blocks in some pages (non-data placeholders in onboarding/trial dashboard cards) if they should also be centralized in backend website settings.
- Add short polling or push-based refresh strategy for public website config if instant cross-session updates are required without refresh.

### Phase 4 Continued (2026-05-02)
- Centralized remaining onboarding/trial static content behind website config fallback model in `remix_-edumanage-pro`:
  - Added optional config blocks in `WebsiteConfigService`:
    - `onboarding` (titles, descriptions, trust badge text, provisioning labels/tasks)
    - `trialDashboard` (header texts, remaining/trial end labels, feature bullets, setup steps)
  - Merged backend payload with defaults in service load so missing new fields do not blank the UI.
- Updated pages to consume config-driven content:
  - `src/app/onboarding.ts`, `src/app/onboarding.html`
  - `src/app/trial-dashboard.ts`, `src/app/trial-dashboard.html`
- Verification:
  - `npm run build --silent` passed.
  - Non-blocking warnings remain (`NG8107` optional-chain and initial bundle budget).

### Phase 4 -> Backend Contract Extension (2026-05-02)
- Implemented backend support for additional structured website sections used by onboarding/trial pages.

#### Added backend schema (Flyway)
- Migration: `V12__add_onboarding_trial_dashboard_website_settings.sql`
- New tables:
  - `ws_onboarding_config`
  - `ws_onboarding_task`
  - `ws_trial_dashboard_config`
  - `ws_trial_feature_bullet`
  - `ws_trial_setup_step`
- Seeded `platform-owner` defaults matching website fallback values.

#### Added backend API model fields
- `WebsiteSettingsView` now includes:
  - `onboarding`
  - `trialDashboard`
- `SaveWebsiteSettingsRequest` now accepts optional structured payloads:
  - `onboarding`
  - `trialDashboard`

#### Added backend DTOs
- `OnboardingView`
- `TrialDashboardView`
- `TrialSetupStepView`

#### Added backend persistence entities/repositories
- Entities:
  - `OnboardingConfigJpaEntity`
  - `OnboardingTaskJpaEntity`
  - `TrialDashboardConfigJpaEntity`
  - `TrialFeatureBulletJpaEntity`
  - `TrialSetupStepJpaEntity`
- Repositories:
  - `OnboardingConfigRepository`
  - `OnboardingTaskRepository`
  - `TrialDashboardConfigRepository`
  - `TrialFeatureBulletRepository`
  - `TrialSetupStepRepository`

#### Application service integration
- Updated `WebsiteSettingsApplicationService` to:
  - save onboarding/trial sections when present in owner save request,
  - return onboarding/trial sections in owner/public read responses.

#### Verification
- Backend tests passed: `./mvnw -q test`
- Flyway validated/applied through `v12` in test run.

### Phase 5 Progress (Owner Dashboard Web Settings) - 2026-05-02
- Extended owner dashboard web-settings editor in `education-center-management` to manage new backend sections:
  - `onboarding`
  - `trialDashboard`
- Updated data-access contracts:
  - `owner-website-settings-data.service.ts`
  - Added interfaces: `OnboardingConfig`, `TrialDashboardConfig`, `TrialSetupStep`
  - Added these fields into `WebsiteSettingsView` and `SaveWebsiteSettingsRequest`
- Updated owner web settings page form model + payload mapping:
  - `owner-web-settings.component.ts`
  - Added form groups for onboarding/trial and dynamic arrays for tasks, bullets, and setup steps.
- Updated owner web settings UI:
  - `owner-web-settings.component.html`
  - Added editable sections for onboarding/trial fields and array item management.

### Verification
- TypeScript compile check passed:
  - `npx tsc -p tsconfig.app.json --noEmit`
- Full Angular prod build in this environment failed due external Google Fonts inlining/network retrieval, not due the new web-settings code.

### Phase 4 Contract Hardening (2026-05-02)
- Updated Remix website app to treat `onboarding` and `trialDashboard` as first-class backend contract fields (non-optional in app model).
- Removed fallback text usage in onboarding/trial templates and bound directly to config values.
- Files updated in `remix_-edumanage-pro`:
  - `src/app/core/website-config.service.ts`
  - `src/app/onboarding.ts`
  - `src/app/onboarding.html`
  - `src/app/trial-dashboard.ts`
  - `src/app/trial-dashboard.html`
- Verification:
  - Website build passed: `npm run build --silent`.

### Runtime Note
- Local backend runtime start failed due database connectivity:
  - `Connection to localhost:5432 refused`
- Code-level verification is complete (backend tests previously passed), but live endpoint verification requires PostgreSQL to be up.

### Runtime Verification & Save Fix (2026-05-02)
- Live verification executed against updated backend instance on `http://localhost:18081` (started with explicit DB env to mapped Postgres `55432`).
- Verified endpoints return new sections:
  - `GET /api/v1/public/website-settings/platform-owner`
  - `GET /api/v1/owner/website-settings/platform-owner`
  - both include `onboarding` and `trialDashboard` payloads.
- Verified auth login format requires workspace:
  - `POST /api/v1/auth/login` body: `{ username, password, workspace }`.

#### Backend bug fixed during live validation
- Problem: saving owner website settings could fail with `409 duplicate key` on `ws_page_config` due delete + reinsert ordering in same transaction.
- Fix: forced flush immediately after tenant-wide deletes before reinserts in `WebsiteSettingsApplicationService` for all affected collections.
- Result: `PUT /api/v1/owner/website-settings/{tenantId}/draft` now succeeds with full payload including onboarding/trial sections.

### Phase 5 UX Continuation (2026-05-02)
- Improved `/owner/web-settings` editor usability by introducing section tabs while keeping the same form structure and save/publish actions.
- Added tabs in owner web settings:
  - Site Config, Hero, Pages, Navigation, Features, Testimonials, Pricing, CTA Blocks, Footer, Onboarding, Trial Dashboard.
- Implemented section visibility switching (only active section card shown), no backend contract changes.
- Files updated:
  - `src/app/features/owner/pages/owner-web-settings/owner-web-settings.component.ts`
  - `src/app/features/owner/pages/owner-web-settings/owner-web-settings.component.html`
  - `src/app/features/owner/pages/owner-web-settings/owner-web-settings.component.css`

### Verification
- TypeScript compile check passed:
  - `npx tsc -p tsconfig.app.json --noEmit`

### Phase 5 UX Continuation (Validation + Status) - 2026-05-02
- Enhanced `/owner/web-settings` with section-aware validation feedback.
- Added invalid-section indicators on tabs (red marker + border) when required fields are missing.
- Save Draft / Publish now auto-focus the first invalid section and show a modal message explaining where validation is required.
- Added top metadata line to show current config state (`Published` or `Draft`) and `publishedAt` when available.
- No backend/API contract changes in this step.

### Verification
- TypeScript compile check passed:
  - `npx tsc -p tsconfig.app.json --noEmit`
