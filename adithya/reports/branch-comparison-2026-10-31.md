# Cross-branch review — 2026-10-31

## Reviewed commits
- main: 23a73614af267f0c1328377f2623d50096b242a2 (README only).
- adithya-branch: 134eac552e90160fb6418bfe23cfb2597dc0c729.
- devang: 4757370080c54572596a36c4ff59a628e7dbec6c.
- abhishek: 8f33acd128f610a0fcd68956eef4699f0b0d3689.

Remote refs refreshed with `git fetch origin` (exit 0). Other branches were exported using `git archive` to /tmp/brightloop-branch-review; checkout and branches were not changed.

## Findings and integration recommendation
1. Preserve Adithya's newer frontend catalog, accessible workspace states, navigation fixes and API configuration. Comparing src with Devang's frontend/src shows those improvements are missing in Devang's snapshot.
2. Devang supplies frontend/backend folders and root orchestration scripts. This layout is reusable, but it is not a live integrated application. frontend/src/services/apiAdapter.ts defines fetchBackend only once with no callers; data operations remain local.
3. Devang backend starts and answers requests, but repository/dataStore.ts stores records in arrays. Importing supabaseAdmin does not establish durable database integration.
4. Devang backend/src/routes/catalog.routes.ts has no requireAuth/requireRole on product and plan writes. A disposable runtime check confirmed unauthenticated POST /api/v1/products returns 201. middleware/authMiddleware.ts accepts x-demo-role without an environment gate, and requireRole permits unauthenticated fallback-mode calls. config/env.ts supplies a static development JWT secret; index.ts permits origins even when not allowlisted. These must be resolved before treating the backend as deployable.
5. Abhishek implements authenticated /api routes, Prisma bl_* tables, decimal money strings, Supabase sessions and invoice/report/payment services. Devang uses /api/v1, unprefixed tables, numeric frontend models and different auth. Both backend trees cannot be combined by a simple merge. Agree on one schema, migration history, money/currency representation and API contract first.
6. Abhishek's README and server.ts require configured PostgreSQL/Supabase and connect the database before listening. No live service credentials were inspected or used. Automatic billing scheduling is separate according to his README. No test script is configured in his package.json.

Recommended review scope: retain Adithya's frontend improvements within Devang's monorepo layout, then integrate an owner-confirmed backend contract (Abhishek's persistent API is a candidate, not an approved choice). Do not apply either migration set to a shared database during review. No combined candidate has been validated, so none is recommended for main yet.

## Exact validation
### Adithya checkout
- `npm run typecheck`: PASS.
- `npx vitest run --exclude 'adithya/**'`: PASS, 4 files / 19 tests.
- `npm run build`: PASS; 722.36 kB JS bundle, >500 kB warning.
- Earlier `npm test`: FAIL because it discovers private backend-reference tests requiring missing zod; 43 discovered tests passed but one suite failed. Required default gate therefore needs test-discovery correction before publication.
### Devang frontend temporary export
Used installed frontend dependencies through a temporary node_modules symlink to the checkout; no independent locked install was claimed.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 1 file / 6 tests.
- `npm run build`: PASS; 720.47 kB JS bundle, >500 kB warning.
### Devang backend temporary export
- `npm ci --ignore-scripts --no-audit --no-fund`: PASS, 169 packages.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 1 file / 9 tests.
- `npm run build`: PASS.
- `PORT=4011 node dist/index.js`: started in LOCAL_IN_MEMORY_FALLBACK mode; stopped after checks.
- Node fetch smoke checks: GET /health, /api/v1/products, /api/v1/subscriptions and /api/v1/analytics/finance-metrics each returned 200.
- Unauthenticated POST /api/v1/products with a temporary valid product returned 201, confirming missing write authorization. This changed only disposable process memory.
### Abhishek temporary export
- `npm ci --no-audit --no-fund`: stalled without completion; cancelled.
- Retry `npm ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000`: also stalled and stopped. No definitive package/network cause established.
- Typecheck, build, live database, auth, payment and email behavior remain UNVERIFIED; dependencies were not fully installed.

No browser interaction, customer-isolation integration, deployment or 10,000-record dashboard SLA result is claimed for any branch.

## Changed files and publication
- adithya/reports/branch-comparison-2026-10-31.md: this evidence and integration handoff.
- adithya/team-chat.txt: review request citing commits, findings and checks.
No application source files changed. No commits, pushes, PRs or merges were performed. Current default test gate does not pass. Team-leader approval to open a PR and subsequent approval of its current changes plus authorization to merge remain required. Exclude collaboration/agent files from any future application PR and preserve existing main README content.

## Owner-authorized safe publication follow-up

The owner authorized safe branch publication after comparison. The earlier findings above describe the pre-fix snapshot. The frontend default test gate is now corrected; backend/integration findings remain unresolved.

Changed files:
- `vite.config.ts`: use the typed Vitest configuration helper and discover test/spec files only beneath `src/`. This prevents private automation copies and unrelated backend reference tests from entering the frontend gate; existing application tests still run. Vite plugins and alias remain in the same shared configuration.
- `adithya/reports/branch-comparison-2026-10-31.md`: comparison evidence and this fix/validation/publication handoff.
- `adithya/team-chat.txt`: leader decision and review request.

Exact commands after the fix:
- `npm run lint`: PASS (TypeScript checking only).
- `npm run typecheck`: PASS.
- `npm test`: PASS, 4 application test files / 19 tests.
- `npm run build`: PASS, 722.36 kB JavaScript bundle; existing >500 kB warning remains.
- `git diff --check`: PASS.

Publication scope: these three files on `adithya-branch` only. No other branch code was imported, no migrations ran, and no production/authentication integration claim is made. Main still requires a separately reviewed application-only PR and explicit team-leader merge authorization. Actual pushed application commit will be recorded in the subsequent team-chat handoff after remote verification.
