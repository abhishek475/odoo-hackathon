-- ==============================================================================
-- Brightloop Subscription Platform - Database Seed
-- Migration: seed.sql
-- ==============================================================================

-- USERS (Password for all: 'Brightloop#2026' -> bcrypt hash)
INSERT INTO users (id, name, email, password_hash, role, company_name, avatar_url) VALUES
('usr-admin-1', 'Alexandra Vance', 'alexandra.vance@brightloop.io', '$2a$10$wT0o3s3.1.Zz1L/h1WqNteT8O0E7p5iT0e7F6e6X9A5e5B5C5D5E.', 'Admin', 'Brightloop Systems Inc.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('usr-staff-1', 'Marcus Brody', 'marcus.brody@brightloop.io', '$2a$10$wT0o3s3.1.Zz1L/h1WqNteT8O0E7p5iT0e7F6e6X9A5e5B5C5D5E.', 'Staff', 'Brightloop Operations', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('usr-customer-1', 'Elena Rostova', 'elena@novacloud.tech', '$2a$10$wT0o3s3.1.Zz1L/h1WqNteT8O0E7p5iT0e7F6e6X9A5e5B5C5D5E.', 'Customer', 'NovaCloud Technologies LLC', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
ON CONFLICT (id) DO NOTHING;

-- BILLING PLANS
INSERT INTO billing_plans (id, name, cadence, min_quantity, validity_days, auto_close, pause_permission, base_price_cents, description) VALUES
('plan-daily', 'Daily Flex Tier', 'DAILY', 1, 30, false, true, 4500, 'On-demand daily metered cadence for rapid scale and bursting environments.'),
('plan-monthly', 'Pro Monthly Cadence', 'MONTHLY', 1, 365, false, true, 125000, 'Billed on the 1st of every month with standard overage reconciliation.'),
('plan-yearly', 'Enterprise Annual Commitment', 'YEARLY', 1, 730, true, false, 1250000, 'Prepaid annual plan offering 20% discount on all core platform services.')
ON CONFLICT (id) DO NOTHING;

-- PRODUCTS (Including Odoo +560 brand modifier)
INSERT INTO products (id, name, type, sales_price_cents, cost_price_cents, notes, active) VALUES
('prod-001', 'Dedicated Kubernetes Cluster', 'SERVICE', 85000, 42000, 'Managed multi-region K8s control plane with autoscaling worker nodes.', true),
('prod-002', 'Enterprise DB Storage & Replication', 'SERVICE', 32000, 11000, 'Distributed PostgreSQL engine with point-in-time recovery and zero-lag streaming replication.', true),
('prod-003', 'AI Real-time Inference Gateway', 'SERVICE', 49000, 20000, 'Low-latency edge caching and model gateway with dynamic load shedding.', true),
('prod-004', '24/7 Dedicated Support & SLA Shield', 'SERVICE', 60000, 15000, '15-minute response SLA with dedicated site reliability engineers on standby.', true),
('prod-005', 'Odoo Enterprise Suite Connector', 'SERVICE', 56000, 18000, 'Certified Odoo connector supporting automated journal entries, GL syncing, and recurring invoice webhooks.', true)
ON CONFLICT (id) DO NOTHING;

-- PRODUCT VARIANTS (With +560 brand modifier and HA tiers)
INSERT INTO product_variants (id, product_id, name, price_modifier_cents, sku) VALUES
('var-001-1', 'prod-001', '3-Node High Availability', 0, 'K8S-3N-HA'),
('var-001-2', 'prod-001', '5-Node High Availability', 40000, 'K8S-5N-HA'),
('var-001-3', 'prod-001', 'Bare Metal GPU Enabled', 120000, 'K8S-GPU-BM'),
('var-002-1', 'prod-002', '1TB NVMe Tier', 0, 'DB-1TB-NVME'),
('var-002-2', 'prod-002', '5TB NVMe Tier', 45000, 'DB-5TB-NVME'),
('var-005-1', 'prod-005', 'Standard Odoo Sync (+560 Modifier)', 56000, 'ODOO-SYNC-560')
ON CONFLICT (id) DO NOTHING;

-- DISCOUNT RULES
INSERT INTO discount_rules (id, code, name, type, value_cents_or_pct, min_order_amount_cents, valid_until, active, usage_count) VALUES
('disc-01', 'BRIGHTLOOP20', 'Q4 2026 Enterprise Growth Promo', 'PERCENT', 20, 200000, '2026-12-31', true, 42),
('disc-02', 'AIACCEL500', 'AI Inference Onboarding Credit', 'FIXED', 50000, 150000, '2026-11-30', true, 19),
('disc-03', 'STARTUPSEED', 'Y Combinator Partner Allowance', 'PERCENT', 15, 50000, '2027-06-30', true, 128)
ON CONFLICT (id) DO NOTHING;

-- SUBSCRIPTIONS
INSERT INTO subscriptions (id, subscription_number, customer_id, customer_name, customer_email, plan_id, plan_name, cadence, status, start_date, next_billing_date, total_amount_cents, notes, lines, history) VALUES
('sub-1001', 'SUB-2026-0014', 'usr-customer-1', 'NovaCloud Technologies LLC', 'elena@novacloud.tech', 'plan-monthly', 'Pro Monthly Cadence', 'MONTHLY', 'Active', '2026-01-01', '2026-11-01', 226000, 'Critical production cluster.',
 '[{"id":"l1","productId":"prod-001","productName":"Dedicated Kubernetes Cluster","quantity":1,"unitPrice":1250,"discountPercent":0,"lineTotal":1250}]'::jsonb,
 '[{"date":"2026-01-01","action":"Activated","performedBy":"System Scheduler"}]'::jsonb),
('sub-1002', 'SUB-2026-0028', 'cust-apex', 'Apex Data Dynamics', 'billing@apexdata.io', 'plan-monthly', 'Pro Monthly Cadence', 'MONTHLY', 'Paused', '2026-02-15', '2026-11-15', 148000, 'Paused for migration window.',
 '[{"id":"l2","productId":"prod-001","productName":"Dedicated Kubernetes Cluster","quantity":1,"unitPrice":850,"discountPercent":0,"lineTotal":850}]'::jsonb,
 '[{"date":"2026-10-15","action":"Paused","performedBy":"Marcus Brody"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- INVOICES
INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, customer_name, customer_email, customer_address, status, issue_date, due_date, subtotal_cents, discount_amount_cents, tax_amount_cents, total_amount_cents, amount_paid_cents, amount_due_cents, lines, payment_history) VALUES
('inv-8001', 'INV-2026-0891', 'sub-1001', 'usr-customer-1', 'NovaCloud Technologies LLC', 'elena@novacloud.tech', '440 Mission St, San Francisco, CA', 'Paid', '2026-10-01', '2026-10-15', 202000, 0, 20200, 222200, 222200, 0,
 '[{"id":"il1","productName":"Dedicated Kubernetes Cluster","quantity":1,"unitPrice":1250,"lineTotal":1250}]'::jsonb,
 '[{"id":"pay-001","amount":2222,"paymentDate":"2026-10-04T12:30:00Z","paymentMethod":"CARD","referenceNumber":"STRIPE_CH_948194821","status":"SUCCESS"}]'::jsonb),
('inv-8002', 'INV-2026-0944', NULL, 'cust-synapse', 'Synapse Fintech Systems', 'ops@synapsepay.com', '100 Montgomery St, San Francisco, CA', 'Confirmed', '2026-10-20', '2026-11-03', 310000, 0, 31000, 341000, 0, 341000,
 '[{"id":"il2","productName":"Dedicated Kubernetes Cluster x2","quantity":2,"unitPrice":1250,"lineTotal":2500}]'::jsonb,
 '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- PAYMENTS
INSERT INTO payments (id, invoice_id, invoice_number, customer_id, customer_name, amount_cents, payment_method, reference_number, payment_date, status, notes) VALUES
('pay-001', 'inv-8001', 'INV-2026-0891', 'usr-customer-1', 'NovaCloud Technologies LLC', 222200, 'CARD', 'STRIPE_CH_948194821', '2026-10-04T12:30:00Z', 'SUCCESS', 'Auto-charged corporate card ending in 4242')
ON CONFLICT (id) DO NOTHING;
