import { z } from 'zod';
import { optionalStringSchema, optionalNumberSchema, optionalBooleanSchema, decimalSchema } from './common';

/**
 * Equipment creation schema
 */
export const createEquipmentSchema = z.object({
  placa: z.string().min(1, 'Placa is required').max(50),
  codigo: z.string().min(1, 'Código is required').max(50),
  serie: optionalStringSchema,
  modelo: optionalStringSchema,
  marca: optionalStringSchema,
  fabricante_genesis: optionalStringSchema,
  logo: optionalStringSchema,
  status_neveras: optionalStringSchema,
  coolers_froster: optionalStringSchema,
  v_h: optionalStringSchema,
  valor_en_libros: optionalNumberSchema,
  valor_comercial: optionalNumberSchema,
  status_v_libros: optionalStringSchema,
  anio_adquisicion: z.coerce.number().int().nullable().optional(),
  anio_fi: z.coerce.number().int().nullable().optional(),
  edad: z.coerce.number().int().nullable().optional(),
  rango: optionalStringSchema,
  capacidad_botellas: z.coerce.number().int().default(0).optional(),
  capacidad_cajas: z.coerce.number().int().default(0).optional(),
  capacidad_pies: z.coerce.number().int().default(0).optional(),
  ubicacion: optionalStringSchema,
  ubicacion_especifica: optionalStringSchema,
  homologacion_status: optionalStringSchema,
  fecha_entrega: z.string().date().nullable().optional(),
  ficha: optionalStringSchema,
  numero_equipo: optionalStringSchema,
  activo_fijo: z.coerce.number().int().nullable().optional(),
  baja: optionalStringSchema,
  taller: optionalStringSchema,
  region_taller: optionalStringSchema,
  gerencia_taller: optionalStringSchema,
  total_parque: z.coerce.number().int().nullable().optional(),
  en_cliente: z.coerce.boolean().default(true).optional(),
  flag_modificado: z.coerce.boolean().default(false).optional(),
  bodega_nueva: optionalStringSchema,
  mantenimiento: z.coerce.number().int().default(0).optional(),
  longitud: decimalSchema.nullable().optional(),
  latitud: decimalSchema.nullable().optional(),
  current_client_id: z.string().uuid().nullable().optional(),
});

/**
 * Equipment update schema (all fields optional)
 */
export const updateEquipmentSchema = createEquipmentSchema.partial().extend({
  placa: z.string().min(1).max(50).optional(),
  codigo: z.string().min(1).max(50).optional(),
});

/**
 * Equipment query/filter schema
 */
export const equipmentQuerySchema = z.object({
  placa: z.string().optional(),
  codigo: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  warehouse: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type EquipmentQueryInput = z.infer<typeof equipmentQuerySchema>;

