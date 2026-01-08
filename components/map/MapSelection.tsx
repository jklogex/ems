'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Square, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapSelectionProps {
  map: mapboxgl.Map | null;
  onSelectionChange: (selectedIds: string[]) => void;
}

type SelectionMode = 'box' | 'lasso' | 'off';

export function MapSelection({ map, onSelectionChange }: MapSelectionProps) {
  const [mode, setMode] = useState<SelectionMode>('off');
  const isSelecting = useRef(false);
  const startPoint = useRef<mapboxgl.Point | null>(null);
  const lassoPath = useRef<[number, number][]>([]);
  const selectionLayerId = 'selection-overlay';

  useEffect(() => {
    if (!map) return;

    // Create overlay layer for drawing selection
    if (!map.getSource(selectionLayerId)) {
      map.addSource(selectionLayerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    // Add selection polygon layer if it doesn't exist
    if (!map.getLayer(selectionLayerId)) {
      map.addLayer({
        id: selectionLayerId,
        type: 'fill',
        source: selectionLayerId,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.2,
        },
      });

      map.addLayer({
        id: `${selectionLayerId}-stroke`,
        type: 'line',
        source: selectionLayerId,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    }

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (mode === 'off') return;
      if (e.originalEvent.button !== 0) return; // Only left mouse button

      isSelecting.current = true;
      startPoint.current = e.point;
      lassoPath.current = [[e.lngLat.lng, e.lngLat.lat]];

      // Prevent map panning during selection
      map.dragPan.disable();

      // Change cursor to crosshair while drawing
      map.getCanvas().style.cursor = 'crosshair';
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isSelecting.current || mode === 'off') return;

      if (mode === 'lasso') {
        lassoPath.current.push([e.lngLat.lng, e.lngLat.lat]);
      }

      // Update selection overlay
      const source = map.getSource(selectionLayerId) as mapboxgl.GeoJSONSource;
      if (source) {
        if (mode === 'box' && startPoint.current) {
          const bounds = new mapboxgl.LngLatBounds(
            map.unproject(startPoint.current),
            e.lngLat
          );
          const bbox = bounds.toArray().flat();
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[1]],
                    [bbox[2], bbox[3]],
                    [bbox[0], bbox[3]],
                    [bbox[0], bbox[1]],
                  ]],
                },
                properties: {},
              },
            ],
          });
        } else if (mode === 'lasso' && lassoPath.current.length > 1) {
          // Close the lasso path
          const closedPath = [...lassoPath.current, lassoPath.current[0]];
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [closedPath],
                },
                properties: {},
              },
            ],
          });
        }
      }
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isSelecting.current || mode === 'off') return;

      isSelecting.current = false;
      map.dragPan.enable();

      // Restore default cursor
      map.getCanvas().style.cursor = '';

      let selectedIds: string[] = [];

      if (mode === 'box' && startPoint.current) {
        // Box selection - query features in bounding box
        const bounds = new mapboxgl.LngLatBounds(
          map.unproject(startPoint.current),
          e.lngLat
        );

        const features = map.queryRenderedFeatures(
          [
            [Math.min(startPoint.current.x, e.point.x), Math.min(startPoint.current.y, e.point.y)],
            [Math.max(startPoint.current.x, e.point.x), Math.max(startPoint.current.y, e.point.y)],
          ],
          {
            layers: ['equipment-points'],
          }
        );

        selectedIds = features
          .map((f) => f.properties?.id)
          .filter((id) => id != null)
          .map((id) => String(id));
      } else if (mode === 'lasso' && lassoPath.current.length > 2) {
        // Lasso selection - check point-in-polygon
        const polygon = [...lassoPath.current, lassoPath.current[0]];

        // Get all visible features
        const bounds = map.getBounds();
        const features = map.queryRenderedFeatures({
          layers: ['equipment-points'],
        });

        // Filter features that are inside the polygon
        selectedIds = features
          .filter((feature) => {
            const coords = (feature.geometry as any).coordinates;
            return pointInPolygon(coords, polygon);
          })
          .map((f) => f.properties?.id)
          .filter((id) => id != null)
          .map((id) => String(id));
      }

      // Clear selection overlay
      const source = map.getSource(selectionLayerId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }

      if (selectedIds.length > 0) {
        onSelectionChange(selectedIds);
      }

      startPoint.current = null;
      lassoPath.current = [];
    };

    // Handle escape key to cancel selection
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelecting.current) {
        isSelecting.current = false;
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
        const source = map.getSource(selectionLayerId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
        startPoint.current = null;
        lassoPath.current = [];
      }
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Clean up selection overlay
      const source = map.getSource(selectionLayerId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    };
  }, [map, mode, onSelectionChange]);

  // Point-in-polygon algorithm (ray casting)
  const pointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2 bg-card border rounded-lg p-2 shadow-lg">
      <Button
        variant={mode === 'off' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setMode('off')}
        title="Disable selection (click to select individual points)"
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === 'box' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setMode(mode === 'box' ? 'off' : 'box')}
        title="Box selection - drag to select area"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === 'lasso' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setMode(mode === 'lasso' ? 'off' : 'lasso')}
        title="Lasso selection - draw freeform area"
      >
        <MousePointer2 className="h-4 w-4 rotate-45" />
      </Button>
      {mode !== 'off' && (
        <span className="text-xs text-muted-foreground self-center px-2">
          {mode === 'box' ? 'Drag to select' : 'Draw to select'}
        </span>
      )}
    </div>
  );
}
