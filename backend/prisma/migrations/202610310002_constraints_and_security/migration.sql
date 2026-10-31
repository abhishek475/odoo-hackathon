-- This API owns access control. Browser/Data API roles receive no access to these tables.
-- Backend database connections use a trusted server-only role; never expose DATABASE_URL.
DO $$
DECLARE tab record;
BEGIN
  FOR tab IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'bl\_%' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tab.tablename);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', tab.tablename);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', tab.tablename);
    END IF;
  END LOOP;
END $$;

ALTER TABLE bl_users ADD CONSTRAINT bl_users_email_lowercase CHECK (email = lower(email));
ALTER TABLE bl_products ADD CONSTRAINT bl_product_prices_nonnegative CHECK ("salesPrice" >= 0 AND "costPrice" >= 0);
ALTER TABLE bl_tax_rules ADD CONSTRAINT bl_tax_rate_range CHECK (rate >= 0 AND rate <= 100);
ALTER TABLE bl_plans ADD CONSTRAINT bl_plan_validity CHECK (price >= 0 AND "minQuantity" >= 1 AND ("validTo" IS NULL OR "validTo" >= "validFrom"));
ALTER TABLE bl_quotation_templates ADD CONSTRAINT bl_template_validity CHECK ("validityDays" BETWEEN 1 AND 365);
ALTER TABLE bl_quotation_template_lines ADD CONSTRAINT bl_template_quantity CHECK (quantity > 0);
ALTER TABLE bl_subscriptions ADD CONSTRAINT bl_subscription_validity CHECK ("expiryDate" >= "startDate" AND "paymentTermsDays" >= 0 AND "planPrice" >= 0);
ALTER TABLE bl_subscription_lines ADD CONSTRAINT bl_subscription_line_values CHECK (quantity > 0 AND "unitPrice" >= 0 AND "taxRate" BETWEEN 0 AND 100);
ALTER TABLE bl_discount_rules ADD CONSTRAINT bl_discount_values CHECK (
  value >= 0 AND (type <> 'PERCENTAGE' OR value <= 100) AND "minSpend" >= 0 AND "minQuantity" >= 0
  AND "usageCount" >= 0 AND ("maxUses" IS NULL OR ("maxUses" > 0 AND "usageCount" <= "maxUses"))
  AND ("validTo" IS NULL OR "validTo" >= "validFrom")
);
ALTER TABLE bl_invoices ADD CONSTRAINT bl_invoice_values CHECK (
  "periodEnd" > "periodStart" AND "dueDate" >= "issueDate" AND subtotal >= 0 AND "discountTotal" >= 0
  AND "discountTotal" <= subtotal AND "taxTotal" >= 0 AND total = subtotal - "discountTotal" + "taxTotal"
  AND "paidAmount" >= 0 AND "paidAmount" <= total
  AND (status <> 'PAID' OR "paidAmount" = total)
);
ALTER TABLE bl_invoice_lines ADD CONSTRAINT bl_invoice_line_values CHECK (
  quantity > 0 AND "unitPrice" >= 0 AND "taxRate" BETWEEN 0 AND 100 AND subtotal >= 0
  AND discount >= 0 AND discount <= subtotal AND tax >= 0 AND total = subtotal - discount + tax
);
ALTER TABLE bl_discount_redemptions ADD CONSTRAINT bl_redemption_positive CHECK (amount > 0);
ALTER TABLE bl_payments ADD CONSTRAINT bl_payment_positive CHECK (amount > 0);
CREATE INDEX bl_invoices_issue_date ON bl_invoices ("issueDate");
CREATE INDEX bl_invoices_customer_issue_date ON bl_invoices ("customerId", "issueDate");
