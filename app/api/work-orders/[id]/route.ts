import { NextRequest } from 'next/server';
import { readHandler, updateHandler, deleteHandler } from '@/lib/api/handlers';
import { updateWorkOrderSchema } from '@/lib/validations/work-orders';
import type { UpdateWorkOrderInput } from '@/lib/validations/work-orders';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return readHandler(request, params, {
    table: 'work_orders',
    select: `
      *,
      equipment (
        id,
        placa,
        codigo,
        modelo,
        marca,
        longitud,
        latitud,
        clients (
          id,
          codigo,
          nombre_comercial,
          direccion,
          ciudad,
          provincia
        )
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
      ),
      work_order_items (*),
      work_order_evidence (*),
      work_order_parts (
        *,
        parts (
          id,
          codigo,
          nombre
        ),
        warehouses (
          id,
          nombre
        )
      )
    `,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler<UpdateWorkOrderInput>(request, params, {
    table: 'work_orders',
    schema: updateWorkOrderSchema,
    transform: (data) => {
      const updateData = { ...data } as Record<string, unknown>;
      
      // If status is being updated to 'closed', set end_time
      if (updateData.status === 'closed' && !updateData.end_time) {
        updateData.end_time = new Date().toISOString();
      }

      // If status is being updated to 'in_progress', set start_time
      if (updateData.status === 'in_progress' && !updateData.start_time) {
        updateData.start_time = new Date().toISOString();
      }

      return updateData;
    },
    afterUpdate: async (data, supabase) => {
      const workOrder = data as { id: string; technician_id?: string; updated_by?: string };
      
      // If technician is being assigned, create assignment record
      if (workOrder.technician_id) {
        const { data: existingAssignment } = await supabase
          .from('technician_assignments')
          .select('id')
          .eq('work_order_id', workOrder.id)
          .single();

        if (!existingAssignment) {
          await supabase.from('technician_assignments').insert({
            work_order_id: workOrder.id,
            technician_id: workOrder.technician_id,
            assigned_by: workOrder.updated_by || null,
          });
        }
      }
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteHandler(request, params, {
    table: 'work_orders',
  });
}

