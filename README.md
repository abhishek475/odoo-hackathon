# Brightloop Software — Subscription Management & Recurring Billing System

Production-grade subscription management and recurring billing platform engineered for high-throughput billing cycles, real-time financial analytics (< 2.0s SLA), and zero-failure fallback operation.

---

## 📁 Repository Structure

```text
odoo-hackathon/
├── frontend/                     # React + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Badges, Steppers, Currency Formatter
│   │   ├── context/              # AppStateContext (Dual-mode state store)
│   │   ├── pages/                # 9 interactive portal pages
│   │   │   ├── dashboard/        # Finance Lead Executive Dashboard (MRR, ARR, overdue)
│   │   │   ├── catalog/          # Products, Variants (+560 modifier), Billing Plans
│   │   │   ├── subscriptions/    # Subscription table & Quotation Builder
│   │   │   ├── billing/          # Invoices CRUD & printable PDF tax invoice view
│   │   │   ├── discounts/        # Discount coupon code & threshold manager
│   │   │   ├── payments/         # Payment recording & automated invoice reconciliation
│   │   │   ├── auth/             # Staff creation & role switcher
│   │   │   └── customer/         # Self-service customer portal
│   │   ├── services/             # apiAdapter (Zero-failure live backend + mock fallback)
│   │   └── mocks/                # 2,500-subscription high-volume generator (< 30ms)
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express + TypeScript Backend
│   ├── supabase/
│   │   ├── migrations/
│   │   │   └── 001_init_brightloop_schema.sql  # Schema, RLS, Indexes, RPC function
│   │   └── seed.sql              # Initial products, plans, discounts, subscriptions
│   ├── src/
│   │   ├── config/               # Supabase client & environment loader
│   │   ├── engine/               # State machine, discount engine, billing batch runner
│   │   ├── middleware/           # RBAC guard (admin, staff, customer) & Zod validator
│   │   ├── repository/           # DataStore with local in-memory fallback mode
│   │   ├── routes/               # 7 REST API routers aligned 1:1 with frontend
│   │   └── index.ts              # Express server entry point (Port 4000)
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                  # Root monorepo workspace runner
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Return to root
cd ..
```

### 3. Run Development Servers
From the root directory, you can run:

```bash
# Run Frontend (http://localhost:5173)
npm run dev:frontend

# Run Backend (http://localhost:4000)
npm run dev:backend
```

Or run directly inside each respective folder:
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

---

## 🗄️ Supabase Database Setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and go to the **SQL Editor**.
2. Run the migration script first:
   ```text
   backend/supabase/migrations/001_init_brightloop_schema.sql
   ```
   *Creates all enums, tables, foreign keys, B-Tree indexes, RLS policies, and the `get_finance_metrics()` aggregation RPC.*
3. Run the seed script:
   ```text
   backend/supabase/seed.sql
   ```
   *Populates initial products (including Odoo +560 connector), billing plans, discount rules, demo users, and active subscriptions.*
4. Copy your Supabase Project URL and Service Role Key to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   ```
   *Note: If credentials are not configured, the backend automatically runs in `DB_FALLBACK_MODE` using its in-memory data store without crashing.*

---

## 🧪 Testing & Validation

```bash
# Run all unit tests (Frontend + Backend)
npm test

# Run frontend tests only (6 tests)
npm run test:frontend

# Run backend tests only (9 tests)
npm run test:backend

# Production builds
npm run build
```

---

## 🛡️ Architecture & Financial Precision Highlights
- **Integer Cents Precision**: All financial calculations avoid floating-point drift by operating strictly in integer cents (e.g., `$1,250.00` = `125000` cents).
- **Sub-2-Second Finance Lead SLA**: High-throughput aggregation benchmarks compute MRR, ARR, and overdue receivables across 2,500 subscriptions in `< 30ms`.
- **Zero-Failure Dual-Mode Resilience**: The frontend automatically connects to the live backend when running, and transparently falls back to local reactive storage if offline.
