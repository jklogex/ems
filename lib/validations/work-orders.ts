import { z } from 'zod';
import { optionalStringSchema, optionalNumberSchema, uuidSchema } from './common';

/**
 * Work order type enum
 */
export const workOrderTypeSchema = z.enum(['inspection', 'preventive', 'corrective', 'emergency']);

/**
 * Work order priority enum
 */
export const workOrderPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Work order status enum
 */
export const workOrderStatusSchema = z.enum(['created', 'assigned', 'in_progress', 'closed', 'cancelled']);

/**
 * Work order creation schema
 */
export const createWorkOrderSchema = z.object({
  type: workOrderTypeSchema,
  equipment_id: uuidSchema,
  priority: workOrderPrioritySchema,
  sla_hours: z.coerce.number().int().positive().nullable().optional(),
  technician_id: uuidSchema.nullable().optional(),
  status: workOrderStatusSchema.default('created').optional(),
  start_time: z.string().datetime().nullable().optional(),
  end_time: z.string().datetime().nullable().optional(),
  scheduled_date: z.string().date().nullable().optional(),
  diagnosis: optionalStringSchema,
  actions_performed: optionalStringSchema,
  notes: optionalStringSchema,
  created_by: uuidSchema.nullable().optional(),
});

/**
 * Work order update schema
 */
export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  equipment_id: uuidSchema.optional(),
  type: workOrderTypeSchema.optional(),
  priority: workOrderPrioritySchema.optional(),
  status: workOrderStatusSchema.optional(),
});

/**
 * Work order query/filter schema
 */
export const workOrderQuerySchema = z.object({
  equipment_id: uuidSchema.optional(),
  technician_id: uuidSchema.optional(),
  status: workOrderStatusSchema.optional(),
  type: workOrderTypeSchema.optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
});

/**
 * Work order item schema
 */
export const workOrderItemSchema = z.object({
  item_text: z.string().min(1),
  item_type: z.string().default('check').optional(),
  completed: z.coerce.boolean().default(false).optional(),
  value: optionalStringSchema,
  order_index: z.coerce.number().int().default(0).optional(),
});

/**
 * Work order evidence schema
 */
export const workOrderEvidenceSchema = z.object({
  type: z.enum(['photo_before', 'photo_after', 'signature', 'document']),
  file_url: z.string().url(),
  file_name: optionalStringSchema,
  file_size: z.coerce.number().int().positive().nullable().optional(),
  gps_latitud: z.coerce.number().finite().nullable().optional(),
  gps_longitud: z.coerce.number().finite().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

/**
 * Work order part schema
 */
export const workOrderPartSchema = z.object({
  part_id: uuidSchema.nullable().optional(),
  warehouse_id: uuidSchema.nullable().optional(),
  quantity: z.coerce.number().int().positive().default(1).optional(),
  unit_cost: z.coerce.number().finite().nullable().optional(),
  notes: optionalStringSchema,
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type WorkOrderQueryInput = z.infer<typeof workOrderQuerySchema>;
export type WorkOrderItemInput = z.infer<typeof workOrderItemSchema>;
export type WorkOrderEvidenceInput = z.infer<typeof workOrderEvidenceSchema>;
export type WorkOrderPartInput = z.infer<typeof workOrderPartSchema>;

