import { useState, useCallback } from 'react';

export interface MapFilters {
  status?: string;
  type?: string;
  region?: string;
  warehouse?: string;
}

export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>({});

  const updateFilter = useCallback((key: keyof MapFilters, value: string | undefined) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[key] = value;
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
  };
}
