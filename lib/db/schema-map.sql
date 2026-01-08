-- Map-related schema additions
-- This file documents the spatial extensions to the database schema
-- The actual setup is done via scripts/setup-postgis.sql

-- Equipment table spatial additions:
-- - geometry geometry(Point, 4326) - PostGIS point geometry
-- - GIST index on geometry for fast spatial queries
-- - Composite indexes for common filter combinations

-- Clients table spatial additions:
-- - geometry geometry(Point, 4326) - PostGIS point geometry  
-- - GIST index on geometry

-- Spatial indexes created:
-- - idx_equipment_geometry - Primary spatial index
-- - idx_equipment_status_geometry - Composite index for status filtering
-- - idx_equipment_region_geometry - Composite index for region filtering
-- - idx_equipment_type_geometry - Composite index for type filtering
-- - idx_clients_geometry - Client spatial index

-- Triggers:
-- - trigger_update_equipment_geometry - Auto-updates geometry when lat/long changes
