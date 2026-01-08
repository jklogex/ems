import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';
import { successResponse } from '@/lib/api/response';

/**
 * Test tile endpoint to find tiles that contain Ecuador data
 * Route: /api/map/test-tile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();

    // Get a sample of equipment coordinates to find the right tile
    const { data: sample } = await supabase
      .from('equipment')
      .select('placa, longitud, latitud, geometry')
      .not('geometry', 'is', null)
      .limit(10);

    if (!sample || sample.length === 0) {
      return successResponse({ error: 'No equipment with geometry found' });
    }

    // Extract coordinates from geometry
    // Note: After the fix, geometry should have correct coordinates
    const coords = sample.map((eq) => {
      // Get coordinates from geometry using PostGIS
      return {
        placa: eq.placa,
        // These are the column values (might be swapped)
        longitud_col: eq.longitud,
        latitud_col: eq.latitud,
      };
    });

    // Calculate tile coordinates for Ecuador center (-78.5, -0.2)
    // Using standard tile calculation
    const testLon = -78.5; // Ecuador longitude
    const testLat = -0.2;  // Ecuador latitude

    const calculateTile = (lon: number, lat: number, z: number) => {
      const n = Math.pow(2, z);
      const x = Math.floor(((lon + 180) / 360) * n);
      const latRad = (lat * Math.PI) / 180;
      const y = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
      );
      return { x, y };
    };

    const tiles = {
      z6: calculateTile(testLon, testLat, 6),
      z8: calculateTile(testLon, testLat, 8),
      z10: calculateTile(testLon, testLat, 10),
    };

    // Test MVT function with calculated tiles
    const testResults = await Promise.all(
      Object.entries(tiles).map(async ([zoom, { x, y }]) => {
        const z = parseInt(zoom.replace('z', ''));
        const { data, error } = await supabase.rpc('get_mvt_tile', {
          z_param: z,
          x_param: x,
          y_param: y,
          status_filter: null,
          type_filter: null,
          region_filter: null,
          warehouse_filter: null,
        });

        let size = 0;
        if (data && typeof data === 'string' && data.startsWith('\\x') && data.length > 2) {
          size = (data.length - 2) / 2; // Hex pairs to bytes
        }

        return {
          zoom: z,
          tile: `${z}/${x}/${y}`,
          coordinates: { x, y },
          hasData: size > 0,
          sizeBytes: size,
          error: error?.message,
        };
      })
    );

    return successResponse({
      ecuadorCenter: { lon: testLon, lat: testLat },
      calculatedTiles: tiles,
      testResults,
      sampleEquipment: coords,
      note: 'Check testResults to see which tiles have data. Use those coordinates in the map.',
    });
  } catch (error) {
    return successResponse({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
