'use client';

import { useState, useEffect } from 'react';
import type { EquipmentLocationHistory } from '@/lib/db/types';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EquipmentLocationHistoryProps {
  equipmentId: string;
}

export default function EquipmentLocationHistory({ equipmentId }: EquipmentLocationHistoryProps) {
  const [history, setHistory] = useState<EquipmentLocationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchHistory();
  }, [equipmentId, selectedDate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url = selectedDate
        ? `/api/equipment/${equipmentId}/location-history?date=${selectedDate}`
        : `/api/equipment/${equipmentId}/location-history`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch location history');
      }

      if (selectedDate) {
        setHistory(result.data ? [result.data] : []);
      } else {
        setHistory(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Cargando historial de ubicaciones...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="date-search">Buscar ubicación en fecha:</Label>
        <Input
          id="date-search"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        {selectedDate && (
          <Button
            onClick={() => setSelectedDate('')}
            variant="outline"
            size="sm"
          >
            Limpiar
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-4 text-muted-foreground text-center">No hay historial de ubicaciones</div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Fecha Inicio
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Fecha Fin
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Cliente
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Ubicación
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Región
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  GPS
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Movido por
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    {format(new Date(item.start_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="p-4 align-middle">
                    {item.end_date ? (
                      format(new Date(item.end_date), 'dd/MM/yyyy')
                    ) : (
                      <Badge variant="default">Actual</Badge>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    {(item as any).clients?.nombre_comercial || 
                     (item as any).clients?.codigo || 
                     '-'}
                  </td>
                  <td className="p-4 align-middle">
                    {item.ubicacion || '-'}
                  </td>
                  <td className="p-4 align-middle">
                    {item.region_taller || '-'}
                  </td>
                  <td className="p-4 align-middle">
                    {item.latitud && item.longitud
                      ? `${item.latitud.toFixed(6)}, ${item.longitud.toFixed(6)}`
                      : '-'}
                  </td>
                  <td className="p-4 align-middle">
                    {(item as any).users?.name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

