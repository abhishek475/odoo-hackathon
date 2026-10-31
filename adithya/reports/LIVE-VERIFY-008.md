# Live Verification Report: Schema Deployment, Auth, Billing Workflow, and Security Isolation

**Date:** 2026-10-31  
**Identifier:** `LIVE-VERIFY-008`  
**Execution Context:** Real live Supabase PostgreSQL database + Supabase Auth service + Express API (`backend/`)

---

## 1. Summary of Blockers Resolved

1. **IPv4 / Direct Connection Resolution**:
   - `db.ggzwzvwoepcqaxrhponc.supabase.co:5432` was unreachable on IPv4 environments (`Network is unreachable` due to IPv6-only AAAA record).
   - Resolved by configuring the official Supabase session pooler on `aws-0-eu-west-1.pooler.supabase.com:5432` with username `postgres.ggzwzvwoepcqaxrhponc` and local CA certificate pointing to `backend/.env.supabase-ca.crt` with `sslmode=verify-full`.
   
2. **Schema Alignment & Migration Deployment (P3005 Resolved)**:
   - Evaluated existing public tables (`billing_plans`, `discount_rules`, `invoices`, `payments`, `product_variants`, `products`, `quotation_templates`, `subscriptions`, `users`) with existing records. All 9 tables and their rows were 100% preserved.
   - Applied `202610310001_initial` and `202610310002_constraints_and_security` SQL migrations establishing all 16 `bl_*` tables and enums without naming collision.
   - Baselined with `prisma migrate resolve --applied`. Subsequent `npm run db:migrate` reports: `No pending migrations to apply. Database schema is up to date!`
   - Verified that all 16 Prisma models are accessible via `db[model].count()`.

---

## 2. Live Verification Results

A comprehensive live end-to-end suite was executed against the real API and database. All 8 phases passed:

### Phase 1: Account Provisioning & Admin Bootstrap
- Live Supabase Auth accounts created for Admin (`verified.admin@brightloop.test`), Customer 1 (`verified.cust1@brightloop.test`), and Customer 2 (`verified.cust2@brightloop.test`).
- Admin user successfully bootstrapped into `bl_users` with role `ADMIN`.
- All three users signed in via `POST /api/auth/login`, receiving real JWT tokens.
- `GET /api/me` confirmed database-backed roles: Admin -> `ADMIN`, Cust 1 & 2 -> `CUSTOMER`.

### Phase 2: Role-Based Access Control (RBAC)
- Customer attempted `POST /api/products` -> rejected with `403 FORBIDDEN` (`FORBIDDEN`).
- Customer attempted `GET /api/products` (staff/admin route) -> rejected with `403 FORBIDDEN`.

### Phase 3: Catalog Setup (Admin)
- Created Tax Rule: `POST /api/tax-rules` (Rate: 10%).
- Created Product: `POST /api/products` ($120.00).
- Created Variant: `POST /api/products/:id/variants` (+$30.00 modifier).
- Created Plan: `POST /api/plans` ($150.00 Monthly Pro, cadence `MONTHLY`, `allowPause: true`, `allowEarlyClose: true`, `allowRenew: true`).
- Created Discount Rule: `POST /api/discounts` (Fixed $20.00 discount).
- Created Quotation Template: `POST /api/quotation-templates` with line references.

### Phase 4: Subscription Lifecycle
- Created subscription for Customer 1: `POST /api/subscriptions` -> initialized in `DRAFT`.
- Attached discount: `POST /api/subscriptions/:id/discounts` -> 201 Created.
- Transition `quote`: `POST /api/subscriptions/:id/quote` -> `QUOTATION`.
- Transition `confirm`: `POST /api/subscriptions/:id/confirm` -> `CONFIRMED`.
- Transition `activate`: `POST /api/subscriptions/:id/activate` -> `ACTIVE`.
- Transition `pause`: `POST /api/subscriptions/:id/pause` -> `PAUSED`.
- Transition `resume`: `POST /api/subscriptions/:id/resume` -> `ACTIVE`.
- Transition validation: attempting to activate an already `ACTIVE` subscription rejected with `409 INVALID_TRANSITION`.

### Phase 5: Invoicing & Payment Idempotency
- Generated invoice for due period: `POST /api/subscriptions/:id/invoices` -> Subtotal $450.00, Discount -$20.00, Tax +$0.29, Total $430.29 (`DRAFT`).
- Confirmed invoice: `POST /api/invoices/:id/confirm` -> `CONFIRMED`.
- Partial Payment ($100.00): `POST /api/invoices/:id/payments` with `Idempotency-Key: PAY-*-001` -> 201 Created, paidAmount $100.00, outstanding $330.29.
- Idempotency Test: Retried exact same payment payload with same `Idempotency-Key` -> 200 OK, `replayed: true`. Direct database inspection confirmed exactly 1 payment record in `bl_payments`.
- Final Settlement: Paid remainder of $330.29 with `Idempotency-Key: PAY-*-002` -> invoice status transitioned to `PAID`.
- Overpayment Rejection: Payment on `PAID` invoice rejected with `409 INVOICE_NOT_PAYABLE`.

### Phase 6: Cross-Customer Isolation & Printable HTML
- Customer 1 fetched own invoice (`GET /api/invoices/:id`) -> 200 OK.
- Customer 1 fetched printable HTML invoice (`GET /api/invoices/:id/print`) -> 200 text/html.
- Customer 2 attempted to read Customer 1's invoice (`GET /api/invoices/:id`) -> `404 NOT_FOUND` (enforcing ownership boundary).
- Customer 2 attempted to fetch Customer 1's printable HTML -> `404 NOT_FOUND`.
- Customer 2 attempted to read Customer 1's subscription -> `404 NOT_FOUND`.

### Phase 7: Subscription Close & Renewal
- Closed subscription: `POST /api/subscriptions/:id/close` -> `CLOSED`.
- Renewed subscription with new expiry: `POST /api/subscriptions/:id/renew` -> `ACTIVE`.

### Phase 8: SMTP Verification
- Nodemailer transport verified against `smtp.gmail.com:465` with `SMTP_SECURE=true` -> connection, TLS handshake, and authentication successful.

---

## 3. Validation Gates

- `npm run env:check`: PASS
- `npm run check`: PASS
  - Frontend TypeScript lint: PASS
  - Frontend typecheck: PASS
  - Backend typecheck: PASS
  - Frontend test suite (33 tests, 6 files): PASS
  - Backend HTTP test suite (9 tests): PASS
  - Frontend production build (`vite build`): PASS
  - Backend production build (`prisma generate && tsc`): PASS
