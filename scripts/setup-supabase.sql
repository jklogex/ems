-- Complete Supabase Setup Script
-- Run this in Supabase SQL Editor after creating your project
-- 
-- IMPORTANT: Tables are created in the correct order to handle foreign key dependencies:
-- 1. Core tables (users, clients, equipment)
-- 2. Parts and warehouses (needed by work_order_parts)
-- 3. Work orders and related tables
-- 4. Remaining inventory tables

-- Step 1: Create all core tables (from schema.sql)
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coordinator_national', 'coordinator_regional', 'technician', 'warehouse', 'auditor')),
  region VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients/Stores table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre_comercial VARCHAR(255),
  direccion TEXT,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  gps_longitud DECIMAL(10, 8),
  gps_latitud DECIMAL(10, 8),
  contacto_responsable VARCHAR(255),
  horarios_atencion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa VARCHAR(50) UNIQUE NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  serie VARCHAR(100),
  modelo VARCHAR(255),
  marca VARCHAR(255),
  fabricante_genesis VARCHAR(255),
  logo VARCHAR(255),
  status_neveras VARCHAR(100),
  coolers_froster VARCHAR(50),
  v_h VARCHAR(10),
  valor_en_libros DECIMAL(15, 2),
  valor_comercial DECIMAL(15, 2),
  status_v_libros VARCHAR(50),
  anio_adquisicion INTEGER,
  anio_fi INTEGER,
  edad INTEGER,
  rango VARCHAR(50),
  capacidad_botellas INTEGER DEFAULT 0,
  capacidad_cajas INTEGER DEFAULT 0,
  capacidad_pies INTEGER DEFAULT 0,
  ubicacion VARCHAR(255),
  ubicacion_especifica VARCHAR(255),
  homologacion_status VARCHAR(100),
  fecha_entrega DATE,
  ficha VARCHAR(255),
  numero_equipo VARCHAR(100),
  activo_fijo BIGINT,
  baja VARCHAR(255),
  taller VARCHAR(255),
  region_taller VARCHAR(100),
  gerencia_taller VARCHAR(255),
  total_parque INTEGER,
  en_cliente BOOLEAN DEFAULT true,
  flag_modificado BOOLEAN DEFAULT false,
  bodega_nueva VARCHAR(100),
  mantenimiento INTEGER DEFAULT 0,
  longitud DECIMAL(10, 8),
  latitud DECIMAL(10, 8),
  current_client_id UUID REFERENCES clients(id),
  location_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment location history
CREATE TABLE IF NOT EXISTS equipment_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  longitud DECIMAL(10, 8),
  latitud DECIMAL(10, 8),
  ubicacion VARCHAR(255),
  ubicacion_especifica VARCHAR(255),
  region_taller VARCHAR(100),
  bodega_nueva VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  moved_by UUID REFERENCES users(id),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment history
CREATE TABLE IF NOT EXISTS equipment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_placa ON equipment(placa);
CREATE INDEX IF NOT EXISTS idx_equipment_codigo ON equipment(codigo);
CREATE INDEX IF NOT EXISTS idx_equipment_current_client ON equipment(current_client_id);
CREATE INDEX IF NOT EXISTS idx_equipment_region_taller ON equipment(region_taller);
CREATE INDEX IF NOT EXISTS idx_equipment_bodega_nueva ON equipment(bodega_nueva);
CREATE INDEX IF NOT EXISTS idx_clients_codigo ON clients(codigo);
CREATE INDEX IF NOT EXISTS idx_location_history_equipment ON equipment_location_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_location_history_dates ON equipment_location_history(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 2: Create work orders tables (from schema-work-orders.sql)
-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('inspection', 'preventive', 'corrective', 'emergency')),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  sla_hours INTEGER,
  technician_id UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('created', 'assigned', 'in_progress', 'closed', 'cancelled')) DEFAULT 'created',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  scheduled_date DATE,
  diagnosis TEXT,
  actions_performed TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work order checklist items
CREATE TABLE IF NOT EXISTS work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  item_type VARCHAR(50) DEFAULT 'check',
  completed BOOLEAN DEFAULT false,
  value TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work order evidence
CREATE TABLE IF NOT EXISTS work_order_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('photo_before', 'photo_after', 'signature', 'document')),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  gps_latitud DECIMAL(10, 8),
  gps_longitud DECIMAL(10, 8),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preventive maintenance schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('preventive', 'inspection')),
  frequency_days INTEGER NOT NULL,
  last_maintenance_date DATE,
  next_maintenance_date DATE NOT NULL,
  checklist_template_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technician assignments
CREATE TABLE IF NOT EXISTS technician_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  notes TEXT
);

-- Work orders indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_technician ON work_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_work_order_items_work_order ON work_order_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_evidence_work_order ON work_order_evidence(work_order_id);
-- Note: idx_work_order_parts_work_order will be created after work_order_parts table
CREATE INDEX IF NOT EXISTS idx_schedules_equipment ON schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next_date ON schedules(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_work_order ON technician_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_technician ON technician_assignments(technician_id);

-- Work orders triggers
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 2.5: Create parts and warehouses BEFORE work_order_parts (needed for foreign keys)
-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  region VARCHAR(100),
  ubicacion TEXT,
  gps_longitud DECIMAL(10, 8),
  gps_latitud DECIMAL(10, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts catalog
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  marca VARCHAR(255),
  modelo VARCHAR(255),
  unidad_medida VARCHAR(50) DEFAULT 'unidad',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now create work_order_parts (it references parts and warehouses)
CREATE TABLE IF NOT EXISTS work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  warehouse_id UUID REFERENCES warehouses(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for work_order_parts (now that the table exists)
CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order ON work_order_parts(work_order_id);

-- Step 3: Create remaining inventory tables (from schema-inventory.sql)

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  PRIMARY KEY (warehouse_id, part_id)
);

-- Inventory movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  part_id UUID NOT NULL REFERENCES parts(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('ingress', 'transfer', 'consumption', 'adjustment')),
  quantity INTEGER NOT NULL,
  work_order_id UUID REFERENCES work_orders(id),
  technician_id UUID REFERENCES users(id),
  reference VARCHAR(255),
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Inventory transfers
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  part_id UUID NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_part ON inventory(part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_part ON inventory_movements(part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_work_order ON inventory_movements(work_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_timestamp ON inventory_movements(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_from ON inventory_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_to ON inventory_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_parts_codigo ON parts(codigo);

-- Inventory triggers
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_transfers_updated_at BEFORE UPDATE ON inventory_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create initial data
-- Create admin user
INSERT INTO users (email, name, role, region)
VALUES ('admin@example.com', 'Administrator', 'admin', NULL)
ON CONFLICT (email) DO NOTHING;

-- Create 7 warehouses
INSERT INTO warehouses (nombre, codigo, region) VALUES
('Bodega Quito', 'BOD-QUI', 'QUITO'),
('Bodega Guayaquil', 'BOD-GYE', 'DURAN/GYE'),
('Bodega La Libertad', 'BOD-LIB', 'LA LIBERTAD'),
('Bodega Azogues', 'BOD-AZO', 'AZOGUES'),
('Bodega Cuenca', 'BOD-CUE', 'CUENCA'),
('Bodega Ambato', 'BOD-AMB', 'AMBATO'),
('Bodega Manta', 'BOD-MAN', 'MANTA')
ON CONFLICT (codigo) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Tables created: users, clients, equipment, work_orders, inventory, warehouses, parts';
  RAISE NOTICE 'Initial admin user created: admin@example.com';
  RAISE NOTICE '7 warehouses created';
END $$;

