# Brightloop - Engineer 2 backend

TypeScript + Node.js + Express, Supabase Auth and PostgreSQL/Prisma. Includes the API, database migrations and first-admin setup. React and the automatic billing scheduler are separate team responsibilities.

## Setup

Use Node.js 24 LTS. From this folder:

```bash
cp .env.example .env
npm ci
```

Installation automatically generates the Prisma client. Fill these values in `.env`:

- `DATABASE_URL`: Supabase direct or session-pooler PostgreSQL connection; URL-encode password characters and keep TLS verification enabled.
- `DIRECT_URL`: optional migration connection if different.
- `SUPABASE_URL`: project URL.
- `SUPABASE_PUBLISHABLE_KEY`: publishable key or legacy anon key.
- `SUPABASE_SECRET_KEY`: secret key or legacy service-role key; server only.
- `FRONTEND_URL`: React origin, default `http://localhost:5173`.
- `AUTH_REDIRECT_URL`: frontend reset/invitation page, default `http://localhost:5173/reset-password`.

Enable email/password auth in Supabase. Configure minimum password length 9, uppercase/lowercase/special characters, frontend Site URL and the redirect allowlist. Configure Supabase Auth SMTP to send invitations/reset emails to ordinary customer addresses.

Use the team's shared project. On an empty development database using this schema:

```bash
npm run db:migrate
npm run dev
```

If Engineer 1 already created tables, agree on one schema and migration history before applying these reference migrations.

API: `http://localhost:4000/api`. Browser health check: `http://localhost:4000/health`. Database check: `/ready`. There is no frontend homepage in this package.

For compiled JavaScript: `npm run build`, then `npm start`. Regenerate client manually if needed: `npm run db:generate`.

## First admin

Register with `POST /api/auth/signup`:

```json
{"email":"your-email@example.com","password":"ChooseYourOwn!9","name":"Your name"}
```

Confirm the email if required. In another terminal:

```bash
npm run admin:bootstrap -- your-email@example.com
```

Log in with `POST /api/auth/login`, body `{ "email": "...", "password": "..." }`. Send `Authorization: Bearer <data.session.access_token>` on protected requests. `GET /api/me` returns the role.

Ordinary signup creates a customer. The customer must sign in and call `/api/me` once to initialize the application profile. Admins invite staff with `POST /api/staff`, body `{email,name}`. The frontend must process Supabase recovery/invitation links before calling the protected password-update endpoint.

`scripts/bootstrap-admin.ts` is required account setup, not seed/sample data. No demo records or users are inserted.

## API quick reference

Responses use `{data: ...}`; lists include `pagination`. Use `?page=1&pageSize=20` (maximum 100). Money/rates are strings, such as `"1000.00"`; input dates are `YYYY-MM-DD`, output dates are UTC ISO strings. Unknown body fields are rejected.

| Area | Routes under `/api` |
| --- | --- |
| Authentication | POST `/auth/signup`, `/auth/login`, `/auth/refresh` (`{refreshToken}`), `/auth/forgot-password` (`{email}`), `/auth/password` (`{password}`), `/auth/logout`; GET `/me`. |
| Customers/staff | GET `/customers` (staff/admin); POST `/staff` (admin only). |
| Products | GET/POST `/products`; GET/PATCH `/products/:id`; POST `/products/:id/variants`; PATCH `/variants/:id`. Staff/admin read; admin writes. |
| Plans | GET/POST `/plans`; GET/PATCH `/plans/:id`. Authenticated users read; admin writes. |
| Rules | GET/POST `/tax-rules`, `/discounts`; PATCH `/tax-rules/:id`, `/discounts/:id`. Staff/admin read; admin writes. |
| Quote templates | GET/POST `/quotation-templates`; GET/PUT `/quotation-templates/:id`. Staff/admin. |
| Subscriptions | GET/POST `/subscriptions`; GET/PATCH `/subscriptions/:id`. Staff/admin create/edit; customers read their own. |
| Workflow | POST `/subscriptions/:id/quote`, `/confirm`, `/activate`, `/pause`, `/resume`, `/close`, `/renew`. Empty body except renewal `{newExpiryDate}`. Customer actions require ownership and plan permission. |
| Assigned discounts | POST `/subscriptions/:id/discounts` (`{discountId}`); DELETE `/subscriptions/:id/discounts/:discountId`. Staff/admin. |
| Invoice generation | POST `/subscriptions/:id/invoices`, body `{periodStart}` matching nextBillingDate. Staff/admin; same period replays the original invoice. |
| Invoice operations | GET `/invoices`, `/invoices/:id`, `/invoices/:id/print`; POST `/invoices/:id/confirm`, `/cancel`, `/send` with `{}`. Customer owners can read/print; staff/admin mutate. |
| Payments | POST `/invoices/:id/payments`; GET `/payments`. Staff/admin. |
| Finance | GET `/reports/summary`, `/reports/overdue`, `/reports/invoices.csv`. Staff/admin. |

Product body: `{name,type,salesPrice,costPrice,notes?,active?}`. Variant: `{name,priceModifier,active?}`. Tax: `{name,rate,active?}`. Set `active:false` to archive configuration records.

Plan body: `{name,price,cadence,validFrom,validTo?,minQuantity?,autoClose?,allowPause?,allowEarlyClose?,allowRenew?,active?}`. Cadence is DAILY/WEEKLY/MONTHLY/YEARLY.

Discount body: `{code,type,value,validFrom,validTo?,minSpend?,minQuantity?,maxUses?,productId?,active?}`. Type is FIXED/PERCENTAGE; usageCount is server-managed.

Template body: `{name,planId,validityDays,notes?,lines:[...]}`. Subscription body: `{customerId,planId?,templateId?,startDate,expiryDate,paymentTermsDays?,lines?}`. Supply plan+lines or a template. Each line is `{productId,variantId?,taxRuleId?,quantity}`. Totals/prices are derived server-side. Draft/quotation edits accept `{startDate?,expiryDate?,paymentTermsDays?,lines?}`.

Payment body: `{amount,method,paymentDate?,note?}` plus an `Idempotency-Key` header (8-200 letters/digits/`.`/`_`/`:`/`-`). Reuse the key and identical body when retrying one receipt. Methods: BANK_TRANSFER/CARD/CASH/MANUAL. Amounts are positive strings with at most 2 decimal places. Confirm the invoice first. Partial payment leaves it Confirmed; full settlement marks it Paid. Overpayments and future-dated receipts are rejected.

Filters: subscriptions accept `status`, `customerId`, `search`; invoices accept `status`, `customerId`, `subscriptionId`, `overdue=true`, `from`, `to`, `search`; payments accept `invoiceId`, `from`, `to`; finance accepts `customerId`, `from`, `to` where supported. Customers are always scoped to themselves. Errors use `{error:{code,message,details?,requestId}}`.

## Important integration details

- Engineer 1 can reuse/replace the shared interface and runnable manual billing logic in `src/services/core.ts`. This API does not start an automatic scheduler.
- The `bl_*` tables are blocked from Supabase browser roles by grants/RLS. Business data goes through Express. Never put secret/database credentials in React or `VITE_*` variables. Application roles are read from `bl_users`, not user-editable metadata.
- Reference currency is INR. Plan price is an additional recurring base fee (set zero for seat-only pricing), untaxed in this implementation; product lines carry configured taxes. Prices/rates are snapshotted. Agree on policy with Engineer 1.
- Discounts apply before tax, stack by code/ID and consume usage on invoice generation, including Draft. Cancellation does not restore usage. Calendar anchors survive short months/leap years. The final partial period is not prorated.
- Resume preserves a future billing date or restarts overdue billing today, skipping unbilled paused periods. It does not refund invoices or extend expiry. Quote workflow changes do not email a quotation document.
- Gross MRR/ARR exclude discounts/tax. Date filters affect issued invoice totals/payment dates; active/outstanding/overdue/MRR are current-state metrics.
- Invoice email needs optional `SMTP_*` and `EMAIL_FROM`; Auth SMTP is configured separately in Supabase. Without invoice SMTP, sending returns EMAIL_NOT_CONFIGURED. `/invoices/:id/print` returns authenticated HTML for browser Print / Save as PDF, not PDF bytes. Repeated send requests may send repeated emails.
- Payments record receipts; no payment gateway, refunds or chargebacks. Disabling a `bl_users` account blocks API access immediately; already-issued Supabase JWTs can otherwise remain valid until expiry after sign-out.
- Use HTTPS and appropriate TRUST_PROXY_HOPS in deployment. Multiple API instances need a shared rate-limit store. Live Supabase/email and the <2s performance target need validation on your configured services.
