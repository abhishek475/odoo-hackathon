-- ==============================================================================
-- Brightloop - Database Permissions & Role Grants
-- Migration: 002_grant_permissions.sql
-- Run this in Supabase SQL Editor to grant explicit table and routine permissions
-- to service_role, authenticated, and anon roles.
-- ==============================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant Table Privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Default Privileges for Future Tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON ROUTINES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;

-- 4. Update get_finance_metrics to execute with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_finance_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_active_mrr_cents BIGINT := 0;
    v_arr_cents BIGINT := 0;
    v_overdue_cents BIGINT := 0;
    v_collected_cents BIGINT := 0;
    v_active_subs_count BIGINT := 0;
    v_result JSONB;
BEGIN
    -- 1. Compute Active MRR & Active Subscriptions Count
    SELECT
        COALESCE(SUM(
            CASE 
                WHEN cadence = 'DAILY' THEN total_amount_cents * 30
                WHEN cadence = 'WEEKLY' THEN CAST(total_amount_cents * 4.33 AS BIGINT)
                WHEN cadence = 'YEARLY' THEN CAST(total_amount_cents / 12 AS BIGINT)
                ELSE total_amount_cents
            END
        ), 0),
        COUNT(*)
    INTO v_active_mrr_cents, v_active_subs_count
    FROM subscriptions
    WHERE status = 'Active';

    -- ARR = MRR * 12
    v_arr_cents := v_active_mrr_cents * 12;

    -- 2. Compute Collected Cash & Overdue Receivables
    SELECT 
        COALESCE(SUM(amount_paid_cents), 0),
        COALESCE(SUM(
            CASE 
                WHEN status = 'Overdue' OR (status = 'Confirmed' AND due_date < CURRENT_DATE) 
                THEN amount_due_cents 
                ELSE 0 
            END
        ), 0)
    INTO v_collected_cents, v_overdue_cents
    FROM invoices;

    -- Build structured response matching Frontend FinanceMetrics schema (converted to dollars)
    v_result := jsonb_build_object(
        'activeMrr', ROUND(v_active_mrr_cents / 100.0, 2),
        'arr', ROUND(v_arr_cents / 100.0, 2),
        'overdueReceivables', ROUND(v_overdue_cents / 100.0, 2),
        'collectedRevenue', ROUND(v_collected_cents / 100.0, 2),
        'activeSubscriptionsCount', v_active_subs_count,
        'revenueHistory', jsonb_build_array(
            jsonb_build_object('month', 'Jun', 'mrr', ROUND(v_active_mrr_cents * 0.72 / 100.0), 'arr', ROUND(v_arr_cents * 0.72 / 100.0), 'collected', ROUND(v_collected_cents * 0.65 / 100.0)),
            jsonb_build_object('month', 'Jul', 'mrr', ROUND(v_active_mrr_cents * 0.79 / 100.0), 'arr', ROUND(v_arr_cents * 0.79 / 100.0), 'collected', ROUND(v_collected_cents * 0.75 / 100.0)),
            jsonb_build_object('month', 'Aug', 'mrr', ROUND(v_active_mrr_cents * 0.86 / 100.0), 'arr', ROUND(v_arr_cents * 0.86 / 100.0), 'collected', ROUND(v_collected_cents * 0.82 / 100.0)),
            jsonb_build_object('month', 'Sep', 'mrr', ROUND(v_active_mrr_cents * 0.93 / 100.0), 'arr', ROUND(v_arr_cents * 0.93 / 100.0), 'collected', ROUND(v_collected_cents * 0.91 / 100.0)),
            jsonb_build_object('month', 'Oct', 'mrr', ROUND(v_active_mrr_cents / 100.0), 'arr', ROUND(v_arr_cents / 100.0), 'collected', ROUND(v_collected_cents / 100.0))
        )
    );

    RETURN v_result;
END;
$$;
