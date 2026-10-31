# INTEGRATION-002 — reconciled connected application

Owner requested integration into adithya-branch, with main deferred, and confirmed Abhishek's bl_* schema. This supersedes the earlier local-only integration-candidate report.

## Branch resolution

Fetched origin/main 9480aa9, origin/abhishek 8f33acd and origin/devang 0caae4e. Preserve Adithya's frontend and demo under frontend/. Import Abhishek's backend under backend/. Adopt Devang's package layout and implement its CRUD/auth integration intent against the owner-selected /api contract. Do not run the competing /api/v1 backend, alternate schema/seed migrations, JWT/demo-role bypass or fallback success paths. Automatic batch scheduling remains a separate integration dependency; manual due-period invoice generation uses the selected core API. No teammate branch is rewritten. Main remains unchanged.

## Integration usage

npm run install:all; complete backend/.env; npm run env:check; review shared schema/migration history before npm run db:migrate; npm run dev. The supplied project URL and server keys are stored only in ignored backend/.env (0600). URL prefix corrected. DATABASE_URL still has placeholders; owner will fill it. Keys previously exposed in chat must be rotated. No migrations or external account changes performed.

Connected mode is default. The old demo is explicitly selectable with VITE_APP_MODE=demo. Auth obtains its role from /me, retains sessions only in memory, refreshes via the backend and handles recovery fragments. Catalog/template/subscription/invoice/payment forms use inspected strict API schemas. Paging, search and filters go to the server. Receipt retries retain an idempotency key for unchanged requests. Money stays as server decimal strings in INR. Invoice HTML is fetched with bearer auth and shown in a script-disabled sandbox. Finance uses server aggregates. Root dev command starts/stops both packages; env preflight identifies incomplete names without logging values.

## Validation

- git fetch origin (with broader execution permissions): PASS; found newer Devang 0caae4e. Earlier sandbox Git/DNS limitations resolved.
- npm --prefix backend run db:generate: PASS, Prisma 7.10.1 generated client.
- npm run check (with local-port permissions): PASS. Frontend lint/typecheck and backend typecheck; 29 frontend tests / 6 files; 9 backend HTTP tests; frontend and backend production builds. Frontend compiled application: 145.09 kB entry plus approximately 28.6 kB connected chunk; old demo omitted from connected build.
- Backend tests inject auth/database dependencies and exercise actual HTTP routes: missing auth, demo-header rejection, authoritative role, forbidden customer/staff access, customer ownership query override, strict field validation, required payment idempotency key. These are not live database isolation tests.
- node /tmp/brightloop-browser-check/smoke.cjs: PASS using temporary Playwright installation and system Chrome. Mocked API responses verify admin sign-in, finance display, product creation, receipt failure/retry using the same idempotency key, protected invoice preview, customer navigation, 390px mobile layout without page overflow, and recovery fragment clearing. Browser fetch receiver bug found and fixed. No uncaught page errors. Screenshots: /tmp/brightloop-browser-check/admin.png and customer-mobile.png; visually inspected mobile capture.
- npm run env:check: expected FAIL; only DATABASE_URL incomplete. It is intentionally outside code gates, not a passing live setup check.
- git diff --check: PASS. git check-ignore verifies backend/.env, frontend/.env.local, node_modules, generated Prisma and build output remain ignored. Fetched main has zero tracked node_modules files. Secret-pattern scan of application source and generated browser output: no supplied secret values found.
- node --check scripts/dev.mjs and node --check scripts/check-env.mjs: PASS.

Initial restricted backend test invocation failed due sandbox process/port restrictions; same tests pass with approved local execution. Earlier browser attempts caught a fetch receiver issue and ambiguous password label; corrected and rerun. Hidden-option test locator was corrected. No failure is reported as a pass.

## Outstanding dependencies

Real DATABASE_URL; rotated keys; shared database migration history review; live auth/profile/admin setup; database readiness and persistence; SMTP delivery; representative 10,000-record performance. No scheduler, gateway, refund or chargeback integration. Runtime/end-to-end production integration is not established without those services. Publication is only to adithya-branch; no PR or main approval is inferred.

The first staged diff check found a trailing blank line in the imported initial SQL migration. Removed that whitespace without changing SQL semantics and reran the staged check before publication.

## Every changed file

- `.gitignore`: Ignore dependencies, generated clients, local credentials, logs and output; preserve existing local automation exclusions.
- `README.md`: Document connected setup, confirmed schema, commands and real service dependencies.
- `adithya/reports/INTEGRATION-002.md`: Historical or current integration evidence and complete file report.
- `adithya/reports/integration-candidate-2026-10-31.md`: Historical or current integration evidence and complete file report.
- `adithya/team-chat.txt`: Integration status and review handoff, without secrets.
- `backend/.env.example`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/.gitignore`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/README.md`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/package-lock.json`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/package.json`: Preserve supplied backend scripts/dependencies and add real HTTP test command.
- `backend/prisma.config.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/prisma/migrations/202610310001_initial/migration.sql`: Import selected initial schema; remove its trailing blank line to satisfy the staged whitespace gate. No SQL behavior change.
- `backend/prisma/migrations/202610310002_constraints_and_security/migration.sql`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/prisma/migrations/migration_lock.toml`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/prisma/schema.prisma`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/scripts/bootstrap-admin.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/app.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/config.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/db.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/lib/errors.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/lib/utils.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/middleware.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/routes/auth.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/routes/catalog.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/routes/invoices.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/routes/reports.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/routes/subscriptions.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/server.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/services/auth.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/services/core.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/services/invoice-html.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/services/mailer.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/services/payments.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/services/pricing.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/src/types.ts`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `backend/tests/api.test.ts`: Nine HTTP boundary tests with injected services; no live database claims.
- `backend/tsconfig.json`: Import unchanged from Abhishek 8f33acd; retain selected backend implementation, migration/schema, tooling or documentation.
- `docs/frontend-integration.md`: Replace obsolete mock-only plan with actual inspected contracts and current limits.
- `frontend/.env.example`: Public API URL example only; document explicit demo mode.
- `frontend/index.html`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/package-lock.json`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/package.json`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/postcss.config.js`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/App.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/layout/Navbar.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/layout/ProtectedRouteGuard.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/layout/Sidebar.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/layout/navigation.test.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/layout/navigation.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/shared/CurrencyFormatter.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/shared/StateMachineStepper.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/shared/StatusBadge.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/components/shared/WorkspaceState.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/context/AppStateContext.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/lib/utils.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/live/ConnectedApp.tsx`: Connected role workspaces, forms, server paging and finance, invoice operations, recovery and customer view.
- `frontend/src/live/resources.test.ts`: Three tests for navigation, decimal strings and numeric/optional serialization.
- `frontend/src/live/resources.ts`: Confirmed form schemas, safe serialization and role navigation.
- `frontend/src/main.tsx`: Connected entry by default; explicitly selected lazy demo.
- `frontend/src/mocks/seedData.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/auth/AuthStaffPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/billing/BillingPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/catalog/CatalogPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/catalog/ProductCatalog.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/catalog/catalogModel.test.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/catalog/catalogModel.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/customer/CustomerPortalPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/dashboard/DashboardPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/discounts/DiscountsPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/payments/PaymentsPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/subscriptions/QuotationBuilderPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/pages/subscriptions/SubscriptionsPage.tsx`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/services/apiAdapter.test.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/services/apiAdapter.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/services/apiConfig.test.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/services/apiConfig.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/services/liveApi.test.ts`: Seven tests for auth, pagination/decimal fidelity, errors, refresh, receipts and logout.
- `frontend/src/services/liveApi.ts`: Typed authenticated transport, refresh/errors, exact money and protected print retrieval.
- `frontend/src/styles.css`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/src/types/billing.ts`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/tailwind.config.js`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/tsconfig.json`: Move existing frontend file unchanged into Devang-style package layout; preserve the explicit demo and existing checks.
- `frontend/vite.config.ts`: Keep scoped tests; fix frontend port and proxy /api to existing backend.
- `index.html`: Relocate to frontend/index.html; content preserved in the frontend package.
- `package-lock.json`: Root lockfile matches dependency-free coordinator package.
- `package.json`: Root install/dev/env/check commands for both packages.
- `postcss.config.js`: Relocate to frontend/postcss.config.js; content preserved in the frontend package.
- `scripts/check-env.mjs`: Identify missing server environment names without revealing values.
- `scripts/dev.mjs`: Run both existing dev servers and terminate their process groups together.
- `src/App.tsx`: Relocate to frontend/src/App.tsx; content preserved in the frontend package.
- `src/components/layout/Navbar.tsx`: Relocate to frontend/src/components/layout/Navbar.tsx; content preserved in the frontend package.
- `src/components/layout/ProtectedRouteGuard.tsx`: Relocate to frontend/src/components/layout/ProtectedRouteGuard.tsx; content preserved in the frontend package.
- `src/components/layout/Sidebar.tsx`: Relocate to frontend/src/components/layout/Sidebar.tsx; content preserved in the frontend package.
- `src/components/layout/navigation.test.ts`: Relocate to frontend/src/components/layout/navigation.test.ts; content preserved in the frontend package.
- `src/components/layout/navigation.ts`: Relocate to frontend/src/components/layout/navigation.ts; content preserved in the frontend package.
- `src/components/shared/CurrencyFormatter.tsx`: Relocate to frontend/src/components/shared/CurrencyFormatter.tsx; content preserved in the frontend package.
- `src/components/shared/StateMachineStepper.tsx`: Relocate to frontend/src/components/shared/StateMachineStepper.tsx; content preserved in the frontend package.
- `src/components/shared/StatusBadge.tsx`: Relocate to frontend/src/components/shared/StatusBadge.tsx; content preserved in the frontend package.
- `src/components/shared/WorkspaceState.tsx`: Relocate to frontend/src/components/shared/WorkspaceState.tsx; content preserved in the frontend package.
- `src/context/AppStateContext.tsx`: Relocate to frontend/src/context/AppStateContext.tsx; content preserved in the frontend package.
- `src/lib/utils.ts`: Relocate to frontend/src/lib/utils.ts; content preserved in the frontend package.
- `src/main.tsx`: Relocate to frontend/src/main.tsx; content preserved in the frontend package.
- `src/mocks/seedData.ts`: Relocate to frontend/src/mocks/seedData.ts; content preserved in the frontend package.
- `src/pages/auth/AuthStaffPage.tsx`: Relocate to frontend/src/pages/auth/AuthStaffPage.tsx; content preserved in the frontend package.
- `src/pages/billing/BillingPage.tsx`: Relocate to frontend/src/pages/billing/BillingPage.tsx; content preserved in the frontend package.
- `src/pages/catalog/CatalogPage.tsx`: Relocate to frontend/src/pages/catalog/CatalogPage.tsx; content preserved in the frontend package.
- `src/pages/catalog/ProductCatalog.tsx`: Relocate to frontend/src/pages/catalog/ProductCatalog.tsx; content preserved in the frontend package.
- `src/pages/catalog/catalogModel.test.ts`: Relocate to frontend/src/pages/catalog/catalogModel.test.ts; content preserved in the frontend package.
- `src/pages/catalog/catalogModel.ts`: Relocate to frontend/src/pages/catalog/catalogModel.ts; content preserved in the frontend package.
- `src/pages/customer/CustomerPortalPage.tsx`: Relocate to frontend/src/pages/customer/CustomerPortalPage.tsx; content preserved in the frontend package.
- `src/pages/dashboard/DashboardPage.tsx`: Relocate to frontend/src/pages/dashboard/DashboardPage.tsx; content preserved in the frontend package.
- `src/pages/discounts/DiscountsPage.tsx`: Relocate to frontend/src/pages/discounts/DiscountsPage.tsx; content preserved in the frontend package.
- `src/pages/payments/PaymentsPage.tsx`: Relocate to frontend/src/pages/payments/PaymentsPage.tsx; content preserved in the frontend package.
- `src/pages/subscriptions/QuotationBuilderPage.tsx`: Relocate to frontend/src/pages/subscriptions/QuotationBuilderPage.tsx; content preserved in the frontend package.
- `src/pages/subscriptions/SubscriptionsPage.tsx`: Relocate to frontend/src/pages/subscriptions/SubscriptionsPage.tsx; content preserved in the frontend package.
- `src/services/apiAdapter.test.ts`: Relocate to frontend/src/services/apiAdapter.test.ts; content preserved in the frontend package.
- `src/services/apiAdapter.ts`: Relocate to frontend/src/services/apiAdapter.ts; content preserved in the frontend package.
- `src/services/apiConfig.test.ts`: Relocate to frontend/src/services/apiConfig.test.ts; content preserved in the frontend package.
- `src/services/apiConfig.ts`: Relocate to frontend/src/services/apiConfig.ts; content preserved in the frontend package.
- `src/styles.css`: Relocate to frontend/src/styles.css; content preserved in the frontend package.
- `src/types/billing.ts`: Relocate to frontend/src/types/billing.ts; content preserved in the frontend package.
- `tailwind.config.js`: Relocate to frontend/tailwind.config.js; content preserved in the frontend package.
- `tsconfig.json`: Relocate to frontend/tsconfig.json; content preserved in the frontend package.
- `vite.config.ts`: Relocate to frontend/vite.config.ts; content preserved in the frontend package.
