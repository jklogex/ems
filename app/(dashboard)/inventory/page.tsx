'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InventoryItem {
  warehouse_id: string;
  part_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number | null;
  warehouses: {
    nombre: string;
    codigo: string;
  };
  parts: {
    codigo: string;
    nombre: string;
  };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [warehouseFilter, showLowStock]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (warehouseFilter) {
        params.append('warehouse_id', warehouseFilter);
      }
      if (showLowStock) {
        params.append('low_stock', 'true');
      }

      const response = await fetch(`/api/inventory?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch inventory');
      }

      setInventory(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && inventory.length === 0) {
    return <div className="space-y-6"><p>Cargando inventario...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-destructive">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
          <p className="text-muted-foreground">Gestionar inventario y repuestos en bodegas</p>
        </div>
        <Link href="/inventory/parts">
          <Button>Gestionar Repuestos</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lowStock"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="lowStock" className="text-sm font-medium">
                Mostrar solo stock bajo
              </label>
            </div>
            <div>
              <input
                type="text"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border rounded"
                placeholder="Filtrar por bodega (ID)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Bodega
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Repuesto
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Código
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Cantidad
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Mínimo
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const isLowStock = item.quantity <= item.min_stock;
                return (
                  <tr
                    key={`${item.warehouse_id}-${item.part_id}`}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      isLowStock ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <td className="p-4 align-middle">
                      {item.warehouses?.nombre || '-'}
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {item.parts?.nombre || '-'}
                    </td>
                    <td className="p-4 align-middle">
                      {item.parts?.codigo || '-'}
                    </td>
                    <td className="p-4 align-middle">
                      {item.quantity}
                    </td>
                    <td className="p-4 align-middle">
                      {item.min_stock}
                    </td>
                    <td className="p-4 align-middle">
                      {isLowStock ? (
                        <Badge variant="destructive">Stock Bajo</Badge>
                      ) : (
                        <Badge variant="default">OK</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    </div>
  );
}

