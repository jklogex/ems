-- Warehouses table (7 warehouses)
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

-- Inventory (stock levels per warehouse)
CREATE TABLE IF NOT EXISTS inventory (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  PRIMARY KEY (warehouse_id, part_id)
);

-- Inventory movements (all transactions)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  part_id UUID NOT NULL REFERENCES parts(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('ingress', 'transfer', 'consumption', 'adjustment')),
  quantity INTEGER NOT NULL,
  work_order_id UUID REFERENCES work_orders(id),
  technician_id UUID REFERENCES users(id),
  reference VARCHAR(255),  -- Reference number/document
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Inventory transfers (inter-warehouse)
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

-- Indexes
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

-- Trigger for updated_at
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_transfers_updated_at BEFORE UPDATE ON inventory_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

