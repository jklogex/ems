import { z } from 'zod';
import { optionalStringSchema, optionalNumberSchema, decimalSchema } from './common';

/**
 * Client creation schema
 */
export const createClientSchema = z.object({
  codigo: z.string().min(1, 'Código is required').max(50),
  nombre_comercial: optionalStringSchema,
  direccion: optionalStringSchema,
  ciudad: optionalStringSchema,
  provincia: optionalStringSchema,
  gps_longitud: decimalSchema.nullable().optional(),
  gps_latitud: decimalSchema.nullable().optional(),
  contacto_responsable: optionalStringSchema,
  horarios_atencion: optionalStringSchema,
});

/**
 * Client update schema (all fields optional except codigo if provided)
 */
export const updateClientSchema = createClientSchema.partial().extend({
  codigo: z.string().min(1).max(50).optional(),
});

/**
 * Client query/filter schema
 */
export const clientQuerySchema = z.object({
  codigo: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;

