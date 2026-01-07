import { Equipment, Client } from "@/lib/db/types";

export interface CSVEquipmentRow {
  PLACA: string;
  CODIGO: string;
  Serie: string;
  Modelo: string;
  Marca: string;
  Fabricante_genesis: string;
  Logo: string;
  STATUS_NEVERAS: string;
  COOLERS_FROSTER: string;
  V_H: string;
  'Valor_en_libros': string;
  VALOR_COMERCIAL: string;
  STATUS_V_LIBROS: string;
  AniodeAdquisicion: string;
  Anio_FI: string;
  Edad: string;
  RANGO: string;
  Capacidad_en_Botellas: string;
  Capacidad_en_Cajas: string;
  Capacidad_en_pies: string;
  Ubicacion: string;
  Ubicacion_Especifica: string;
  HOMOLOGACION_STATUS_INVENTARIO_MODIF: string;
  fecha_entrega: string;
  FICHA: string;
  NUMERO_EQUIPO: string;
  ACTIVO_FIJO: string;
  BAJA: string;
  TALLER: string;
  REGION_TALLER: string;
  GERENCIA_TALLER: string;
  TOTAL_PARQUE: string;
  'en_cliente': string;
  flagModificado: string;
  'BODEGA NUEVA': string;
  MANTENIMIENTO: string;
  LONGITUD: string;
  LATITUD: string;
}

// Parse scientific notation to string (for serial numbers)
function parseScientificNotation(value: string): string {
  if (!value || value.trim() === '') return '';
  
  // Check if it's in scientific notation
  if (value.includes('E+') || value.includes('e+')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toString();
    }
  }
  
  return value.trim();
}

// Parse numeric value with commas
function parseNumericValue(value: string): number | null {
  if (!value || value.trim() === '' || value === '-   ') return null;
  
  // Remove commas and parse
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

// Parse date from various formats
function parseDate(value: string): string | null {
  if (!value || value.trim() === '') return null;
  
  try {
    // Handle formats like "9/1/2022", "3/12/2025"
    const parts = value.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        const date = new Date(year, month - 1, day);
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try ISO format
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Invalid date
  }
  
  return null;
}

// Parse GPS coordinate
function parseGPS(value: string): number | null {
  if (!value || value.trim() === '' || value === '0') return null;
  
  const num = parseFloat(value.trim());
  return isNaN(num) ? null : num;
}

// Parse integer
function parseIntValue(value: string): number | null {
  if (!value || value.trim() === '' || value === '0') return null;
  
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? null : num;
}

// Parse boolean
function parseBoolean(value: string): boolean {
  if (!value || value.trim() === '') return false;
  return value.trim() === '1' || value.trim().toLowerCase() === 'true';
}

// Parse bigint (for ACTIVO_FIJO)
function parseBigInt(value: string): string | null {
  if (!value || value.trim() === '' || value === '0') return null;
  
  // Handle scientific notation
  if (value.includes('E+') || value.includes('e+')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return Math.floor(num).toString();
    }
  }
  
  // Try to parse as integer
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return Math.floor(num).toString();
  }
  
  return value.trim() || null;
}

export function mapCSVRowToEquipment(row: CSVEquipmentRow): Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'current_client_id' | 'location_changed_at'> {
  return {
    placa: row.PLACA.trim(),
    codigo: row.CODIGO.trim(),
    serie: row.Serie ? parseScientificNotation(row.Serie) : null,
    modelo: row.Modelo?.trim() || null,
    marca: row.Marca?.trim() || null,
    fabricante_genesis: row.Fabricante_genesis?.trim() || null,
    logo: row.Logo?.trim() || null,
    status_neveras: row.STATUS_NEVERAS?.trim() || null,
    coolers_froster: row.COOLERS_FROSTER?.trim() || null,
    v_h: row.V_H?.trim() || null,
    valor_en_libros: parseNumericValue(row['Valor_en_libros']),
    valor_comercial: parseNumericValue(row.VALOR_COMERCIAL),
    status_v_libros: row.STATUS_V_LIBROS?.trim() || null,
    anio_adquisicion: parseIntValue(row.AniodeAdquisicion),
    anio_fi: parseIntValue(row.Anio_FI),
    edad: parseIntValue(row.Edad),
    rango: row.RANGO?.trim() || null,
    capacidad_botellas: parseIntValue(row.Capacidad_en_Botellas) || 0,
    capacidad_cajas: parseIntValue(row.Capacidad_en_Cajas) || 0,
    capacidad_pies: parseIntValue(row.Capacidad_en_pies) || 0,
    ubicacion: row.Ubicacion?.trim() || null,
    ubicacion_especifica: row.Ubicacion_Especifica?.trim() || null,
    homologacion_status: row.HOMOLOGACION_STATUS_INVENTARIO_MODIF?.trim() || null,
    fecha_entrega: parseDate(row.fecha_entrega),
    ficha: row.FICHA?.trim() || null,
    numero_equipo: row.NUMERO_EQUIPO?.trim() || null,
    activo_fijo: parseBigInt(row.ACTIVO_FIJO),
    baja: row.BAJA?.trim() || null,
    taller: row.TALLER?.trim() || null,
    region_taller: row.REGION_TALLER?.trim() || null,
    gerencia_taller: row.GERENCIA_TALLER?.trim() || null,
    total_parque: parseIntValue(row.TOTAL_PARQUE),
    en_cliente: parseBoolean(row['en_cliente']),
    flag_modificado: parseBoolean(row.flagModificado),
    bodega_nueva: row['BODEGA NUEVA']?.trim() || null,
    mantenimiento: parseIntValue(row.MANTENIMIENTO) || 0,
    longitud: parseGPS(row.LONGITUD),
    latitud: parseGPS(row.LATITUD),
  };
}

export function mapCSVRowToClient(row: CSVEquipmentRow): Omit<Client, 'id' | 'created_at' | 'updated_at'> {
  return {
    codigo: row.CODIGO.trim(),
    nombre_comercial: null, // Not in CSV, will need to be filled separately
    direccion: null,
    ciudad: null,
    provincia: null,
    gps_longitud: parseGPS(row.LONGITUD),
    gps_latitud: parseGPS(row.LATITUD),
    contacto_responsable: null,
    horarios_atencion: null,
  };
}

