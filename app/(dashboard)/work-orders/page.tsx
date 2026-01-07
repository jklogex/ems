'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkOrder {
  id: string;
  type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  equipment: {
    placa: string;
    codigo: string;
    modelo: string;
  };
  technician: {
    name: string;
    email: string;
  } | null;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    status: '',
    type: '',
    technician_id: '',
  });
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchWorkOrders();
  }, [page, searchParams]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      created: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
        ...Object.fromEntries(
          Object.entries(searchParams).filter(([_, v]) => v !== '')
        ),
      });

      const response = await fetch(`/api/work-orders?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch work orders');
      }

      setWorkOrders(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };


  if (loading && workOrders.length === 0) {
    return <div className="space-y-6"><p>Cargando órdenes de trabajo...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-destructive">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Gestionar órdenes de trabajo y mantenimiento</p>
        </div>
        <Link href="/work-orders/new">
          <Button>Nueva Orden</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={searchParams.status}
                onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="created">Creada</option>
                <option value="assigned">Asignada</option>
                <option value="in_progress">En Proceso</option>
                <option value="closed">Cerrada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={searchParams.type}
                onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="inspection">Inspección</option>
                <option value="preventive">Preventivo</option>
                <option value="corrective">Correctivo</option>
                <option value="emergency">Emergencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Técnico</label>
              <input
                type="text"
                value={searchParams.technician_id}
                onChange={(e) => setSearchParams({ ...searchParams, technician_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="ID del técnico"
              />
            </div>
          </form>
        </CardContent>
      </Card>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Fecha Programada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {wo.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {wo.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {wo.equipment?.placa || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(wo.priority)}`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(wo.status)}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {wo.technician?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {wo.scheduled_date
                      ? new Date(wo.scheduled_date).toLocaleDateString('es-ES')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/work-orders/${wo.id}`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}

