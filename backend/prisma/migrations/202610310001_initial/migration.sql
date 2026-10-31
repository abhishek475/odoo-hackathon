-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'CASH', 'MANUAL');

-- CreateTable
CREATE TABLE "bl_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "salesPrice" DECIMAL(14,4) NOT NULL,
    "costPrice" DECIMAL(14,4) NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_product_variants" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" DECIMAL(14,4) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bl_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_tax_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bl_tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,
    "cadence" "Cadence" NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "autoClose" BOOLEAN NOT NULL DEFAULT true,
    "allowPause" BOOLEAN NOT NULL DEFAULT false,
    "allowEarlyClose" BOOLEAN NOT NULL DEFAULT false,
    "allowRenew" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bl_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_quotation_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "bl_quotation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_quotation_template_lines" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "taxRuleId" UUID,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "bl_quotation_template_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_subscriptions" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" DATE NOT NULL,
    "expiryDate" DATE NOT NULL,
    "nextBillingDate" DATE NOT NULL,
    "billingAnchor" DATE NOT NULL,
    "quoteValidUntil" DATE,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 14,
    "planPrice" DECIMAL(14,4) NOT NULL,
    "cadence" "Cadence" NOT NULL,
    "pausedAt" DATE,
    "closedAt" DATE,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_subscription_lines" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "taxRuleId" UUID,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "taxName" TEXT,
    "taxRate" DECIMAL(9,6) NOT NULL,

    CONSTRAINT "bl_subscription_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_discount_rules" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "minSpend" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "maxUses" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "productId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bl_discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_subscription_discounts" (
    "subscriptionId" UUID NOT NULL,
    "discountId" UUID NOT NULL,

    CONSTRAINT "bl_subscription_discounts_pkey" PRIMARY KEY ("subscriptionId","discountId")
);

-- CreateTable
CREATE TABLE "bl_invoices" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discountTotal" DECIMAL(14,2) NOT NULL,
    "taxTotal" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_invoice_lines" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "productId" UUID,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,4) NOT NULL,
    "taxName" TEXT,
    "taxRate" DECIMAL(9,6) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2) NOT NULL,
    "tax" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "bl_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_discount_redemptions" (
    "id" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "bl_discount_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_payments" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paymentDate" DATE NOT NULL,
    "note" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bl_users_email_key" ON "bl_users"("email");

-- CreateIndex
CREATE INDEX "bl_products_name_idx" ON "bl_products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bl_product_variants_productId_name_key" ON "bl_product_variants"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "bl_tax_rules_name_key" ON "bl_tax_rules"("name");

-- CreateIndex
CREATE INDEX "bl_quotation_template_lines_templateId_idx" ON "bl_quotation_template_lines"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "bl_subscriptions_number_key" ON "bl_subscriptions"("number");

-- CreateIndex
CREATE INDEX "bl_subscriptions_status_nextBillingDate_idx" ON "bl_subscriptions"("status", "nextBillingDate");

-- CreateIndex
CREATE INDEX "bl_subscriptions_customerId_status_idx" ON "bl_subscriptions"("customerId", "status");

-- CreateIndex
CREATE INDEX "bl_subscription_lines_subscriptionId_idx" ON "bl_subscription_lines"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "bl_discount_rules_code_key" ON "bl_discount_rules"("code");

-- CreateIndex
CREATE INDEX "bl_subscription_discounts_discountId_idx" ON "bl_subscription_discounts"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "bl_invoices_number_key" ON "bl_invoices"("number");

-- CreateIndex
CREATE INDEX "bl_invoices_customerId_status_idx" ON "bl_invoices"("customerId", "status");

-- CreateIndex
CREATE INDEX "bl_invoices_status_dueDate_idx" ON "bl_invoices"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "bl_invoices_subscriptionId_periodStart_periodEnd_key" ON "bl_invoices"("subscriptionId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "bl_invoice_lines_invoiceId_idx" ON "bl_invoice_lines"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "bl_discount_redemptions_discountId_invoiceId_key" ON "bl_discount_redemptions"("discountId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "bl_payments_idempotencyKey_key" ON "bl_payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "bl_payments_invoiceId_idx" ON "bl_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "bl_payments_paymentDate_idx" ON "bl_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "bl_audit_logs_entityType_entityId_idx" ON "bl_audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "bl_product_variants" ADD CONSTRAINT "bl_product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "bl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_quotation_templates" ADD CONSTRAINT "bl_quotation_templates_planId_fkey" FOREIGN KEY ("planId") REFERENCES "bl_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_quotation_template_lines" ADD CONSTRAINT "bl_quotation_template_lines_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "bl_quotation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_quotation_template_lines" ADD CONSTRAINT "bl_quotation_template_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "bl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_quotation_template_lines" ADD CONSTRAINT "bl_quotation_template_lines_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "bl_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_quotation_template_lines" ADD CONSTRAINT "bl_quotation_template_lines_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "bl_tax_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscriptions" ADD CONSTRAINT "bl_subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "bl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscriptions" ADD CONSTRAINT "bl_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "bl_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscription_lines" ADD CONSTRAINT "bl_subscription_lines_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "bl_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscription_lines" ADD CONSTRAINT "bl_subscription_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "bl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscription_lines" ADD CONSTRAINT "bl_subscription_lines_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "bl_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscription_lines" ADD CONSTRAINT "bl_subscription_lines_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "bl_tax_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_discount_rules" ADD CONSTRAINT "bl_discount_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "bl_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscription_discounts" ADD CONSTRAINT "bl_subscription_discounts_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "bl_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_subscription_discounts" ADD CONSTRAINT "bl_subscription_discounts_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "bl_discount_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_invoices" ADD CONSTRAINT "bl_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "bl_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_invoices" ADD CONSTRAINT "bl_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "bl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_invoice_lines" ADD CONSTRAINT "bl_invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "bl_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_discount_redemptions" ADD CONSTRAINT "bl_discount_redemptions_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "bl_discount_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_discount_redemptions" ADD CONSTRAINT "bl_discount_redemptions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "bl_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_payments" ADD CONSTRAINT "bl_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "bl_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_payments" ADD CONSTRAINT "bl_payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "bl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_audit_logs" ADD CONSTRAINT "bl_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "bl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
