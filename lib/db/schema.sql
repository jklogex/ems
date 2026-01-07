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

-- Equipment table (matching CSV structure)
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
  -- Current location (for quick access)
  longitud DECIMAL(10, 8),
  latitud DECIMAL(10, 8),
  current_client_id UUID REFERENCES clients(id),
  location_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment location history (tracks all location changes)
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
  end_date DATE,  -- NULL = current location
  moved_by UUID REFERENCES users(id),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment history (non-location changes)
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

-- Indexes for performance
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

