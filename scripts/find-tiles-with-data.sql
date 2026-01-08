-- Script to find which tiles contain equipment data
-- This helps identify the correct tile coordinates for Ecuador

-- First, check equipment bounds
SELECT 
  ST_XMin(ST_Extent(geometry)) as min_lon,
  ST_YMin(ST_Extent(geometry)) as min_lat,
  ST_XMax(ST_Extent(geometry)) as max_lon,
  ST_YMax(ST_Extent(geometry)) as max_lat,
  COUNT(*) as equipment_count
FROM equipment
WHERE geometry IS NOT NULL;

-- Function to convert lon/lat to tile coordinates
-- This is a simplified version - you can use this to calculate tiles
CREATE OR REPLACE FUNCTION lonlat_to_tile(lon DOUBLE PRECISION, lat DOUBLE PRECISION, z INTEGER)
RETURNS TABLE(x INTEGER, y INTEGER) AS $$
DECLARE
  n DOUBLE PRECISION;
  tile_x INTEGER;
  tile_y INTEGER;
BEGIN
  n := POWER(2, z);
  tile_x := FLOOR(((lon + 180) / 360) * n);
  tile_y := FLOOR(
    ((1 - LN(TAN(RADIANS(lat)) + 1 / COS(RADIANS(lat))) / PI()) / 2) * n
  );
  RETURN QUERY SELECT tile_x, tile_y;
END;
$$ LANGUAGE plpgsql;

-- Test tiles for Ecuador center (-78.5, -0.2)
SELECT 
  z,
  (lonlat_to_tile(-78.5, -0.2, z)).x as x,
  (lonlat_to_tile(-78.5, -0.2, z)).y as y,
  get_mvt_tile(z, (lonlat_to_tile(-78.5, -0.2, z)).x, (lonlat_to_tile(-78.5, -0.2, z)).y, NULL, NULL, NULL, NULL) as mvt_result
FROM generate_series(6, 10) z;

-- Alternative: Test specific tiles and check if they have data
-- Replace these with actual tile coordinates from your map
SELECT 
  '6/32/32' as tile,
  LENGTH(get_mvt_tile(6, 32, 32, NULL, NULL, NULL, NULL)::text) as mvt_length,
  CASE 
    WHEN get_mvt_tile(6, 32, 32, NULL, NULL, NULL, NULL) = '\\x'::bytea THEN 'Empty'
    ELSE 'Has data'
  END as status;

-- Check a sample of equipment coordinates
SELECT 
  placa,
  longitud,
  latitud,
  ST_X(geometry) as geom_lon,
  ST_Y(geometry) as geom_lat,
  -- Calculate which tile this point is in at zoom 8
  (lonlat_to_tile(ST_X(geometry), ST_Y(geometry), 8)).x as tile_x,
  (lonlat_to_tile(ST_X(geometry), ST_Y(geometry), 8)).y as tile_y
FROM equipment
WHERE geometry IS NOT NULL
LIMIT 10;
