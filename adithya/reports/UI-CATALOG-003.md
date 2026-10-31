# UI-CATALOG-003 — small catalog editing tasks

Owner asked us to help Devang with easier remaining work. Completed the variant, tax-rule and discount editing/archive UI items from handoff item 7 using existing backend contracts. No backend, financial calculation, authentication, schema or migration changes.

Every changed file:
- frontend/src/live/ConnectedApp.tsx: admin variant editing with active/archive control; admin tax/discount row editors populated directly from listed records because those APIs have no GET-by-ID route; reuse existing forms and PATCH transport; refresh server records and show success/errors. Staff retain read-only presentation. Pass edit context to field serialization so supported optional limits/dates can be cleared.
- frontend/src/live/resources.ts: shared variant form fields (name, exact decimal price modifier, active); mark validTo and maxUses as nullable; serialize blank nullable fields as null only for edit, preserving create omission and monetary strings.
- frontend/src/live/resources.test.ts: regression covering nullable discount-limit clearing, decimal zero preservation and create/edit distinctions.
- frontend/tests/catalog-editing.smoke.cjs: reusable optional Playwright regression with mocked API responses. Covers tax edit/archive and failed-save retry, discount editing/archive and exact decimal/null payloads without server-managed fields, negative variant modifier/edit/archive, and lack of mutation controls for staff. Requires an existing connected Vite server and separately available Playwright; no browser dependency added to the application.
- adithya/team-chat.txt: work claim, completion evidence and revised Devang responsibilities/publication handoff.
- adithya/reports/UI-CATALOG-003.md: this file report, usage, exact validation and limitations.

Integration usage:
- Admin: Products -> Open product -> Edit variant [name], or Tax rules / Discounts -> Edit [record]. Uncheck Active and save to archive; recheck and save to reactivate. Failed saves preserve the form and display the server error. Clearing a discount's Valid until or Maximum uses sends explicit null to remove that restriction. Server validates all permissions, dates, usage limits and pricing.
- Uses inspected PATCH /api/variants/:id, /api/tax-rules/:id, /api/discounts/:id from backend/src/routes/catalog.ts. No invented endpoint or payload fields. Decimal monetary/rate values remain strings. Changes do not imply live persistence verification.

Exact validation:
- git fetch origin: PASS before implementation; no newer origin/adithya-branch commit than local HEAD and no new Devang messages found in the inspected team chat.
- npm run check (with local-port permissions): PASS; frontend lint (TypeScript), frontend/backend typecheck; 30 frontend tests / 6 files; 9 backend HTTP tests using injected services; frontend/backend production builds. Application source unchanged after that gate run; the reusable browser script and documentation were added afterward.
- npm --prefix frontend run dev -- --host 127.0.0.1 --port 5174: temporary browser-test server started successfully.
- NODE_PATH=/tmp/brightloop-browser-check/node_modules CHROME_PATH=/usr/bin/google-chrome node frontend/tests/catalog-editing.smoke.cjs: PASS using existing temporary Playwright and system Chrome. API responses mocked; no uncaught browser errors. Browser process closes in finally. For another machine, make Playwright available locally and set CHROME_PATH to its installed Chrome, or use Playwright's installed browser without that variable. BRIGHTLOOP_TEST_URL can select another frontend origin; default is http://127.0.0.1:5174.
- git diff --check: PASS.
- npm run env:check: expected FAIL; DATABASE_URL still incomplete. No credential values printed.

Devang no longer needs to implement the three UI controls above. Remaining handoff item 7: subscription discount removal, finance customer filtering/CSV export and broader live UI verification. Database URL and reviewed migrations; live auth/admin/invitation/recovery; persisted billing/payment and two-customer isolation; optional scheduler coordination and invoice/Auth SMTP; representative 10,000-record performance and required CI/main review remain outstanding. All existing API authorization remains server-side. No live Supabase/database/email/performance checks performed and no migrations applied. Main unchanged; publication only to adithya-branch under existing explicit owner enablement. PR creation and merging still need leader approval of the current changes.
