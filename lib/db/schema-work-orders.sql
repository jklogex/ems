-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('inspection', 'preventive', 'corrective', 'emergency')),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  sla_hours INTEGER,  -- Service Level Agreement in hours
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
  item_type VARCHAR(50) DEFAULT 'check',  -- check, text, number, etc.
  completed BOOLEAN DEFAULT false,
  value TEXT,  -- For text/number responses
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work order evidence (photos, signatures)
CREATE TABLE IF NOT EXISTS work_order_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('photo_before', 'photo_after', 'signature', 'document')),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  gps_latitud DECIMAL(10, 8),
  gps_longitud DECIMAL(10, 8),
  metadata JSONB,  -- Additional metadata (signer name, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work order parts consumed
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

-- Preventive maintenance schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('preventive', 'inspection')),
  frequency_days INTEGER NOT NULL,  -- Days between maintenance
  last_maintenance_date DATE,
  next_maintenance_date DATE NOT NULL,
  checklist_template_id UUID,  -- Reference to checklist template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technician assignments (for workload tracking)
CREATE TABLE IF NOT EXISTS technician_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_technician ON work_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_work_order_items_work_order ON work_order_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_evidence_work_order ON work_order_evidence(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_schedules_equipment ON schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next_date ON schedules(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_work_order ON technician_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_technician_assignments_technician ON technician_assignments(technician_id);

-- Trigger for updated_at
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

