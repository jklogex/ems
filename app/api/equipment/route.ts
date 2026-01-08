import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/handlers';
import { createEquipmentSchema } from '@/lib/validations/equipment';
import { importEquipmentFromCSV } from '@/lib/utils/import';
import { successResponse, badRequestResponse, paginatedResponse } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const searchParams = request.nextUrl.searchParams;

    // Map filter names to actual database column names
    const filterMapping: Record<string, string> = {
      placa: 'placa',
      codigo: 'codigo',
      region: 'region_taller',
      status: 'status_neveras',
      type: 'coolers_froster',
      warehouse: 'bodega_nueva',
    };

    // Build query with filters
    let query = supabase
      .from('equipment')
      .select(`
        *,
        clients (
          id,
          codigo,
          nombre_comercial,
          ciudad,
          provincia
        )
      `, { count: 'exact' });

    // Apply filters with proper column mapping
    for (const [filterKey, dbColumn] of Object.entries(filterMapping)) {
      const value = searchParams.get(filterKey);
      if (value && value.trim() !== '') {
        query = query.ilike(dbColumn, `%${value}%`);
      }
    }

    // Apply pagination
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return handleApiError(error);
    }

    return paginatedResponse(data || [], {
      count: data?.length || 0,
      limit,
      offset,
      total: count || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle CSV file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return badRequestResponse('No file provided');
      }

      const csvContent = await file.text();
      const userId = formData.get('userId') as string | null;
      
      const result = await importEquipmentFromCSV(csvContent, userId || undefined);
      
      return successResponse(result);
    } else {
      // Handle JSON equipment creation
      return createHandler(request, {
        table: 'equipment',
        schema: createEquipmentSchema,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

