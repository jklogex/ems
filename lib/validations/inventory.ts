import { z } from 'zod';
import { uuidSchema } from './common';

/**
 * Inventory creation/update schema
 */
export const inventorySchema = z.object({
  warehouse_id: uuidSchema,
  part_id: uuidSchema,
  quantity: z.coerce.number().int().nonnegative().default(0).optional(),
  min_stock: z.coerce.number().int().nonnegative().default(0).optional(),
  max_stock: z.coerce.number().int().positive().nullable().optional(),
});

/**
 * Inventory query/filter schema
 */
export const inventoryQuerySchema = z.object({
  warehouse_id: uuidSchema.optional(),
  part_id: uuidSchema.optional(),
  low_stock: z.coerce.boolean().optional(),
});

/**
 * Inventory movement schema
 */
export const inventoryMovementSchema = z.object({
  warehouse_id: uuidSchema,
  part_id: uuidSchema,
  type: z.enum(['ingress', 'transfer', 'consumption', 'adjustment']),
  quantity: z.coerce.number().int(),
  work_order_id: uuidSchema.nullable().optional(),
  technician_id: uuidSchema.nullable().optional(),
  reference: z.string().max(255).nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Inventory transfer schema
 */
export const inventoryTransferSchema = z.object({
  from_warehouse_id: uuidSchema,
  to_warehouse_id: uuidSchema,
  part_id: uuidSchema,
  quantity: z.coerce.number().int().positive(),
  status: z.enum(['pending', 'in_transit', 'completed', 'cancelled']).default('pending').optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Warehouse schema
 */
export const warehouseSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(255),
  codigo: z.string().min(1, 'Código is required').max(50),
  region: z.string().max(100).nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  gps_longitud: z.coerce.number().finite().nullable().optional(),
  gps_latitud: z.coerce.number().finite().nullable().optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type InventoryInput = z.infer<typeof inventorySchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;

