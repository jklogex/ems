import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { successResponse, badRequestResponse } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * Export Endpoint
 * 
 * Exports selected equipment as CSV or JSON
 * Route: /api/map/export
 * 
 * Query Parameters:
 * - format: 'csv' or 'json' (default: 'json')
 * 
 * Body: { equipmentIds: string[] }
 * 
 * Returns: CSV string or JSON data
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    const body = await request.json();
    const { equipmentIds } = body;

    if (!Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return badRequestResponse('equipmentIds array is required');
    }

    const supabase = getSupabaseServiceClient();

    // Fetch equipment data
    const { data: equipment, error } = await supabase
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
        clients (
          codigo,
          nombre_comercial,
          ciudad,
          provincia
        )
      `)
      .in('id', equipmentIds);

    if (error) {
      return handleApiError(error);
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Placa',
        'Código',
        'Modelo',
        'Marca',
        'Estado',
        'Tipo',
        'Región',
        'Bodega',
        'Longitud',
        'Latitud',
        'Cliente',
        'Ciudad',
        'Provincia',
      ];

      const rows = (equipment || []).map((eq) => [
        eq.id,
        eq.placa,
        eq.codigo,
        eq.modelo || '',
        eq.marca || '',
        eq.status_neveras || '',
        eq.coolers_froster || '',
        eq.region_taller || '',
        eq.bodega_nueva || '',
        eq.longitud || '',
        eq.latitud || '',
        (eq.clients as any)?.nombre_comercial || '',
        (eq.clients as any)?.ciudad || '',
        (eq.clients as any)?.provincia || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="equipment-export-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON
    return successResponse(equipment);
  } catch (error) {
    return handleApiError(error);
  }
}
