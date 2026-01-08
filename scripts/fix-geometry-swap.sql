-- Fix Geometry Coordinate Swap
-- Run this after setup-postgis.sql to correct swapped lat/long columns
-- 
-- The issue: latitud column contains longitude values, longitud column contains latitude values
-- ST_MakePoint expects (longitude, latitude), so we need to swap them

-- Step 1: Recalculate all geometry with swapped coordinates
UPDATE equipment 
SET geometry = ST_SetSRID(ST_MakePoint(latitud, longitud), 4326)
WHERE longitud IS NOT NULL 
  AND latitud IS NOT NULL
  AND longitud != 0 
  AND latitud != 0;

-- Step 2: Update clients table if needed (check your data first)
-- UPDATE clients 
-- SET geometry = ST_SetSRID(ST_MakePoint(gps_latitud, gps_longitud), 4326)
-- WHERE gps_longitud IS NOT NULL 
--   AND gps_latitud IS NOT NULL
--   AND gps_longitud != 0 
--   AND gps_latitud != 0;

-- Step 3: Verify the fix
-- Run these to verify:
-- SELECT placa, longitud, latitud, 
--        ST_X(geometry) as lon_from_geom, 
--        ST_Y(geometry) as lat_from_geom
-- FROM equipment 
-- WHERE geometry IS NOT NULL 
-- LIMIT 5;
-- 
-- The lon_from_geom should match latitud column
-- The lat_from_geom should match longitud column
