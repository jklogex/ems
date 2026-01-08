import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { successResponse, notFoundResponse } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * Equipment Detail Endpoint for Map Popups
 * 
 * Returns minimal equipment information for display in map popups
 * Route: /api/map/equipment/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        placa,
        codigo,
        modelo,
        marca,
        status_neveras,
        coolers_froster,
        region_taller,
        bodega_nueva,
        longitud,
        latitud,
        ubicacion,
        ubicacion_especifica,
        clients (
          id,
          codigo,
          nombre_comercial,
          ciudad,
          provincia
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Equipment not found');
      }
      return handleApiError(error);
    }

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
