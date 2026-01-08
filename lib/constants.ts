import type { UserRole } from './db/types';

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin' as UserRole,
  COORDINATOR_NATIONAL: 'coordinator_national' as UserRole,
  COORDINATOR_REGIONAL: 'coordinator_regional' as UserRole,
  TECHNICIAN: 'technician' as UserRole,
  WAREHOUSE: 'warehouse' as UserRole,
  AUDITOR: 'auditor' as UserRole,
} as const;

/**
 * Work order types
 */
export const WORK_ORDER_TYPES = {
  INSPECTION: 'inspection',
  PREVENTIVE: 'preventive',
  CORRECTIVE: 'corrective',
  EMERGENCY: 'emergency',
} as const;

/**
 * Work order priorities
 */
export const WORK_ORDER_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

/**
 * Work order statuses
 */
export const WORK_ORDER_STATUSES = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Work order evidence types
 */
export const EVIDENCE_TYPES = {
  PHOTO_BEFORE: 'photo_before',
  PHOTO_AFTER: 'photo_after',
  SIGNATURE: 'signature',
  DOCUMENT: 'document',
} as const;

/**
 * Inventory movement types
 */
export const INVENTORY_MOVEMENT_TYPES = {
  INGRESS: 'ingress',
  TRANSFER: 'transfer',
  CONSUMPTION: 'consumption',
  ADJUSTMENT: 'adjustment',
} as const;

/**
 * Inventory transfer statuses
 */
export const TRANSFER_STATUSES = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Default pagination size
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum page size
 */
export const MAX_PAGE_SIZE = 1000;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  CLIENTS: '/api/clients',
  EQUIPMENT: '/api/equipment',
  WORK_ORDERS: '/api/work-orders',
  PARTS: '/api/parts',
  INVENTORY: '/api/inventory',
  WAREHOUSES: '/api/warehouses',
  SCHEDULES: '/api/schedules',
  REPORTS: '/api/reports',
} as const;

/**
 * Equipment types
 */
export const EQUIPMENT_TYPES = {
  COOLER: 'COOLER',
  DRAUGHT: 'DRAUGHT',
} as const;

/**
 * Hard-coded list of unique bodegas from the equipment table
 * 
 * To update this list:
 * 1. Run: npx tsx scripts/extract-bodegas.ts
 * 2. Copy the generated array into BODEGAS below
 */
export const BODEGAS = [
  'AMBATO',
  'AZOGUES',
  'DURAN/GYE',
  'EL COCA',
  'ESMERALDAS',
  'LA LIBERTAD',
  'LOJA',
  'MACHALA',
  'PORTOVIEJO',
  'QUEVEDO',
  'QUITO',
  'SANTO DOMINGO',
] as const;

export type Bodega = typeof BODEGAS[number];