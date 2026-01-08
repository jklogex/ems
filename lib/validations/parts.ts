import { z } from 'zod';
import { optionalStringSchema } from './common';

/**
 * Part creation schema
 */
export const createPartSchema = z.object({
  codigo: z.string().min(1, 'Código is required').max(50),
  nombre: z.string().min(1, 'Nombre is required').max(255),
  descripcion: optionalStringSchema,
  marca: optionalStringSchema,
  modelo: optionalStringSchema,
  unidad_medida: z.string().default('unidad').max(50).optional(),
});

/**
 * Part update schema
 */
export const updatePartSchema = createPartSchema.partial().extend({
  codigo: z.string().min(1).max(50).optional(),
  nombre: z.string().min(1).max(255).optional(),
});

/**
 * Part query/filter schema
 */
export const partQuerySchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type PartQueryInput = z.infer<typeof partQuerySchema>;

