# Frontend Foundation & Dual-Mode UI Architecture Report

Date: 31 October 2026  
Branch: `adithya-branch`  
Status: **PASSED & VALIDATED**

---

## 1. Executive Summary

In response to teammate instructions, the complete, production-grade frontend for **"Brightloop Software — Subscription Management & Recurring Billing System"** has been built directly in this repository using **React, TypeScript, Tailwind CSS, Lucide React, and Recharts**.

To ensure parallel development with Engineer 1 (DB / Core Engine) and Engineer 2 (REST APIs & Security) with zero downtime or blocking, all data operations are routed through a **Dual-Mode Service & State Layer (`src/services/apiAdapter.ts`)** backed by stateful `localStorage` and reactive React Context (`src/context/AppStateContext.tsx`).

---

## 2. Inventory of Created Files

| File | Purpose & Architectural Role |
| :--- | :--- |
| `package.json` | Project manifest defining dependencies (`react`, `react-dom`, `lucide-react`, `recharts`, `clsx`, `tailwind-merge`) and test/build scripts (`dev`, `typecheck`, `test`, `build`). |
| `tsconfig.json` | TypeScript compiler configuration (ES2020 target, bundler resolution, `@/*` aliases, strict typechecking). |
| `vite.config.ts` | Vite configuration with `@vitejs/plugin-react` and path alias resolution. |
| `tailwind.config.js` | Editorial Dark Monochrome design system (`#09090b` canvas, `#121215` cards, `#27272a` borders) with cyan accent (`#67e8f9`). |
| `postcss.config.js` | PostCSS pipeline configured with Tailwind and Autoprefixer. |
| `index.html` | Application HTML entry with dark mode theme and Google Web Fonts. |
| `src/styles.css` | Global styling, custom dark scrollbar, and `@media print` CSS for clean PDF invoice export. |
| `src/lib/utils.ts` | Shared utilities: `cn` class merger, `formatCurrency`, and `formatDate`. |
| `src/types/billing.ts` | Strict TypeScript domain models: `User`, `Product`, `BillingPlan`, `QuotationTemplate`, `Subscription`, `Invoice`, `DiscountRule`, `PaymentRecord`, and `FinanceMetrics`. |
| `src/mocks/seedData.ts` | Rich initial dataset for Brightloop Software plus a sub-50ms generator for 2,500 stress-test records. |
| `src/services/apiAdapter.ts` | Dual-mode service layer (`USE_MOCK_FALLBACK = true`) with typed CRUD operations, batch billing runner, state machine transitions, and explicit `// TODO: [BACKEND_HOOK]` markers. |
| `src/services/apiAdapter.test.ts` | Vitest test suite covering zero-failure fallback, lifecycle transitions, payment ledger reconciliation, and stress-test performance. |
| `src/context/AppStateContext.tsx` | Central reactive store holding current auth, role state, collections, and action dispatchers. |
| `src/components/shared/StatusBadge.tsx` | Semantic color-coded badge component (`Draft`, `Quotation`, `Confirmed`, `Active`/`Paid`, `Paused`, `Closed`/`Overdue`). |
| `src/components/shared/StateMachineStepper.tsx` | Interactive stepper visualizing subscription lifecycle states and triggering permitted mutations. |
| `src/components/shared/CurrencyFormatter.tsx` | Formatted currency renderer with configurable subtle decimals. |
| `src/components/layout/Navbar.tsx` | Top command bar with live 2,500-record benchmark trigger, SLA telemetry, and instant Role Switcher. |
| `src/components/layout/Sidebar.tsx` | Responsive sidebar dynamically filtering navigation tabs according to current role. |
| `src/components/layout/ProtectedRouteGuard.tsx` | Role-based gate rendering unauthorized prompts when the current role does not have privilege. |
| `src/pages/dashboard/DashboardPage.tsx` | Executive Analytics dashboard (<2s SLA) featuring Active MRR, ARR, Overdue Receivables, Collected Revenue, and Recharts trends. |
| `src/pages/catalog/CatalogPage.tsx` | Admin catalog manager for products, variant tiers (with price modifiers), and recurring cadence billing plans. |
| `src/pages/subscriptions/SubscriptionsPage.tsx` | Searchable, filterable subscription list with lifecycle drawer, line item inspection, and state transitions. |
| `src/pages/subscriptions/QuotationBuilderPage.tsx` | Staff quote builder with line-item pricing, discounts, tax calculations, and template saving. |
| `src/pages/billing/BillingPage.tsx` | Recurring billing day batch execution engine, invoice ledger, and printable PDF invoice modal (`window.print()`). |
| `src/pages/discounts/DiscountsPage.tsx` | Admin promotional coupon engine supporting percentage and flat discounts with threshold rules. |
| `src/pages/payments/PaymentsPage.tsx` | Payment settlement ledger and cash recording modal updating invoice balances and overdue tracking. |
| `src/pages/auth/AuthStaffPage.tsx` | Authentication login view, staff RBAC directory, forgot password token generator, and signup with strict regex policy. |
| `src/pages/customer/CustomerPortalPage.tsx` | Customer-isolated self-service portal displaying active plans, invoices, online payment actions, and PDF statements. |
| `src/App.tsx` | Root application orchestrating role sync, navigation routing, and layout shells. |
| `src/main.tsx` | React 18 DOM mount point. |

---

## 3. Exact Validation Results

All checks passed exiting **0**:

1. **TypeScript Typecheck**:
   ```bash
   npm run typecheck
   # Output: tsc --noEmit (exited 0, 0 errors)
   ```

2. **Unit Tests (Vitest)**:
   ```bash
   npm test
   # Output: 6 passed (6) in 26ms (exited 0)
   # - Dual-Mode ApiAdapter & State Layer > guarantees zero-failure fallback flag is active (3ms)
   # - Dual-Mode ApiAdapter & State Layer > retrieves products and plans without network latency (1ms)
   # - Dual-Mode ApiAdapter & State Layer > executes subscription lifecycle state transitions faithfully (2ms)
   # - Dual-Mode ApiAdapter & State Layer > records payments and reconciles invoice balances (1ms)
   # - Dual-Mode ApiAdapter & State Layer > generates 2,500 stress test subscriptions in <50ms (meeting <2s SLA) (17ms)
   # - Dual-Mode ApiAdapter & State Layer > calculates financial analytics metrics accurately (1ms)
   ```

3. **Production Build (Vite)**:
   ```bash
   npm run build
   # Output: built in 5.49s (exited 0)
   # dist/index.html (0.92 kB)
   # dist/assets/index-DSQE0CZz.css (25.65 kB)
   # dist/assets/index-DVZ-FukK.js (720.47 kB)
   ```

---

## 4. Integration Contracts for Engineer 2

Every data-interacting component and adapter method contains searchable backend hooks formatted as:
`// TODO: [BACKEND_HOOK] - <Method/Endpoint or Supabase Query> - <Expected Payload & Return Type>`

Key REST endpoints anticipated:
* `GET /api/v1/products` & `POST /api/v1/products`
* `GET /api/v1/plans` & `POST /api/v1/plans`
* `GET /api/v1/subscriptions` & `PATCH /api/v1/subscriptions/:id/transition`
* `POST /api/v1/billing/batch-run`
* `GET /api/v1/invoices` & `PATCH /api/v1/invoices/:id/status`
* `POST /api/v1/payments`
* `GET /api/v1/analytics/finance-metrics`
