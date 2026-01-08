import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Convert tile coordinates (z, x, y) to bounding box in WGS84
 * Returns [minLon, minLat, maxLon, maxLat]
 */
export function tileToBoundingBox(z: number, x: number, y: number): [number, number, number, number] {
  const n = Math.pow(2, z);
  const minLon = (x / n) * 360 - 180;
  const maxLon = ((x + 1) / n) * 360 - 180;
  const latRad = Math.PI - (2 * Math.PI * y) / n;
  const minLat = Math.atan(Math.sinh(latRad)) * (180 / Math.PI);
  const latRad2 = Math.PI - (2 * Math.PI * (y + 1)) / n;
  const maxLat = Math.atan(Math.sinh(latRad2)) * (180 / Math.PI);
  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Generate MVT tile using PostGIS ST_AsMVT
 * This function builds the SQL query for generating vector tiles
 */
export function buildMVTQuery(
  filters: {
    status?: string;
    type?: string;
    region?: string;
    warehouse?: string;
  } = {}
): string {
  const conditions: string[] = [];
  const params: string[] = [];

  // Base WHERE clause - only include equipment with valid geometry
  conditions.push('e.geometry IS NOT NULL');
  conditions.push('e.longitud IS NOT NULL');
  conditions.push('e.latitud IS NOT NULL');

  // Apply business filters
  if (filters.status) {
    conditions.push(`e.status_neveras = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters.type) {
    conditions.push(`e.coolers_froster = $${params.length + 1}`);
    params.push(filters.type);
  }

  if (filters.region) {
    conditions.push(`e.region_taller = $${params.length + 1}`);
    params.push(filters.region);
  }

  if (filters.warehouse) {
    conditions.push(`e.bodega_nueva = $${params.length + 1}`);
    params.push(filters.warehouse);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build the MVT query
  // ST_AsMVT creates the vector tile binary format
  // We include essential equipment properties in the tile
  const query = `
    SELECT ST_AsMVT(q, 'equipment', 4096, 'geometry') AS mvt
    FROM (
      SELECT 
        e.id,
        e.placa,
        e.codigo,
        e.modelo,
        e.marca,
        e.status_neveras,
        e.coolers_froster,
        e.region_taller,
        e.bodega_nueva,
        e.longitud,
        e.latitud,
        ST_AsMVTGeom(
          e.geometry,
          ST_TileEnvelope($1, $2, $3),
          4096,
          256,
          true
        ) AS geometry
      FROM equipment e
      ${whereClause}
      AND ST_Intersects(
        e.geometry,
        ST_TileEnvelope($1, $2, $3)
      )
    ) q
    WHERE q.geometry IS NOT NULL
  `;

  return query;
}

/**
 * Execute MVT query and return binary tile data
 */
export async function getMVTile(
  supabase: SupabaseClient,
  z: number,
  x: number,
  y: number,
  filters: {
    status?: string;
    type?: string;
    region?: string;
    warehouse?: string;
  } = {}
): Promise<Buffer | null> {
  try {
    // Validate tile coordinates
    const maxCoord = Math.pow(2, z);
    if (x < 0 || x >= maxCoord || y < 0 || y >= maxCoord || z < 0 || z > 20) {
      return null;
    }

    // Build query with filters
    const baseQuery = buildMVTQuery(filters);
    
    // Execute as RPC call since we're using raw SQL with PostGIS functions
    // Supabase doesn't have direct ST_AsMVT support, so we use rpc
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
      console.error('MVT query error:', error);
      return null;
    }

    // If using RPC, data will be the MVT binary
    // Otherwise, we need to use raw SQL query
    // For now, we'll use a direct SQL approach via Supabase's query builder
    // Note: This requires enabling pg_net or using a custom function
    
    // Alternative: Use Supabase's PostgREST with a database function
    // For production, create a PostgreSQL function that returns bytea
    return null;
  } catch (error) {
    console.error('Error generating MVT tile:', error);
    return null;
  }
}

/**
 * Alternative: Create a database function for MVT generation
 * This SQL should be run in the database to create the function
 */
export const createMVTFunctionSQL = `
CREATE OR REPLACE FUNCTION get_mvt_tile(
  z_param INTEGER,
  x_param INTEGER,
  y_param INTEGER,
  status_filter VARCHAR DEFAULT NULL,
  type_filter VARCHAR DEFAULT NULL,
  region_filter VARCHAR DEFAULT NULL,
  warehouse_filter VARCHAR DEFAULT NULL
)
RETURNS bytea
LANGUAGE plpgsql
AS $$
DECLARE
  mvt bytea;
BEGIN
  SELECT ST_AsMVT(q, 'equipment', 4096, 'geometry') INTO mvt
  FROM (
    SELECT 
      e.id,
      e.placa,
      e.codigo,
      e.modelo,
      e.marca,
      e.status_neveras,
      e.coolers_froster,
      e.region_taller,
      e.bodega_nueva,
      e.longitud,
      e.latitud,
      ST_AsMVTGeom(
        e.geometry,
        ST_TileEnvelope(z_param, x_param, y_param),
        4096,
        256,
        true
      ) AS geometry
    FROM equipment e
    WHERE e.geometry IS NOT NULL
      AND e.longitud IS NOT NULL
      AND e.latitud IS NOT NULL
      AND (status_filter IS NULL OR e.status_neveras = status_filter)
      AND (type_filter IS NULL OR e.coolers_froster = type_filter)
      AND (region_filter IS NULL OR e.region_taller = region_filter)
      AND (warehouse_filter IS NULL OR e.bodega_nueva = warehouse_filter)
      AND ST_Intersects(
        e.geometry,
        ST_TileEnvelope(z_param, x_param, y_param)
      )
  ) q
  WHERE q.geometry IS NOT NULL;
  
  RETURN COALESCE(mvt, '\\x'::bytea);
END;
$$;
`;
