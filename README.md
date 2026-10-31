# Brightloop

React/Vite frontend and Express/Supabase Auth/PostgreSQL backend, using the owner-confirmed Abhishek `bl_*` Prisma schema. Devang's monorepo structure and CRUD/auth integration direction are reconciled with Adithya's frontend. The incompatible `/api/v1` memory backend, alternate migrations and demo-role bypass are excluded from the connected application.

## Setup

Use Node.js 24 LTS:

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Do not overwrite an existing configured `.env`. Enter the real direct or session-pooler `DATABASE_URL`, project URL, publishable key and server-only secret key in `backend/.env`. The local server environment is already populated with the supplied project URL/keys; the database connection still needs completion. Rotate previously exposed privileged keys and update the ignored file. Optional SMTP settings enable invoice email. See [backend setup and contracts](backend/README.md).

```bash
npm run env:check
# Review the shared database's migration history before this command:
npm run db:migrate
npm run dev
```

`npm run dev` starts both packages and stops them together. Frontend: http://localhost:5173. API: http://localhost:4000/api. Health: `/health`; database readiness: `/ready`. `npm run dev:frontend` and `npm run dev:backend` also run separately. Add `http://localhost:5173/reset-password` to Supabase Auth's redirect allowlist and configure Auth SMTP in Supabase. No migrations are applied automatically.

## Connected workspaces

The default application signs in through `/api/auth/login`, obtains its role from `/api/me`, and uses authenticated API requests. Signup creates customer accounts; an administrator invites staff. Establish the first administrator with the backend's `admin:bootstrap` command after the user registers and signs in. Sessions stay in memory and refresh through the API; reloading requires signing in again. Recovery/invitation links process the session fragment and remove it from browser history before password submission.

Admin/staff screens include paginated customer, catalog, template, subscription, invoice and payment records; validated create/edit forms where supported; product variants; quotation-template or product-line subscription creation; allowed lifecycle actions; server invoice generation; payment receipts with stable retry idempotency keys; invoice email/print; and server finance aggregates with date filters. Customers see their subscriptions, invoices and available plans. Server authorization and ownership checks remain authoritative. Monetary values remain decimal strings and are displayed in INR. Data and mutation failures show errors rather than local success.

The previous local demo remains in the source and can be built explicitly with `VITE_APP_MODE=demo`. It uses isolated local records and is not a live billing system. The connected app does not import the demo adapter.

## Validation and limits

```bash
npm run check
```

This runs TypeScript lint/typechecking, frontend tests, backend HTTP tests and production builds for both packages. Backend HTTP tests inject auth/database dependencies; browser smoke verification uses mocked API responses. They do not establish live Supabase authentication, database migration correctness, email delivery, production customer isolation or the 10,000-record performance target. Those checks require the configured shared services and representative data.

No automatic recurring billing scheduler is configured. Staff generate due invoices through the authoritative core API. The conflicting backend's batch runner is not run against this schema. No payment gateway, refunds or chargebacks are provided. Required leader review and GitHub checks still apply before a PR/main merge.
