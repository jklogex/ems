export type UserRole = 
  | 'admin' 
  | 'coordinator_national' 
  | 'coordinator_regional' 
  | 'technician' 
  | 'warehouse' 
  | 'auditor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  codigo: string;
  nombre_comercial: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  gps_longitud: number | null;
  gps_latitud: number | null;
  contacto_responsable: string | null;
  horarios_atencion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  placa: string;
  codigo: string;
  serie: string | null;
  modelo: string | null;
  marca: string | null;
  fabricante_genesis: string | null;
  logo: string | null;
  status_neveras: string | null;
  coolers_froster: string | null;
  v_h: string | null;
  valor_en_libros: number | null;
  valor_comercial: number | null;
  status_v_libros: string | null;
  anio_adquisicion: number | null;
  anio_fi: number | null;
  edad: number | null;
  rango: string | null;
  capacidad_botellas: number;
  capacidad_cajas: number;
  capacidad_pies: number;
  ubicacion: string | null;
  ubicacion_especifica: string | null;
  homologacion_status: string | null;
  fecha_entrega: string | null;
  ficha: string | null;
  numero_equipo: string | null;
  activo_fijo: string | null; // BigInt as string
  baja: string | null;
  taller: string | null;
  region_taller: string | null;
  gerencia_taller: string | null;
  total_parque: number | null;
  en_cliente: boolean;
  flag_modificado: boolean;
  bodega_nueva: string | null;
  mantenimiento: number;
  longitud: number | null;
  latitud: number | null;
  current_client_id: string | null;
  location_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentLocationHistory {
  id: string;
  equipment_id: string;
  client_id: string | null;
  longitud: number | null;
  latitud: number | null;
  ubicacion: string | null;
  ubicacion_especifica: string | null;
  region_taller: string | null;
  bodega_nueva: string | null;
  start_date: string;
  end_date: string | null;
  moved_by: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

