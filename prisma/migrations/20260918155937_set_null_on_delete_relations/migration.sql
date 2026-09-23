-- DropForeignKey
ALTER TABLE "daily_expenses" DROP CONSTRAINT "daily_expenses_expense_category_id_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_property_id_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_supplier_id_fkey";

-- AlterTable
ALTER TABLE "daily_expenses" ALTER COLUMN "expense_category_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "materials" ALTER COLUMN "supplier_id" DROP NOT NULL,
ALTER COLUMN "property_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_expenses" ADD CONSTRAINT "daily_expenses_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
