# Map Setup Guide

## Overview

The map feature provides a high-performance visualization of equipment across the country using Mapbox GL JS and PostGIS vector tiles. It supports clustering, filtering, selection, and route generation.

## Prerequisites

1. **PostGIS Extension**: Must be enabled in Supabase
2. **Mapbox Account**: Requires a Mapbox access token
3. **Database Setup**: Run the PostGIS setup script

## Setup Steps

### 1. Enable PostGIS in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Database → Extensions
3. Enable the `postgis` extension

### 2. Run PostGIS Setup Script

Execute the SQL script in Supabase SQL Editor:

```bash
# The script is located at:
scripts/setup-postgis.sql
```

This script will:
- Enable PostGIS extension
- Add geometry column to equipment table
- Create spatial indexes
- Migrate existing lat/long data to PostGIS geometry
- Create the MVT tile generation function

### 3. Configure Mapbox Token

Add your Mapbox access token to `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

Get your token from: https://account.mapbox.com/access-tokens/

### 4. Verify Setup

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check PostGIS is enabled
SELECT PostGIS_version();

-- Check geometry column exists
SELECT COUNT(*) FROM equipment WHERE geometry IS NOT NULL;

-- Test MVT function
SELECT length(get_mvt_tile(10, 512, 512, NULL, NULL, NULL, NULL));
```

## Architecture

### Backend

- **MVT Tile Endpoint**: `/api/map/tiles/[z]/[x]/[y]` - Generates vector tiles using PostGIS
- **Equipment Detail**: `/api/map/equipment/[id]` - Returns equipment info for popups
- **Route Generation**: `/api/map/routes` - Generates optimized routes
- **Export**: `/api/map/export` - Exports selected equipment as CSV/JSON

### Frontend

- **EquipmentMap**: Main map component with clustering and styling
- **MapFilters**: Filter controls for status, type, region, warehouse
- **MapSelection**: Box selection system (Shift/Ctrl + drag)
- **SelectionActions**: Actions menu for selected equipment
- **RouteLayer**: Displays generated routes on map

## Usage

### Accessing the Map

Navigate to `/map` in the application. The map will:
- Load equipment data as vector tiles
- Display clustered points at low zoom levels
- Show individual points at high zoom levels
- Support filtering by status, type, region, and warehouse

### Selecting Equipment

- **Single Click**: Click a point to view details in popup
- **Box Selection**: Hold Shift/Ctrl and drag to select multiple points
- **Selected points** are highlighted with a yellow border

### Filtering

Use the filter panel on the left to:
- Filter by status (Nuevas, Repotenciado, Bajas)
- Filter by type (Cooler, Draught)
- Filter by region (text search)
- Filter by warehouse (text search)

Filters are applied server-side in tile generation for optimal performance.

### Generating Routes

1. Select equipment points on the map
2. Click "Generar Ruta" in the selection actions panel
3. The route will be displayed on the map with distance and time estimates

### Exporting Data

1. Select equipment points
2. Click "Exportar (CSV/JSON)" in the selection actions panel
3. Choose format (CSV or JSON)
4. File will be downloaded

## Performance Considerations

- **Spatial Indexes**: GIST indexes ensure fast spatial queries
- **Tile Caching**: Tiles are cached with 1-hour expiration
- **Server-Side Filtering**: All filters applied in database queries
- **Clustering**: Points clustered at low zoom levels to reduce rendering load
- **Lazy Loading**: Only visible tiles are loaded

## Troubleshooting

### Map Not Loading

1. Check Mapbox token is set in environment variables
2. Verify token is valid and has proper permissions
3. Check browser console for errors

### No Points Showing

1. Verify PostGIS setup script ran successfully
2. Check equipment table has geometry data:
   ```sql
   SELECT COUNT(*) FROM equipment WHERE geometry IS NOT NULL;
   ```
3. Verify MVT function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_mvt_tile';
   ```

### Tiles Not Generating

1. Check Supabase logs for errors
2. Verify PostGIS extension is enabled
3. Test MVT function directly in SQL Editor
4. Check tile endpoint returns proper Content-Type headers

### Selection Not Working

1. Ensure you're holding Shift/Ctrl while dragging
2. Check browser console for JavaScript errors
3. Verify map is fully loaded before attempting selection

## Future Enhancements

- [ ] Integrate Mapbox Directions API for optimized routing
- [ ] Add lasso selection tool
- [ ] Implement work order creation from selection
- [ ] Add heatmap visualization
- [ ] Support for multiple map styles
- [ ] Export routes as GPX files
- [ ] Real-time equipment status updates
