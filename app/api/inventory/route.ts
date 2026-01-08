import { NextRequest } from 'next/server';
import { listHandler } from '@/lib/api/handlers';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { inventorySchema } from '@/lib/validations/inventory';
import { successResponse, createdResponse, badRequestResponse } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lowStock = searchParams.get('low_stock') === 'true';

  return listHandler(request, {
    table: 'inventory',
    select: `
      *,
      warehouses (
        id,
        nombre,
        codigo
      ),
      parts (
        id,
        codigo,
        nombre,
        descripcion
      )
    `,
    allowedFilters: ['warehouse_id', 'part_id'],
    defaultLimit: 1000,
    // Inventory table doesn't have created_at, so no default sort
    transform: lowStock
      ? (data) => {
          return data.filter((item: { quantity: number; min_stock: number }) => 
            item.quantity <= item.min_stock
          );
        }
      : undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    // Handle bulk update
    if (Array.isArray(body)) {
      const schema = z.array(inventorySchema);
      const validationResult = schema.safeParse(body);
      
      if (!validationResult.success) {
        return badRequestResponse(
          validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const updates = validationResult.data.map((item) =>
        supabase
          .from('inventory')
          .upsert(item, {
            onConflict: 'warehouse_id,part_id',
          })
      );

      await Promise.all(updates);
      return successResponse({ success: true });
    }

    // Single update
    const validationResult = inventorySchema.safeParse(body);
    if (!validationResult.success) {
      return badRequestResponse(
        validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const { data, error } = await supabase
      .from('inventory')
      .upsert(validationResult.data, {
        onConflict: 'warehouse_id,part_id',
      })
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    return createdResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

