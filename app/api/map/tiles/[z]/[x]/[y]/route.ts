import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';

/**
 * MVT Tile Generation Endpoint
 * 
 * Generates Mapbox Vector Tiles (MVT) for equipment data using PostGIS
 * 
 * Route: /api/map/tiles/[z]/[x]/[y]
 * 
 * Query Parameters:
 * - status: Filter by status_neveras
 * - type: Filter by coolers_froster
 * - region: Filter by region_taller
 * - warehouse: Filter by bodega_nueva
 * 
 * Returns: Binary MVT data with proper Content-Type header
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { z: string; x: string; y: string } }
) {
  try {
    const z = parseInt(params.z, 10);
    const x = parseInt(params.x, 10);
    const y = parseInt(params.y, 10);

    // Validate tile coordinates
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
      return new NextResponse('Invalid tile coordinates', { status: 400 });
    }

    const maxCoord = Math.pow(2, z);
    if (x < 0 || x >= maxCoord || y < 0 || y >= maxCoord || z < 0 || z > 20) {
      return new NextResponse('Tile coordinates out of range', { status: 400 });
    }

    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      region: searchParams.get('region') || undefined,
      warehouse: searchParams.get('warehouse') || undefined,
    };

    const supabase = getSupabaseServiceClient();

    // Build the MVT query using PostGIS
    // Note: This requires the get_mvt_tile function to be created in the database
    const { data, error } = await supabase.rpc('get_mvt_tile', {
      z_param: z,
      x_param: x,
      y_param: y,
      status_filter: filters.status || null,
      type_filter: filters.type || null,
      region_filter: filters.region || null,
      warehouse_filter: filters.warehouse || null,
    });

    if (error) {
      console.error('MVT tile generation error:', error);
      console.error('Tile coordinates:', { z, x, y });
      // If function doesn't exist, return empty tile
      return new NextResponse(new Uint8Array(0), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.mapbox-vector-tile',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }


    // Convert the bytea result to Buffer
    // Supabase RPC returns bytea in different formats depending on the client
    let tileData: Buffer;
    
    if (data === null || data === undefined) {
      console.warn('MVT tile returned null/undefined for tile:', { z, x, y });
      tileData = Buffer.alloc(0);
    } else if (typeof data === 'string') {
      // Supabase may return bytea in different formats:
      // 1. Hex string with \x prefix: "\\x[hex]"
      // 2. Base64 encoded (common with JS clients)
      // 3. Raw hex without prefix
      
      if (data === '\\x' || data.length <= 2) {
        // Empty tile
        tileData = Buffer.alloc(0);
      } else {
        // Try base64 first (Supabase JS client often uses this)
        let parsed = false;
        
        // Check if it looks like base64
        if (!data.startsWith('\\x') && !data.startsWith('0x')) {
          try {
            const base64Test = Buffer.from(data, 'base64');
            if (base64Test.length > 0 && base64Test.length < 10 * 1024 * 1024) {
              tileData = base64Test;
              parsed = true;
            }
          } catch (e) {
            // Not base64, continue to hex parsing
          }
        }
        
        // If not base64, try hex
        if (!parsed) {
          let hexString = data;
          
          // Remove \x or 0x prefix
          if (hexString.startsWith('\\x')) {
            hexString = hexString.slice(2);
          } else if (hexString.startsWith('0x') || hexString.startsWith('0X')) {
            hexString = hexString.slice(2);
          }
          
          // Remove any whitespace
          hexString = hexString.replace(/\s/g, '');
          
          // Validate hex string (must be even length and only hex chars)
          if (hexString.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(hexString)) {
            try {
              tileData = Buffer.from(hexString, 'hex');
              parsed = true;
            } catch (e) {
              console.error('Error parsing hex string:', e);
            }
          }
        }
        
        if (!parsed) {
          console.error(`Tile ${z}/${x}/${y}: Could not parse data. Type: ${typeof data}, Length: ${data.length}, Preview: ${data.substring(0, 50)}`);
          tileData = Buffer.alloc(0);
        }
      }
    } else if (Buffer.isBuffer(data)) {
      tileData = data;
    } else if (data instanceof Uint8Array) {
      tileData = Buffer.from(data);
    } else if (Array.isArray(data)) {
      // Sometimes bytea is returned as an array of numbers
      tileData = Buffer.from(data);
    } else {
      console.warn('Unexpected data type from RPC:', typeof data, 'Data:', data);
      tileData = Buffer.alloc(0);
    }

    // Log tile size for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && tileData.length > 0) {
      console.log(`Tile ${z}/${x}/${y} size: ${tileData.length} bytes`);
    }

    // Return MVT tile with proper headers
    // Note: Do NOT set Content-Encoding: gzip unless the data is actually gzipped
    // MVT tiles from PostGIS are already compressed
    return new NextResponse(tileData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in MVT tile endpoint:', error);
    // Return empty tile on error (better UX than error page)
    return new NextResponse(new Uint8Array(0), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
