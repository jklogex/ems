import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { successResponse } from '@/lib/api/response';

/**
 * Debug endpoint to test MVT tile generation
 * Route: /api/map/debug
 * 
 * Query Parameters:
 * - z, x, y: Tile coordinates (default: 6, 32, 32 - around Ecuador)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const z = parseInt(searchParams.get('z') || '6', 10);
    const x = parseInt(searchParams.get('x') || '32', 10);
    const y = parseInt(searchParams.get('y') || '32', 10);

    const supabase = getSupabaseServiceClient();

    // Check equipment count with geometry
    const { count: equipmentCount } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .not('geometry', 'is', null);

    // Test MVT function with different tile coordinates
    // Try tiles that should cover Ecuador
    const testTiles = [
      { z: 6, x: 32, y: 32 }, // Country level
      { z: 8, x: 128, y: 128 }, // Regional level
      { z: 10, x: 512, y: 512 }, // City level
    ];

    const tileResults = await Promise.all(
      testTiles.map(async (tile) => {
        const { data, error } = await supabase.rpc('get_mvt_tile', {
          z_param: tile.z,
          x_param: tile.x,
          y_param: tile.y,
          status_filter: null,
          type_filter: null,
          region_filter: null,
          warehouse_filter: null,
        });

        let tileSize = 0;
        if (data && typeof data === 'string') {
          if (data.startsWith('\\x') && data.length > 2) {
            const hexString = data.slice(2).replace(/\s/g, '');
            tileSize = hexString.length / 2; // Each hex pair is one byte
          }
        }

        return {
          tile: `${tile.z}/${tile.x}/${tile.y}`,
          error: error ? error.message : null,
          dataType: typeof data,
          rawLength: data ? (typeof data === 'string' ? data.length : 'not string') : 'null',
          estimatedBytes: tileSize,
          isEmpty: data === '\\x' || data === null || (typeof data === 'string' && data.length <= 2),
        };
      })
    );

    // Get sample equipment with geometry to check coordinates
    const { data: sampleEquipment } = await supabase
      .from('equipment')
      .select('placa, longitud, latitud, geometry')
      .not('geometry', 'is', null)
      .limit(5);

    // Extract coordinates from geometry for verification
    const equipmentWithCoords = sampleEquipment?.map((eq) => {
      if (eq.geometry) {
        // Try to extract coordinates (this might not work directly, but gives us an idea)
        return {
          placa: eq.placa,
          longitud_column: eq.longitud,
          latitud_column: eq.latitud,
        };
      }
      return null;
    }).filter(Boolean);

    return successResponse({
      equipmentWithGeometry: equipmentCount || 0,
      tileTestResults: tileResults,
      sampleEquipment: equipmentWithCoords,
      note: 'If all tiles are empty, the tile coordinates might not cover Ecuador. Try different z/x/y values.',
    });
  } catch (error) {
    return successResponse({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
