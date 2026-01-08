-- Update MVT tile function to limit points at lower zoom levels
-- This prevents loading too many points and stack overflow errors
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
  point_limit INTEGER;
BEGIN
  -- Get tile envelope in 3857 (Web Mercator)
  tile_bounds := ST_TileEnvelope(z_param, x_param, y_param);
  
  -- Limit points based on zoom level to prevent overload
  -- Lower zoom = fewer points (country/region view)
  -- Higher zoom = more points (city/street view)
  CASE 
    WHEN z_param <= 6 THEN point_limit := 1000;      -- Country level: max 1000 points
    WHEN z_param <= 8 THEN point_limit := 5000;      -- Region level: max 5000 points
    WHEN z_param <= 10 THEN point_limit := 20000;    -- City level: max 20000 points
    ELSE point_limit := 50000;                       -- Street level: max 50000 points
  END CASE;
  
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
    ORDER BY e.id  -- Consistent ordering for sampling
    LIMIT point_limit
  ) q
  WHERE q.geometry IS NOT NULL;
  
  RETURN COALESCE(mvt, '\\x'::bytea);
END;
$$;
