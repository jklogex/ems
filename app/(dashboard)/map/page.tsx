'use client';

import { useState, useRef } from 'react';
import { EquipmentMap } from '@/components/map/EquipmentMap';
import { MapFilters } from '@/components/map/MapFilters';
import { MapSelection } from '@/components/map/MapSelection';
import { SelectionActions } from '@/components/map/SelectionActions';
import { RouteLayer } from '@/components/map/RouteLayer';
import { useMapFilters, MapFilters as MapFiltersType } from '@/lib/hooks/useMapFilters';
import { useMapSelection } from '@/lib/hooks/useMapSelection';
import mapboxgl from 'mapbox-gl';

export default function MapPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { filters, updateFilter, clearFilters } = useMapFilters();
  const { selectedIds, addSelection, clearSelection, toggleSelection } = useMapSelection();
  const [route, setRoute] = useState<{
    geometry: { coordinates: [number, number][] };
    distance: number;
    duration: number;
  } | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Mapbox Token Required</h2>
          <p className="text-muted-foreground">
            Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables
          </p>
        </div>
      </div>
    );
  }

  const handleFiltersChange = (newFilters: MapFiltersType) => {
    Object.keys(newFilters).forEach((key) => {
      updateFilter(key as keyof MapFiltersType, newFilters[key as keyof MapFiltersType]);
    });
    // Clear filters that were removed
    Object.keys(filters).forEach((key) => {
      if (!newFilters[key as keyof MapFiltersType]) {
        updateFilter(key as keyof MapFiltersType, undefined);
      }
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/map/export?format=csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentIds: selectedIds }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `equipment-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleGenerateRoute = async () => {
    try {
      const response = await fetch('/api/map/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentIds: selectedIds }),
      });

      const data = await response.json();
      if (data.success && data.data.route) {
        setRoute({
          geometry: data.data.route.geometry,
          distance: data.data.route.properties.distance,
          duration: data.data.route.properties.duration,
        });
      }
    } catch (error) {
      console.error('Route generation error:', error);
    }
  };

  const handleCreateWorkOrders = async () => {
    // TODO: Implement work order creation
    alert(`Creating work orders for ${selectedIds.length} equipment items...`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar with filters and actions */}
      <div className="w-80 border-r bg-card overflow-y-auto p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Mapa de Equipos</h1>
          <p className="text-sm text-muted-foreground">
            Visualiza y selecciona equipos en el mapa
          </p>
        </div>

        <MapFilters filters={filters} onFiltersChange={handleFiltersChange} />

        <SelectionActions
          selectedCount={selectedIds.length}
          onExport={handleExport}
          onGenerateRoute={handleGenerateRoute}
          onCreateWorkOrders={handleCreateWorkOrders}
          onClearSelection={clearSelection}
        />

        {route && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Ruta Generada</h3>
            <div className="text-sm space-y-1">
              <div>Distancia: {route.distance.toFixed(2)} km</div>
              <div>Tiempo estimado: {Math.round(route.duration / 60)} min</div>
            </div>
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <EquipmentMap
          mapboxToken={mapboxToken}
          filters={filters}
          selectedIds={selectedIds}
          onMapReady={(map) => {
            mapRef.current = map;
          }}
          onPointClick={(id) => {
            toggleSelection(id);
          }}
        />
        {mapRef.current && (
          <>
            <MapSelection
              map={mapRef.current}
              onSelectionChange={(ids) => addSelection(ids)}
            />
            <RouteLayer map={mapRef.current} route={route} />
          </>
        )}
      </div>
    </div>
  );
}
