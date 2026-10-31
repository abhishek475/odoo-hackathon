# Frontend/backend integration

The owner confirmed Abhishek's `bl_*` schema on 2026-10-31. `backend/README.md` documents the inspected API contracts. The default entry in `frontend/src/main.tsx` loads `live/ConnectedApp.tsx`, using `services/liveApi.ts`; it does not load local mock billing data. `VITE_APP_MODE=demo` explicitly selects the preserved older demo.

The public `VITE_API_BASE_URL` defaults to `/api` through the Vite development proxy, or can be set to `http://localhost:4000/api`. Deployment must route `/api` to Express or set the public backend URL. Only server `.env` files hold database/service credentials.

The HTTP client sends Bearer tokens, handles the `{data,pagination}` response and `{error:{code,message,details,requestId}}` errors, refreshes expired access once, and retains monetary strings. Login/signup/reset/invitation flows use the confirmed auth endpoints. Signup never submits a role; `/me` supplies the authoritative application role. Session tokens remain in memory. The backend owns all authorization, calculations and persistence.

List pages use server-side pages of 20 records and supported search/status filters. Reference choosers also page on the server. Subscription forms accept either product lines with a plan, or a configured quotation template. Invoice generation uses the returned nextBillingDate as the explicit period. Receipt submissions use the inspected payment methods and a stable Idempotency-Key for unchanged retries. Printing fetches authenticated HTML into a script-disabled sandboxed preview. Finance reads `/reports/summary` without fabricated trend data or client billing computations.

The actual Supabase direct/session DATABASE_URL is still required. No database migrations have been applied during integration. Live auth, customer ownership enforcement against a real database, billing persistence, SMTP and representative performance remain unverified. No automatic scheduler or payment gateway is configured. The incompatible Devang `/api/v1` backend/schema and demo-role authorization are not combined with `bl_*`; Devang's monorepo and CRUD/auth intent are implemented through the selected backend instead.
