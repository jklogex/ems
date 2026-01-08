import { z } from 'zod';

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(100).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

/**
 * Sort schema
 */
export const sortSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid();

/**
 * Date string schema (ISO format)
 */
export const dateSchema = z.string().datetime().or(z.string().date());

/**
 * Decimal schema for GPS coordinates and monetary values
 */
export const decimalSchema = z.coerce.number().finite();

/**
 * Optional string schema
 */
export const optionalStringSchema = z.string().nullable().optional();

/**
 * Optional number schema
 */
export const optionalNumberSchema = z.coerce.number().nullable().optional();

/**
 * Optional boolean schema
 */
export const optionalBooleanSchema = z.coerce.boolean().nullable().optional();

