'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPopup } from './MapPopup';

interface EquipmentMapProps {
  mapboxToken: string;
  filters?: {
    status?: string;
    type?: string;
    region?: string;
    warehouse?: string;
  };
  onPointClick?: (equipmentId: string) => void;
  selectedIds?: string[];
  onMapReady?: (map: mapboxgl.Map) => void;
}

export function EquipmentMap({
  mapboxToken,
  filters = {},
  onPointClick,
  selectedIds = [],
  onMapReady,
}: EquipmentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [popup, setPopup] = useState<{ equipmentId: string; lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with WebGL
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: mapboxToken,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-78.5, -0.2], // Ecuador center
      zoom: 6,
      antialias: true,
    });

    // Add error handler
    map.current.on('error', (e) => {
      console.error('[EquipmentMap] Map error:', e);
    });

    // Helper function to add equipment source (defined before use)
    const addEquipmentSource = () => {
      if (!map.current) {
        return;
      }

      // Notify parent that map is ready
      onMapReady?.(map.current);

      // Check if source already exists
      if (map.current.getSource('equipment')) {
        return;
      }

      // Add vector tile source
      try {
        const filterParams = new URLSearchParams(
          Object.entries(filters).filter(([_, v]) => v).map(([k, v]) => [k, v as string])
        );
        const tileUrl = `${window.location.origin}/api/map/tiles/{z}/{x}/{y}${filterParams.toString() ? `?${filterParams.toString()}` : ''}`;

        map.current.addSource('equipment', {
          type: 'vector',
          tiles: [tileUrl],
          minzoom: 6, // Only show points at zoom level 6 and above to reduce initial load
          maxzoom: 14,
          // Use the feature property `id` as the feature id so we can use feature-state
          promoteId: 'id',
        });

        // Listen for source data events to debug
        map.current.on('sourcedata', (e) => {
          if (e.sourceId === 'equipment') {
            // no-op; kept for potential future debugging
          }
        });

        // Listen for source errors
        map.current.on('error', (e) => {
          // Already handled by global error handler above
        });

        // Listen for tile loading events
        map.current.on('data', (e) => {
          if ('sourceId' in e && e.sourceId === 'equipment') {
            // no-op; kept for potential future debugging
          }
        });

        // Add unclustered point layer with default styling.
        // Selection styling is driven by feature-state in the paint expressions.
        map.current.addLayer({
          id: 'equipment-points',
          type: 'circle',
          source: 'equipment',
          'source-layer': 'equipment',
          filter: ['!=', ['get', 'cluster'], true],
          paint: {
            // Standard Mapbox pattern: use feature-state for interactive styling
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#00ffff', // selected
              '#ef4444', // default
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10,
              3,
              15,
              6,
            ],
            'circle-stroke-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3, // selected
              0, // default
            ],
            'circle-stroke-color': '#00ffff',
          },
        });

      // Add cluster layer
      map.current.addLayer({
        id: 'equipment-clusters',
        type: 'circle',
        source: 'equipment',
        'source-layer': 'equipment',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#3b82f6',
            10,
            '#22c55e',
            50,
            '#fbbf24',
            100,
            '#ef4444',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            50,
            40,
            100,
            50,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'equipment-cluster-count',
        type: 'symbol',
        source: 'equipment',
        'source-layer': 'equipment',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#fff',
        },
      });

      // Handle point clicks
      map.current.on('click', 'equipment-points', (e) => {
        if (!map.current || !e.features?.[0]) return;

        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const equipmentId = feature.properties?.id;

        if (equipmentId) {
          setPopup({
            equipmentId,
            lng: coordinates[0],
            lat: coordinates[1],
          });
          onPointClick?.(equipmentId);
        }
      });

      // Handle cluster clicks - zoom in
      map.current.on('click', 'equipment-clusters', (e) => {
        if (!map.current || !e.features?.[0]) return;

        const feature = e.features[0];
        const clusterId = feature.properties?.cluster_id;

        const source = map.current.getSource('equipment') as mapboxgl.VectorTileSource;
        if (source && 'getClusterExpansionZoom' in source) {
          (source as any).getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number | undefined) => {
            if (err || !map.current) return;

            map.current.easeTo({
              center: (feature.geometry as any).coordinates,
              zoom: zoom || map.current.getZoom() + 1,
            });
          });
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'equipment-points', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'equipment-points', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
        });
      } catch (error) {
        console.error('Error adding map sources/layers:', error);
      }
    };

    // Wait for map to be fully loaded (load event fires after style is ready)
    map.current.on('load', () => {
      console.log('[EquipmentMap] Map loaded event fired');
      
      if (!map.current) {
        console.error('[EquipmentMap] Map instance is null');
        return;
      }

      // Double-check that style is loaded
      if (!map.current.isStyleLoaded()) {
        console.warn('[EquipmentMap] Style not fully loaded, waiting 100ms...');
        setTimeout(() => {
          if (map.current && map.current.isStyleLoaded()) {
            addEquipmentSource();
          } else {
            console.error('[EquipmentMap] Style still not loaded after timeout');
          }
        }, 100);
        return;
      }
      
      addEquipmentSource();
    });

    return () => {
      if (map.current) {
        try {
          // Remove all event listeners before removing the map
          map.current.off();
          map.current.remove();
        } catch (error) {
          // Ignore errors during cleanup
          console.warn('Error during map cleanup:', error);
        }
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Track previous filters to detect changes
  const prevFiltersRef = useRef<string>('');
  
  // Update tile source when filters change
  useEffect(() => {
    // Serialize current filters to compare
    const currentFiltersStr = JSON.stringify(filters);
    
    // Skip if filters haven't actually changed
    if (prevFiltersRef.current === currentFiltersStr) {
      return;
    }
    
    // Skip the initial empty filters (first render)
    const isFirstRender = prevFiltersRef.current === '';
    prevFiltersRef.current = currentFiltersStr;
    
    // Don't update on first render - the initial source already has the right URL
    if (isFirstRender && Object.keys(filters).length === 0) {
      console.log('Filter effect: skipping initial empty filters');
      return;
    }

    const updateTileSource = () => {
      if (!map.current) {
        console.log('Filter effect: no map');
        return;
      }

      try {
        // Build filter params using URLSearchParams for proper encoding
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });

        const tileUrl = `${window.location.origin}/api/map/tiles/{z}/{x}/{y}${params.toString() ? `?${params.toString()}` : ''}`;
        
        console.log('Updating tile source with filters:', filters);
        console.log('New tile URL:', tileUrl);

        // Remove and re-add source to force complete reload
        const layersToRemove = ['equipment-points', 'equipment-clusters', 'equipment-cluster-count'];
        
        // Remove layers first (must remove before source)
        layersToRemove.forEach(layerId => {
          try {
            if (map.current?.getLayer(layerId)) {
              map.current.removeLayer(layerId);
            }
          } catch (e) {
            // Ignore errors
          }
        });
        
        // Remove source
        try {
          if (map.current.getSource('equipment')) {
            map.current.removeSource('equipment');
          }
        } catch (e) {
          // Ignore errors
        }
        
        // Re-add source with new URL
        map.current.addSource('equipment', {
          type: 'vector',
          tiles: [tileUrl],
          minzoom: 6,
          maxzoom: 14,
          promoteId: 'id',
        });
        
        // Re-add point layer
        map.current.addLayer({
          id: 'equipment-points',
          type: 'circle',
          source: 'equipment',
          'source-layer': 'equipment',
          filter: ['!=', ['get', 'cluster'], true],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#00ffff',
              '#ef4444',
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10,
              3,
              15,
              6,
            ],
            'circle-stroke-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3,
              0,
            ],
            'circle-stroke-color': '#00ffff',
          },
        });
        
        // Re-add cluster layer
        map.current.addLayer({
          id: 'equipment-clusters',
          type: 'circle',
          source: 'equipment',
          'source-layer': 'equipment',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3b82f6',
              10,
              '#22c55e',
              50,
              '#fbbf24',
              100,
              '#ef4444',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              10,
              30,
              50,
              40,
              100,
              50,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });
        
        // Re-add cluster count layer
        map.current.addLayer({
          id: 'equipment-cluster-count',
          type: 'symbol',
          source: 'equipment',
          'source-layer': 'equipment',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#fff',
          },
        });
        
        console.log('Source and layers recreated successfully');
      } catch (error) {
        console.error('Error updating tile source:', error);
        
        // If there was an error, try again after a short delay
        setTimeout(() => {
          if (map.current) {
            console.log('Retrying tile source update...');
            updateTileSource();
          }
        }, 500);
      }
    };

    // Run the update - use a small delay to ensure map is ready
    const timeoutId = setTimeout(updateTileSource, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [filters]);

  // Keep feature-state `selected` in sync with selectedIds for visual styling
  useEffect(() => {
    if (!map.current) return;
    if (!map.current.getLayer('equipment-points')) return;
    
    let cancelled = false;
    
    // Wait for map to be ready - use requestAnimationFrame to ensure sync happens after map updates
    const syncFeatureState = () => {
      if (cancelled) return;
      if (!map.current) return;
      if (!map.current.loaded()) {
        // Map not ready yet, wait for it
        requestAnimationFrame(syncFeatureState);
        return;
      }

      const m = map.current;
      const ids = selectedIds.map((id) => String(id));

      try {
        // For simplicity, clear selection state on all currently rendered features,
        // then apply selection to the ones in selectedIds.
        // Query all rendered features in the viewport
        const rendered = m.queryRenderedFeatures({
          layers: ['equipment-points'],
        });

        // Clear existing selection state
        rendered.forEach((feature) => {
          if (feature.id == null || cancelled) return;
          try {
            m.setFeatureState(
              {
                source: 'equipment',
                sourceLayer: 'equipment',
                id: feature.id,
              },
              { selected: false }
            );
          } catch (e) {
            // Ignore errors during cleanup
          }
        });

        // Apply selection to features whose ids are in selectedIds
        rendered.forEach((feature) => {
          if (feature.id == null || cancelled) return;
          const fid = String(feature.id);
          if (ids.includes(fid)) {
            try {
              m.setFeatureState(
                {
                  source: 'equipment',
                  sourceLayer: 'equipment',
                  id: feature.id,
                },
                { selected: true }
              );
            } catch (e) {
              // Ignore errors during cleanup
            }
          }
        });
      } catch (error) {
        // Silently ignore errors during cleanup/unmount
        if (!cancelled && map.current && map.current.loaded()) {
          console.error('Error syncing feature-state selection:', error);
        }
      }
    };
    
    // Start the sync process
    requestAnimationFrame(syncFeatureState);
    
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {popup && (
        <MapPopup
          equipmentId={popup.equipmentId}
          lng={popup.lng}
          lat={popup.lat}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
