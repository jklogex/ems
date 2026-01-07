'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkOrderDetail {
  id: string;
  type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  diagnosis: string;
  actions_performed: string;
  notes: string;
  equipment: {
    id: string;
    placa: string;
    codigo: string;
    modelo: string;
    marca: string;
    longitud: number;
    latitud: number;
    clients: {
      nombre_comercial: string;
      direccion: string;
      ciudad: string;
    };
  };
  technician: {
    name: string;
    email: string;
  } | null;
  work_order_items: Array<{
    id: string;
    item_text: string;
    completed: boolean;
    value: string;
  }>;
  work_order_evidence: Array<{
    id: string;
    type: string;
    file_url: string;
    file_name: string;
  }>;
  work_order_parts: Array<{
    id: string;
    quantity: number;
    parts: {
      nombre: string;
    };
  }>;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchWorkOrder();
    }
  }, [params.id]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/work-orders/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch work order');
      }

      setWorkOrder(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><p>Cargando...</p></div>;
  }

  if (error || !workOrder) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Error: {error || 'Orden de trabajo no encontrada'}</div>
        <Link href="/work-orders">
          <Button variant="outline">Volver a la lista</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/work-orders">
          <Button variant="ghost" size="sm">← Volver</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orden de Trabajo</h1>
          <p className="text-muted-foreground">ID: {workOrder.id.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tipo</dt>
                <dd className="mt-1">
                  <Badge>{workOrder.type}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-1">
                  <Badge variant={workOrder.status === 'closed' ? 'default' : 'secondary'}>
                    {workOrder.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Prioridad</dt>
                <dd className="mt-1">
                  <Badge variant={workOrder.priority === 'critical' ? 'destructive' : 'outline'}>
                    {workOrder.priority}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Técnico</dt>
                <dd className="mt-1">{workOrder.technician?.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Fecha Programada</dt>
                <dd className="mt-1">
                  {workOrder.scheduled_date
                    ? new Date(workOrder.scheduled_date).toLocaleDateString('es-ES')
                    : '-'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">PLACA</dt>
                <dd className="mt-1">{workOrder.equipment.placa}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Modelo</dt>
                <dd className="mt-1">{workOrder.equipment.modelo || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Marca</dt>
                <dd className="mt-1">{workOrder.equipment.marca || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Cliente</dt>
                <dd className="mt-1">{workOrder.equipment.clients?.nombre_comercial || workOrder.equipment.codigo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Ubicación</dt>
                <dd className="mt-1">
                  {workOrder.equipment.clients?.direccion || '-'}
                  {workOrder.equipment.clients?.ciudad && `, ${workOrder.equipment.clients.ciudad}`}
                </dd>
              </div>
              {workOrder.equipment.latitud && workOrder.equipment.longitud && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">GPS</dt>
                  <dd className="mt-1">
                    <a
                      href={`https://www.google.com/maps?q=${workOrder.equipment.latitud},${workOrder.equipment.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {workOrder.equipment.latitud}, {workOrder.equipment.longitud}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {workOrder.diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{workOrder.diagnosis}</p>
          </CardContent>
        </Card>
      )}

      {workOrder.actions_performed && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{workOrder.actions_performed}</p>
          </CardContent>
        </Card>
      )}

      {workOrder.work_order_items && workOrder.work_order_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {workOrder.work_order_items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    className="w-4 h-4"
                  />
                  <span className={item.completed ? 'line-through text-gray-500' : ''}>
                    {item.item_text}
                  </span>
                  {item.value && <span className="text-gray-500">({item.value})</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {workOrder.work_order_parts && workOrder.work_order_parts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Repuestos Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Repuesto
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.work_order_parts.map((part) => (
                    <tr key={part.id} className="border-b">
                      <td className="p-4 align-middle">
                        {part.parts?.nombre || '-'}
                      </td>
                      <td className="p-4 align-middle">
                        {part.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {workOrder.work_order_evidence && workOrder.work_order_evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workOrder.work_order_evidence.map((evidence) => (
                <div key={evidence.id} className="border rounded-lg p-2">
                  {evidence.type.startsWith('photo') ? (
                    <img
                      src={evidence.file_url}
                      alt={evidence.file_name || 'Evidence'}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                      {evidence.type === 'signature' ? 'Firma' : 'Documento'}
                    </div>
                  )}
                  <p className="text-xs mt-2 truncate">{evidence.file_name || evidence.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {workOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{workOrder.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

