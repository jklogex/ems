import { NextRequest } from 'next/server';
import { listHandler, createHandler } from '@/lib/api/handlers';
import { createWorkOrderSchema } from '@/lib/validations/work-orders';
import type { CreateWorkOrderInput } from '@/lib/validations/work-orders';

export async function GET(request: NextRequest) {
  return listHandler(request, {
    table: 'work_orders',
    select: `
      *,
      equipment (
        id,
        placa,
        codigo,
        modelo,
        marca
      ),
      technician:users!technician_id (
        id,
        name,
        email
      ),
      creator:users!created_by (
        id,
        name,
        email
      )
    `,
    allowedFilters: ['equipment_id', 'technician_id', 'status', 'type', 'start_date', 'end_date'],
    defaultLimit: 100,
  });
}

export async function POST(request: NextRequest) {
  return createHandler<CreateWorkOrderInput>(request, {
    table: 'work_orders',
    schema: createWorkOrderSchema,
    afterCreate: async (data, supabase) => {
      const workOrder = data as { id: string; technician_id?: string; created_by?: string };
      // If technician is assigned, create assignment record
      if (workOrder.technician_id) {
        await supabase.from('technician_assignments').insert({
          work_order_id: workOrder.id,
          technician_id: workOrder.technician_id,
          assigned_by: workOrder.created_by || null,
        });
      }
    },
  });
}

