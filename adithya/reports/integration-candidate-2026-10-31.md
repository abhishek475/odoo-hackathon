> Historical intermediate candidate. Superseded by INTEGRATION-002.md; earlier access and Prisma blockers were resolved.

# Integration candidate — 2026-10-31

Local files only. No commit, push, PR or merge. Cached origin/main 9480aa9 includes frontend PR #2; cached origin/abhishek 8f33acd and origin/devang 4757370 are separate. Freshness unverified: Git fetch cannot write .git/FETCH_HEAD; git ls-remote fails GitHub DNS.

## Changed files and usage

- `.gitignore`: ignore nested dependencies, generated Prisma, credentials, output and logs. Existing local automation exclusions preserved.
- `package.json`: root commands delegate to the two existing packages.
- `README.md`: setup, actual integration limits and schema coordination.
- `frontend/.env.example`: public API URL only. Ignored frontend/.env.local mirrors it.
- Ignored `backend/.env`: template with corrected project URL; deliberately requires rotated keys and a real database URL. No user secrets copied.

- `index.html` → `frontend/index.html`: existing frontend preserved unchanged; package layout integration.
- `package-lock.json` → `frontend/package-lock.json`: existing frontend preserved unchanged; package layout integration.
- `package.json` → `frontend/package.json`: existing frontend preserved unchanged; package layout integration.
- `postcss.config.js` → `frontend/postcss.config.js`: existing frontend preserved unchanged; package layout integration.
- `src/App.tsx` → `frontend/src/App.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/layout/Navbar.tsx` → `frontend/src/components/layout/Navbar.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/layout/ProtectedRouteGuard.tsx` → `frontend/src/components/layout/ProtectedRouteGuard.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/layout/Sidebar.tsx` → `frontend/src/components/layout/Sidebar.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/layout/navigation.test.ts` → `frontend/src/components/layout/navigation.test.ts`: existing frontend preserved unchanged; package layout integration.
- `src/components/layout/navigation.ts` → `frontend/src/components/layout/navigation.ts`: existing frontend preserved unchanged; package layout integration.
- `src/components/shared/CurrencyFormatter.tsx` → `frontend/src/components/shared/CurrencyFormatter.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/shared/StateMachineStepper.tsx` → `frontend/src/components/shared/StateMachineStepper.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/shared/StatusBadge.tsx` → `frontend/src/components/shared/StatusBadge.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/components/shared/WorkspaceState.tsx` → `frontend/src/components/shared/WorkspaceState.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/context/AppStateContext.tsx` → `frontend/src/context/AppStateContext.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/lib/utils.ts` → `frontend/src/lib/utils.ts`: existing frontend preserved unchanged; package layout integration.
- `src/main.tsx` → `frontend/src/main.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/mocks/seedData.ts` → `frontend/src/mocks/seedData.ts`: existing frontend preserved unchanged; package layout integration.
- `src/pages/auth/AuthStaffPage.tsx` → `frontend/src/pages/auth/AuthStaffPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/billing/BillingPage.tsx` → `frontend/src/pages/billing/BillingPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/catalog/CatalogPage.tsx` → `frontend/src/pages/catalog/CatalogPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/catalog/ProductCatalog.tsx` → `frontend/src/pages/catalog/ProductCatalog.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/catalog/catalogModel.test.ts` → `frontend/src/pages/catalog/catalogModel.test.ts`: existing frontend preserved unchanged; package layout integration.
- `src/pages/catalog/catalogModel.ts` → `frontend/src/pages/catalog/catalogModel.ts`: existing frontend preserved unchanged; package layout integration.
- `src/pages/customer/CustomerPortalPage.tsx` → `frontend/src/pages/customer/CustomerPortalPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/dashboard/DashboardPage.tsx` → `frontend/src/pages/dashboard/DashboardPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/discounts/DiscountsPage.tsx` → `frontend/src/pages/discounts/DiscountsPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/payments/PaymentsPage.tsx` → `frontend/src/pages/payments/PaymentsPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/subscriptions/QuotationBuilderPage.tsx` → `frontend/src/pages/subscriptions/QuotationBuilderPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/pages/subscriptions/SubscriptionsPage.tsx` → `frontend/src/pages/subscriptions/SubscriptionsPage.tsx`: existing frontend preserved unchanged; package layout integration.
- `src/services/apiAdapter.test.ts` → `frontend/src/services/apiAdapter.test.ts`: existing frontend preserved unchanged; package layout integration.
- `src/services/apiAdapter.ts` → `frontend/src/services/apiAdapter.ts`: existing frontend preserved unchanged; package layout integration.
- `src/services/apiConfig.test.ts` → `frontend/src/services/apiConfig.test.ts`: existing frontend preserved unchanged; package layout integration.
- `src/services/apiConfig.ts` → `frontend/src/services/apiConfig.ts`: existing frontend preserved unchanged; package layout integration.
- `src/styles.css` → `frontend/src/styles.css`: existing frontend preserved unchanged; package layout integration.
- `src/types/billing.ts` → `frontend/src/types/billing.ts`: existing frontend preserved unchanged; package layout integration.
- `tailwind.config.js` → `frontend/tailwind.config.js`: existing frontend preserved unchanged; package layout integration.
- `tsconfig.json` → `frontend/tsconfig.json`: existing frontend preserved unchanged; package layout integration.
- `vite.config.ts` → `frontend/vite.config.ts`: existing frontend preserved unchanged; package layout integration.
- `backend/.env.example`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/.gitignore`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/README.md`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/package-lock.json`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/package.json`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/prisma.config.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/prisma/migrations/202610310001_initial/migration.sql`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/prisma/migrations/202610310002_constraints_and_security/migration.sql`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/prisma/migrations/migration_lock.toml`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/prisma/schema.prisma`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/scripts/bootstrap-admin.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/app.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/config.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/db.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/lib/errors.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/lib/utils.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/middleware.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/routes/auth.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/routes/catalog.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/routes/invoices.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/routes/reports.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/routes/subscriptions.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/server.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/services/auth.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/services/core.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/services/invoice-html.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/services/mailer.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/services/payments.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/services/pricing.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/src/types.ts`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.
- `backend/tsconfig.json`: copied unchanged from Abhishek 8f33acd; preserves the supplied Supabase API implementation, schema, scripts or documentation.

## Exact checks

- `npm --prefix frontend run typecheck`: PASS.
- `npm --prefix frontend run lint`: PASS (TypeScript only).
- `npm --prefix frontend test`: PASS, 19 tests / 4 files.
- `npm --prefix frontend run build`: PASS; 722.36 kB bundle warning.
- `npm --prefix backend ci --no-audit --no-fund`: FAIL; esbuild install spawn EPERM.
- `npm --prefix backend ci --offline --ignore-scripts --no-audit --no-fund`: PASS, 251 packages. Lifecycle scripts intentionally skipped; not a complete runnable installation.
- `npm --prefix backend run db:generate`: FAIL; binaries.prisma.sh DNS EAI_AGAIN.
- `npm --prefix backend run typecheck`: FAIL; missing generated Prisma client and downstream type errors.
- `git diff --check`: PASS for tracked changes; new files not covered by this command.
- `git check-ignore backend/.env frontend/.env.local backend/node_modules frontend/dist`: all ignored.
- Cached main tree contains zero tracked node_modules files. No dependency deletion needed.

## Remaining work

Live frontend adapter/auth wiring remains unfinished; current demo is preserved. Devang’s incompatible in-memory backend is not merged; its monorepo direction is adopted. Real DATABASE_URL, rotated server credentials, dependency lifecycle completion, schema-owner review and end-to-end validation are required. Main cannot be changed here: Git metadata is read-only and GitHub DNS is unavailable. No migration, server startup, customer isolation or representative performance checks run. No review approval inferred.
