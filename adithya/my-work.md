Brightloop Subscription Management Platform — Engineer 3 Work Assignment
Identity, ownership, and branch
- Member: Engineer 3 — Frontend & Portal
- Project: Brightloop Subscription & Recurring Billing Engine
- Automation working branch: adithya-branch only
- Review message: CHECK adithya-branch (only after the required configured checks actually pass)
- Integration: Team leader reviews and manually merges to main; never automatically push or merge to main.
- Primary scope: Admin control panel, Staff Workspace, Customer Self-Service Portal, quotation builder, printable PDF invoice view, financial dashboard, and searchable/filterable tables.
- Out of scope: Database migrations, recurring billing scheduler, financial calculations, authentication service, backend RBAC enforcement, subscription state machine implementation, payments persistence, and reporting aggregation APIs. These belong to Engineers 1 and 2. Frontend must consume their real interfaces when available.
Instructions for the Codex coding worker
1. Inspect the existing repository and its tech stack, routing, styling, component conventions, tests, and API clients before editing. Reuse what exists; do not install a new framework or replace existing structure unnecessarily.
2. Work through the ordered WORK milestones below, delivering small, independently meaningful, testable commits. Prefer the smallest ready milestone; do not make cosmetic/empty commits merely to hit the hourly target.
3. Poll TEAM_CHAT.txt on adithya-branch every 120 seconds via the supervisor, including during ongoing Codex work. Announce milestones; acknowledge requests and reply with concrete frontend contracts, blockers, and test results. Keep Member 3's assigned work the priority.
4. Before implementing screens dependent on unavailable endpoints, post a concise request for API contracts to the other engineers. Develop typed interface boundaries and isolated demo/mock data only where needed to proceed; never represent mocks as production integration or claim live API functionality when absent.
5. Keep role-oriented navigation (Admin, Staff, Customer), loading/empty/error states, accessible forms, and responsive layouts. The backend, not client-side route hiding, must enforce authorization and customer isolation.
6. At every completed milestone, run available relevant lint, type-check, test and build commands, record exact commands and outcomes, then commit and push safely to adithya-branch only. Do not claim a test ran if it did not.
7. Fetch before pushing, preserve others' work, never force-push, and stop/report unsafe conflicts. Only write CHECK adithya-branch once the agreed validation gates are configured, pass, and the relevant pushed SHA is known.
8. Maintain the status of each WORK item in the supervisor's persistent state; do not rewrite this file just to create progress commits.
Functional requirements grounded in the team blueprint
The presentation layer has three role-gated areas: Admin Desk, Staff Workspace, and Customer Self-Service Portal. The backend exposes authenticated REST interfaces managed by Engineer 2. Build UI for the states below, but do not invent backend transitions:
- Subscription workflow: Draft -> Quotation -> Confirmed -> Active -> Closed; allow Active -> Paused -> Active where permitted. Render actions only where appropriate and defer transition authorization/validation to backend responses.
- Invoice workflow: Draft -> Confirmed -> Paid; cancellation only where the backend allows it before payment. Never calculate or mark an invoice paid solely through frontend changes.
- Product catalog: products with name, type, sales price, cost price, notes; variants with name and price modifier. Plans include cadence (DAILY, WEEKLY, MONTHLY, YEARLY), minimum quantity, validity, auto-close, and pause permission.
- Quotation templates: template name, plan, validity days, notes, and configured product lines.
- Finance dashboard: Active MRR / ARR, Overdue Receivables, Collected Revenue, and filterable subscription/invoice records. Display server-calculated values; don't substitute invented business computations.
- Target: finance dashboard renders in <2.0 seconds with over 10,000 active records. This is a system-level acceptance target; measure only with a representative backend/test dataset and record actual results. Use pagination or virtualization for large lists.
Ordered implementation milestones
[WORK 001] Inspect repository and establish frontend integration plan
Tasks
- Inspect framework, application structure, routes, role handling, styling, API client, testing tools and deployment assumptions.
- Reuse/create a typed API-client adapter and environment-based base URL without hardcoded credentials.
- Document specific backend endpoint/contracts needed from Engineer 2 in TEAM_CHAT.txt; log requests without blocking independent UI work.
Done when: Existing app still runs; implementation plan aligns with repo; actual API integration assumptions are separated from unconfirmed ones.

Suggested commit: chore(frontend): establish portal integration foundation (only if substantive files were added/changed).
[WORK 002] Shared design system and role-based layout shells
Tasks
- Build reusable responsive navigation, header, sidebar, breadcrumbs or equivalent as appropriate.
- Define consistent form inputs, tables, cards, statuses, notifications, empty/loading/error states.
- Create Admin Desk, Staff Workspace, and Customer Portal page shells plus login UI as integration requires.
- Use the existing routing/auth infrastructure; frontend guards are UX only, not a security boundary.
Done when: All three app areas have navigable responsive layouts; no duplicate component stacks; accessibility basics work.

Suggested commit: feat(ui): add responsive role-based workspace layouts.
[WORK 003] Admin product and variant catalog views
Tasks
- Build admin product list/table with search/filter, product details and create/edit forms if supported by API.
- Expose variants and price modifiers clearly; handle money using correct currency display without floating-point business calculations.
- Add loading, validation, success/error and empty states.
Done when: Product and variant UIs are functional against confirmed endpoints or clearly labelled demo adapters, with tests for critical interactions.

Suggested commit: feat(admin): implement product and variant catalog screens.
[WORK 004] Staff quotation builder
Tasks
- Create UI to select a customer, quotation template/plan, products, variants and quantities, with review before submission.
- Show validity, line totals, discounts and tax amounts from backend responses when available; local preview calculations must be clearly provisional and never source of billing truth.
- Display validation, errors and submission results; support editing before submission when backend allows it.
Done when: Quote building workflow is navigable and has form validation; backend submission is integrated only against verified contracts.

Suggested commit: feat(staff): build quotation creation workflow.
[WORK 005] Subscription listing, details and staff operations
Tasks
- Build searchable/filterable/paginated subscription list with status, customer, plan, dates, payment terms and next billing date.
- Build a detail view with subscription lines and allowed lifecycle actions such as request approval/activation/pause/resume/close as backed by actual API contracts.
- Disable/omit forbidden actions with appropriate explanations; refresh UI state from server after mutations.
Done when: Staff can discover and inspect subscriptions, and permitted operations call verified endpoints with error handling.

Suggested commit: feat(staff): add subscription list and lifecycle views.
[WORK 006] Customer self-service portal
Tasks
- Build customer dashboard and read-only active plan/subscription views, invoice list and invoice details.
- Show invoice status, due date and totals returned by API.
- Ensure all requests use authenticated customer-scoped APIs; do not trust customer ID from query parameters or UI selections to authorize access.
Done when: Customer can navigate their own subscription and invoice views when connected to the backend; test role and UI handling for unauthorized responses.

Suggested commit: feat(portal): add customer subscription and invoice views.
[WORK 007] Printable PDF invoice and payment interface
Tasks
- Implement invoice detail view with clean print stylesheet and browser print / Save as PDF, or use an existing supported PDF solution if already part of the project.
- Include actual invoice number, dates, customer, lines, discounts/taxes (if returned), totals and payment status.
- Build a staff payment-entry modal only if Engineer 2 exposes a payment-recording API; validate form inputs, submit to backend and show returned status. Never record payments purely in local UI state.
Done when: Invoice prints/readably exports to PDF from real invoice data; payment UI is either wired to API or explicitly marked as pending integration.

Suggested commit: feat(invoice): add printable invoice and payment entry UI.
[WORK 008] Finance analytics dashboard
Tasks
- Build metric tiles for Active MRR, ARR, Overdue Receivables and Collected Revenue.
- Show date-range selection and appropriate charts/tables for financial trends if aggregation APIs support them.
- Build high-density filterable subscription/invoice tables with server-side paging/filtering where available, or virtualization when appropriate.
- Handle loading/error/empty states and stale data explicitly; avoid fabricated dashboard metrics.
Done when: Finance dashboard displays real backend-provided figures and supports usable filtering; render/query performance can be measured under representative load.

Suggested commit: feat(finance): add revenue metrics and filterable tables.
[WORK 009] Integration and verification
Tasks
- Replace temporary adapters with confirmed Engineer 2 REST endpoints.
- Validate role-specific navigation, subscription statuses, invoice lifecycle display, printable invoices, responsive behavior, and error recovery.
- Test performance against the team's 10,000+ mock subscription dataset if available, aiming for the blueprint's <2.0 second dashboard SLA. State measured methodology/results instead of making an unsupported claim.
- Run available lint, type-check, tests and build; publish integration blockers in TEAM_CHAT.txt.
Done when: Configured gates pass, known limitations are documented, and the pushed commit SHA is shared for team-leader review.

Suggested commit: test(frontend): verify portal workflows and integration (only for actual test changes).
Team dependencies — ask in TEAM_CHAT.txt
Engineer 2 (APIs & Security):
- Auth login/session flows, logout, current-user role endpoint, token refresh expectations, HTTP error envelope.
- Product, variant, quotation template, subscription list/detail and lifecycle action routes with request/response schemas and pagination/filter parameters.
- Customer-scoped subscription/invoice routes; invoice retrieval/print payload; payment-recording route and validation rules.
- Finance metrics endpoints for MRR/ARR, overdue receivables, collected revenue, date ranges and exports.
Engineer 1 (Core Engine & DB):
- Authoritative allowed subscription/invoice statuses and state transitions, pricing/tax/discount field semantics, plan cadence and next billing date representation.
- Realistic seed data or agreed fixture contract for UI and >10,000-subscription performance tests.
Ask specific blocking questions through TEAM_CHAT.txt, but continue independent implementation on confirmed UI requirements.
Success criteria and scope boundaries
- All assigned Admin, Staff and Customer UI screens implemented.
- Quotation builder, subscription views, invoice/PDF presentation, payment UI and finance dashboard integrated where APIs are available.
- Responsive and accessible layouts; input validation and actionable errors.
- No client-side authorization guarantees or invented financial truth.
- Customer data isolation verified via backend integration tests (the UI alone cannot prove it).
- Finance dashboard <2-second target measured on representative 10,000+ records; if not verifiable, say so explicitly.
- Meaningful, scoped commits pushed only to adithya-branch and reviewed manually before main integration.