-- Generic trigger function: updates timestamps and records row-level changes.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION audit_row_change()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.id;
    INSERT INTO audit_logs (table_name, action_type, old_data, new_data, record_id)
    VALUES (TG_TABLE_NAME, TG_OP::"AuditAction", to_jsonb(OLD), NULL, target_id);
    RETURN OLD;
  END IF;
  target_id := NEW.id;
  INSERT INTO audit_logs (table_name, action_type, old_data, new_data, record_id)
  VALUES (TG_TABLE_NAME, TG_OP::"AuditAction", CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) END, to_jsonb(NEW), target_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS employees_set_updated_at ON employees;
CREATE TRIGGER employees_set_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS suppliers_set_updated_at ON suppliers;
CREATE TRIGGER suppliers_set_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS properties_set_updated_at ON properties;
CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS materials_set_updated_at ON materials;
CREATE TRIGGER materials_set_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['employees', 'suppliers', 'properties', 'property_employees', 'apartments', 'materials', 'expense_categories', 'daily_expenses']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_audit ON %I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION audit_row_change()', table_name, table_name);
  END LOOP;
END;
$$;
