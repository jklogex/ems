import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { successResponse, badRequestResponse } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * Route Generation Endpoint
 * 
 * Generates optimized routes for selected equipment using Mapbox Directions API
 * Route: /api/map/routes
 * 
 * Body: { equipmentIds: string[] }
 * 
 * Returns: Route geometry and statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { equipmentIds } = body;

    if (!Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return badRequestResponse('equipmentIds array is required');
    }

    const supabase = getSupabaseServiceClient();

    // Fetch equipment locations
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('id, longitud, latitud')
      .in('id', equipmentIds)
      .not('longitud', 'is', null)
      .not('latitud', 'is', null);

    if (error) {
      return handleApiError(error);
    }

    if (!equipment || equipment.length === 0) {
      return badRequestResponse('No equipment found with valid coordinates');
    }

    // For now, return a simple route connecting all points
    // In production, integrate with Mapbox Directions API or OSRM
    const coordinates: [number, number][] = equipment.map((eq) => [
      eq.longitud as number,
      eq.latitud as number,
    ]);

    // Simple route: connect points in order
    // TODO: Integrate with Mapbox Directions API for optimized routing
    const route = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
      properties: {
        distance: 0, // Calculate with routing API
        duration: 0, // Calculate with routing API
      },
    };

    return successResponse({
      route,
      waypoints: equipment.map((eq) => ({
        id: eq.id,
        coordinates: [eq.longitud, eq.latitud],
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
