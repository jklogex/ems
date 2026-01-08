'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { MapFilters as MapFiltersType, useMapFilters } from '@/lib/hooks/useMapFilters';
import { X } from 'lucide-react';

interface MapFiltersProps {
  filters: MapFiltersType;
  onFiltersChange: (filters: MapFiltersType) => void;
}

export function MapFilters({ filters, onFiltersChange }: MapFiltersProps) {
  const handleFilterChange = (key: keyof MapFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilter = (key: keyof MapFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <div className="flex gap-2">
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="NUEVAS">Nuevas</option>
              <option value="REPOTENCIADO">Repotenciado</option>
              <option value="BAJAS">Bajas</option>
            </select>
            {filters.status && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearFilter('status')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <div className="flex gap-2">
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="COOLER">Cooler</option>
              <option value="DRAUGHT">Draught</option>
            </select>
            {filters.type && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearFilter('type')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Región</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filters.region || ''}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              placeholder="Filtrar por región"
              className="flex-1 px-3 py-2 border rounded"
            />
            {filters.region && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearFilter('region')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bodega</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filters.warehouse || ''}
              onChange={(e) => handleFilterChange('warehouse', e.target.value)}
              placeholder="Filtrar por bodega"
              className="flex-1 px-3 py-2 border rounded"
            />
            {filters.warehouse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearFilter('warehouse')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {(filters.status || filters.type || filters.region || filters.warehouse) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onFiltersChange({})}
          >
            Limpiar Filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
