-- PostGIS Setup for Map Functionality
-- Run this in Supabase SQL Editor after enabling PostGIS extension
-- 
-- This script:
-- 1. Enables PostGIS extension (if not already enabled)
-- 2. Adds geometry column to equipment table
-- 3. Creates spatial indexes for performance
-- 4. Migrates existing lat/long data to PostGIS geometry

-- Step 1: Enable PostGIS extension
-- Note: In Supabase, PostGIS is usually pre-enabled, but this ensures it's available
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Add geometry column to equipment table
-- Using SRID 4326 (WGS84) which is standard for lat/long coordinates
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS geometry geometry(Point, 4326);

-- Step 3: Create spatial index for fast spatial queries
-- GIST index is essential for performance with spatial queries
CREATE INDEX IF NOT EXISTS idx_equipment_geometry 
ON equipment USING GIST (geometry);

-- Step 4: Create separate indexes for common filter columns
-- B-tree indexes for text columns (GIST doesn't work with VARCHAR)
-- These will be used in combination with the geometry index for filtered spatial queries
CREATE INDEX IF NOT EXISTS idx_equipment_status 
ON equipment (status_neveras) 
WHERE status_neveras IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_region 
ON equipment (region_taller) 
WHERE region_taller IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_type 
ON equipment (coolers_froster) 
WHERE coolers_froster IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_warehouse 
ON equipment (bodega_nueva) 
WHERE bodega_nueva IS NOT NULL;

-- Step 5: Migrate existing lat/long data to geometry column
-- NOTE: latitud column contains longitude values, and longitud column contains latitude values
-- ST_MakePoint expects (longitude, latitude), so we swap them: (latitud, longitud)
UPDATE equipment 
SET geometry = ST_SetSRID(ST_MakePoint(latitud, longitud), 4326)
WHERE geometry IS NULL 
  AND longitud IS NOT NULL 
  AND latitud IS NOT NULL
  AND longitud != 0 
  AND latitud != 0;

-- Step 6: Create trigger to automatically update geometry when lat/long changes
-- This ensures geometry stays in sync with lat/long columns
CREATE OR REPLACE FUNCTION update_equipment_geometry()
RETURNS TRIGGER AS $$
BEGIN
  -- NOTE: latitud column contains longitude, longitud column contains latitude
  -- ST_MakePoint expects (longitude, latitude), so we swap: (latitud, longitud)
  IF NEW.longitud IS NOT NULL AND NEW.latitud IS NOT NULL 
     AND NEW.longitud != 0 AND NEW.latitud != 0 THEN
    NEW.geometry = ST_SetSRID(ST_MakePoint(NEW.latitud, NEW.longitud), 4326);
  ELSE
    NEW.geometry = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_update_equipment_geometry ON equipment;
CREATE TRIGGER trigger_update_equipment_geometry
BEFORE INSERT OR UPDATE OF longitud, latitud ON equipment
FOR EACH ROW
EXECUTE FUNCTION update_equipment_geometry();

-- Step 7: Add geometry column to clients table (for future use)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS geometry geometry(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_clients_geometry 
ON clients USING GIST (geometry);

-- Migrate client coordinates
-- NOTE: Check if clients table has the same column swap issue
-- If gps_latitud contains longitude and gps_longitud contains latitude, swap them
UPDATE clients 
SET geometry = ST_SetSRID(ST_MakePoint(gps_latitud, gps_longitud), 4326)
WHERE geometry IS NULL 
  AND gps_longitud IS NOT NULL 
  AND gps_latitud IS NOT NULL
  AND gps_longitud != 0 
  AND gps_latitud != 0;

-- Step 8: Create MVT tile generation function
-- This function generates Mapbox Vector Tiles using PostGIS ST_AsMVT
-- Note: ST_TileEnvelope returns geometries in SRID 3857 (Web Mercator)
-- Equipment geometry is stored in SRID 4326 (WGS84), so we need to transform it
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
  tile_bounds geometry;
BEGIN
  -- Get tile envelope in 3857 (Web Mercator)
  tile_bounds := ST_TileEnvelope(z_param, x_param, y_param);
  
  SELECT ST_AsMVT(q, 'equipment', 4096, 'geometry') INTO mvt
  FROM (
    SELECT 
      e.id::text,
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
        ST_Transform(e.geometry, 3857),  -- Transform to Web Mercator for tile operations
        tile_bounds,
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
        ST_Transform(e.geometry, 3857),  -- Transform to Web Mercator for intersection check
        tile_bounds
      )
  ) q
  WHERE q.geometry IS NOT NULL;
  
  RETURN COALESCE(mvt, '\\x'::bytea);
END;
$$;

-- Step 9: Verify setup
-- Run these queries to verify the setup worked:
-- SELECT COUNT(*) FROM equipment WHERE geometry IS NOT NULL;
-- SELECT COUNT(*) FROM clients WHERE geometry IS NOT NULL;
-- EXPLAIN ANALYZE SELECT * FROM equipment WHERE ST_Intersects(geometry, ST_MakeEnvelope(-80, -2, -79, -1, 4326));
-- SELECT length(get_mvt_tile(10, 512, 512, NULL, NULL, NULL, NULL));
