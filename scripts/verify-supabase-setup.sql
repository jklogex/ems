-- Verification script to check if Supabase setup is correct
-- Run this after setup-supabase.sql to verify everything is working

-- Check if all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'clients', 'equipment', 'equipment_location_history', 
                        'work_orders', 'work_order_items', 'work_order_evidence', 
                        'work_order_parts', 'schedules', 'technician_assignments',
                        'warehouses', 'parts', 'inventory', 'inventory_movements', 
                        'inventory_transfers', 'equipment_history')
    THEN '✓'
    ELSE '✗'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'clients', 'equipment', 'equipment_location_history', 
                     'work_orders', 'work_order_items', 'work_order_evidence', 
                     'work_order_parts', 'schedules', 'technician_assignments',
                     'warehouses', 'parts', 'inventory', 'inventory_movements', 
                     'inventory_transfers', 'equipment_history')
ORDER BY table_name;

-- Check if admin user exists
SELECT 
  email,
  name,
  role,
  CASE WHEN email = 'admin@example.com' THEN '✓ Admin user exists' ELSE '✗ Admin user missing' END as status
FROM users
WHERE email = 'admin@example.com';

-- Check if warehouses exist
SELECT 
  COUNT(*) as warehouse_count,
  CASE WHEN COUNT(*) = 7 THEN '✓ All 7 warehouses created' ELSE '✗ Missing warehouses' END as status
FROM warehouses;

-- List all warehouses
SELECT codigo, nombre, region FROM warehouses ORDER BY codigo;

-- Check indexes
SELECT 
  COUNT(*) as index_count,
  'Indexes created' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'clients', 'equipment', 'work_orders', 'inventory');

