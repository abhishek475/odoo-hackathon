# WORK-001 frontend integration plan

## Inspected implementation

React 18 + TypeScript strict mode, Vite 6, Tailwind 3, Lucide and Recharts are installed in package.json. No router or shadcn component package is installed. App.tsx selects nine page modules using local activeTab state; navigation is not URL-based. Reuse this structure for the next milestone rather than replacing the stack.

AppStateContext loads all collections and metrics through the typed singleton in services/apiAdapter.ts. types/billing.ts describes demo presentation models, not verified server schemas. The adapter persists demo records to localStorage and performs local lifecycle changes, batch invoicing, payments and financial calculations. USE_MOCK_FALLBACK does not implement network fallback: there are no live backend calls. Its /api/v1 TODO comments are unconfirmed proposals.

Role switching selects seed users; ProtectedRouteGuard is presentation only. CustomerPortalPage filters globally loaded data using ID, email or a hardcoded NovaCloud name. This cannot establish customer isolation. AuthStaffPage is demo UI, not an authenticated session implementation. Never connect this global demo context to real customer records as-is.

Styling uses shared CSS, Tailwind classes and shared status/currency/stepper components. The print stylesheet targets printable-invoice; browser/PDF output has not been visually verified. Navbar now identifies the app as a local demo and reports seed timing without claiming the dashboard SLA.

## Configuration and deployment boundary

services/apiConfig.ts reserves VITE_API_BASE_URL as a public absolute HTTP(S) backend base URL, optionally including a path prefix. It defaults to null and rejects embedded credentials, query strings and fragments. Supply it through the deployment environment before Vite builds; no .env file is required or changed. This configuration is deliberately not connected to speculative routes. No credentials belong in browser environment variables.

Vite builds static assets into dist. No backend proxy, hosting configuration, auth integration or deployment validation was found in the inspected app configuration. Confirm hosting origin, CORS, session transport and API prefix with Engineer 2 before wiring requests. Backend source/deployment was not inspected: the supplied private reference is outside this task's checkout-only read boundary.

## Contract request for Engineer 2 (supervisor to relay in team-chat)

Please supply versioned request/response examples or an OpenAPI schema plus an accessible test backend for:

- Login, logout, current user/roles and session refresh; cookie versus token transport, CSRF requirements, 401/403 behavior and error/field-validation envelope.
- Products/variants, plans and quotation templates: list/detail/create/edit routes, IDs, required fields, money representation/currency and variant modifiers.
- Customer lookup and quotation preview/submission: allowed fields, server totals/taxes/discounts, validity, draft editing and validation errors.
- Subscription list/detail: search/filter/page or cursor parameters, total count, dates/time zones, allowed actions and transition requests/responses, including pause/resume/close conflicts.
- Authenticated customer-scoped subscription/invoice list/detail routes deriving identity from the session; invoice print payload, totals, line fields and payment history.
- Staff payment recording: permitted methods, amount representation, idempotency, validation, server-returned balances/status; customer payment initiation if supported.
- Finance aggregates: MRR/ARR, receivables, collected revenue, currency, date ranges, trend series, freshness and paginated records/exports.

Engineer 1: please confirm authoritative state transitions, cadence/date semantics, tax/discount/pricing representations, and a representative 10,000+ subscription dataset.

These are questions, not API contracts. Direct team-chat edits are prohibited for this worker; the supervisor must relay this request and maintain milestone state/report/publication.

## Ordered integration work

1. Reuse the existing shells and shared components; verify responsive navigation, accessible forms and loading/error/empty recovery during WORK-002.
2. Add a separate confirmed HTTP implementation behind the existing typed service methods only once schemas are known; map server DTOs to presentation models. Keep explicitly selected demo data isolated. Failed production mutations must surface errors rather than becoming successful local payments or lifecycle changes.
3. Integrate catalog, quotation, subscription, customer and invoice workflows in milestone order. Replace client role selection with the real session boundary; backend must enforce authorization and tenant isolation.
4. Replace local finance calculations with server aggregates and server paging. Measure the full dashboard with representative backend data, query time and browser render timing. Current seed generation timing excludes query, React rendering and dashboard interaction; it does not establish the 10,000-record <2-second target.

## Validation scope

npm run typecheck runs tsc --noEmit. npm run lint runs the same command and is not independent ESLint validation. npm test runs Vitest adapter/configuration tests in Node; existing adapter tests exercise demo behavior, not backend transition correctness. npm run build runs tsc and vite build. No browser interaction test harness is configured. Exact execution results are recorded in the worker handoff; no backend, auth isolation, deployment or dashboard SLA validation is claimed here.
