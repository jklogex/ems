'use client';

import { useState, useEffect } from 'react';
import type { Equipment } from '@/lib/db/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EquipmentTableProps {
  searchParams?: {
    placa?: string;
    codigo?: string;
    region?: string;
    status?: string;
    type?: string;
    warehouse?: string;
  };
}

export default function EquipmentTable({ searchParams }: EquipmentTableProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchEquipment();
  }, [page, searchParams]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
        ...searchParams,
      });

      const response = await fetch(`/api/equipment?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch equipment');
      }

      setEquipment(result.data || []);
      setTotalCount(result.count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && equipment.length === 0) {
    return <div className="p-4">Cargando equipos...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              PLACA
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Código
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Modelo
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Marca
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Tipo
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Bodega
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Estado
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-medium">
                {item.placa}
              </td>
              <td className="p-4 align-middle">
                {item.codigo}
              </td>
              <td className="p-4 align-middle">
                {item.modelo || '-'}
              </td>
              <td className="p-4 align-middle">
                {item.marca || '-'}
              </td>
              <td className="p-4 align-middle">
                {item.coolers_froster || '-'}
              </td>
              <td className="p-4 align-middle">
                {item.bodega_nueva || '-'}
              </td>
              <td className="p-4 align-middle">
                <Badge variant={item.status_neveras ? "default" : "secondary"}>
                  {item.status_neveras || 'N/A'}
                </Badge>
              </td>
              <td className="p-4 align-middle">
                <Link href={`/equipment/${item.id}`}>
                  <Button variant="ghost" size="sm">Ver</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} de {totalCount}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            variant="outline"
            size="sm"
          >
            Anterior
          </Button>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * pageSize >= totalCount}
            variant="outline"
            size="sm"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

