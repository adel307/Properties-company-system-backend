-- Run after Prisma has created the base tables. PostgreSQL 18+ provides uuidv7();
-- for older PostgreSQL versions, install a uuid_generate_v7() extension/function first.

CREATE INDEX IF NOT EXISTS idx_materials_supplier_status
  ON materials (supplier_id, status);

CREATE INDEX IF NOT EXISTS idx_materials_supplier_status_covering
  ON materials (supplier_id, status) INCLUDE (remaining_amount);

CREATE INDEX IF NOT EXISTS idx_daily_expenses_expense_date
  ON daily_expenses (expense_date);

CREATE OR REPLACE VIEW v_daily_expenses_ordered_by_date AS
SELECT * FROM daily_expenses
ORDER BY expense_date DESC, created_at DESC;

CREATE OR REPLACE VIEW v_suppliers_with_debt AS
SELECT
  s.id,
  s.name,
  s.updated_at,
  COALESCE(SUM(m.remaining_amount) FILTER (WHERE m.status = 'as_dept'), 0) AS total_debt
FROM suppliers AS s
LEFT JOIN materials AS m ON m.supplier_id = s.id
GROUP BY s.id, s.name, s.updated_at;

CREATE OR REPLACE VIEW v_supplier_materials AS
SELECT
  s.id AS supplier_id,
  s.name AS supplier_name,
  s.updated_at AS supplier_updated_at,
  m.id AS material_id,
  m.name AS material_name,
  m.total_price,
  m.paid_price,
  m.remaining_amount,
  m.status,
  m.quantity,
  m.arrive_date,
  m.payment_date,
  m.property_id,
  m.updated_at AS material_updated_at
FROM suppliers AS s
LEFT JOIN materials AS m ON m.supplier_id = s.id;
