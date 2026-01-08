import { useState, useCallback } from 'react';

export function useMapSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const addSelection = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const newIds = ids.filter((id) => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, []);

  const removeSelection = useCallback((ids: string[]) => {
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    toggleSelection,
    addSelection,
    removeSelection,
    clearSelection,
  };
}
