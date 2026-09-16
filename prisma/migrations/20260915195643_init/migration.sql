-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('completed', 'under_construction');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('paid', 'as_dept');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'credit_card', 'BANK_TRANSFER', 'CHECK', 'PETTY_CASH');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "phone" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL,
    "address" TEXT NOT NULL,
    "started_in" DATE NOT NULL,
    "ended_in" DATE,
    "floors_number" INTEGER NOT NULL,
    "area" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_employees" (
    "property_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "property_employees_pkey" PRIMARY KEY ("property_id","employee_id")
);

-- CreateTable
CREATE TABLE "apartments" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "floor" INTEGER NOT NULL,
    "number" TEXT NOT NULL,

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "total_price" DECIMAL(14,2) NOT NULL,
    "paid_price" DECIMAL(14,2) NOT NULL,
    "status" "MaterialStatus" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "arrive_date" DATE NOT NULL,
    "remaining_amount" DECIMAL(14,2) NOT NULL,
    "payment_date" DATE,
    "supplier_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_expenses" (
    "id" UUID NOT NULL,
    "sender" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expense_category_id" UUID NOT NULL,
    "expense_date" DATE NOT NULL,
    "paid_to" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "receipt_number" TEXT,
    "receipt_image_url" TEXT,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "table_name" TEXT NOT NULL,
    "action_type" "AuditAction" NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "record_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apartments_property_id_floor_number_key" ON "apartments"("property_id", "floor", "number");

-- CreateIndex
CREATE INDEX "idx_materials_supplier_status" ON "materials"("supplier_id", "status");

-- CreateIndex
CREATE INDEX "idx_materials_supplier_status_covering" ON "materials"("supplier_id", "status", "remaining_amount");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");

-- CreateIndex
CREATE INDEX "daily_expenses_expense_date_idx" ON "daily_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_record_id_idx" ON "audit_logs"("table_name", "record_id");

-- AddForeignKey
ALTER TABLE "property_employees" ADD CONSTRAINT "property_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_employees" ADD CONSTRAINT "property_employees_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_expenses" ADD CONSTRAINT "daily_expenses_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
