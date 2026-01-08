'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  height?: string;
}

export function LocationMap({ latitude, longitude, height = '300px' }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Validate coordinates
    if (
      latitude === null || 
      latitude === undefined || 
      longitude === null || 
      longitude === undefined ||
      isNaN(Number(latitude)) || 
      isNaN(Number(longitude)) ||
      Number(latitude) < -90 || 
      Number(latitude) > 90 ||
      Number(longitude) < -180 || 
      Number(longitude) > 180
    ) {
      setError('Coordenadas inválidas');
      console.error('Invalid coordinates:', { latitude, longitude });
      return;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      setError('Mapbox token no configurado');
      return;
    }

    try {
      const lng = Number(longitude);
      const lat = Number(latitude);
      
      console.log('Initializing map with coordinates:', { lng, lat });

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        accessToken: mapboxToken,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
      });

      // Wait for map to load before adding marker
      map.current.on('load', () => {
        if (!map.current) return;

        const lng = Number(longitude);
        const lat = Number(latitude);

        // Add marker
        marker.current = new mapboxgl.Marker({
          color: '#3b82f6',
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Add popup with coordinates
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="text-sm">
              <strong>Ubicación</strong><br>
              ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </div>
          `);
        
        if (marker.current) {
          marker.current.setPopup(popup);
        }
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Error al cargar el mapa');
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error al inicializar el mapa');
    }

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div 
        className="w-full bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Mapbox token no configurado
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full rounded-md overflow-hidden border"
      style={{ height, minHeight: height }}
    />
  );
}
