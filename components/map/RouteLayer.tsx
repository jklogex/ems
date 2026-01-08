'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface RouteLayerProps {
  map: mapboxgl.Map | null;
  route: {
    geometry: {
      coordinates: [number, number][];
    };
    distance: number;
    duration: number;
  } | null;
}

export function RouteLayer({ map, route }: RouteLayerProps) {
  const routeSourceId = 'route-source';
  const routeLayerId = 'route-layer';

  useEffect(() => {
    if (!map || !route) return;

    // Add route source if it doesn't exist
    if (!map.getSource(routeSourceId)) {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry,
          properties: {},
        },
      });
    } else {
      (map.getSource(routeSourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: route.geometry,
        properties: {},
      });
    }

    // Add route layer if it doesn't exist
    if (!map.getLayer(routeLayerId)) {
      map.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }

    // Fit map to route bounds
    const coordinates = route.geometry.coordinates;
    if (coordinates.length > 0) {
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
      );

      map.fitBounds(bounds, {
        padding: 50,
      });
    }

    return () => {
      if (map.getLayer(routeLayerId)) {
        map.removeLayer(routeLayerId);
      }
      if (map.getSource(routeSourceId)) {
        map.removeSource(routeSourceId);
      }
    };
  }, [map, route]);

  return null;
}
