'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function MobileWorkOrderPage() {
  const params = useParams();
  const [workOrder, setWorkOrder] = useState<any>(null);
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
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen p-4">
        <div className="text-red-600 mb-4">Error: {error || 'Orden no encontrada'}</div>
        <Link href="/mobile" className="text-blue-600 hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <Link href="/mobile" className="text-blue-600 hover:underline">
            ← Volver
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          {workOrder.equipment?.placa || 'Orden de Trabajo'}
        </h1>

        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="font-semibold mb-2">Información</h2>
            <p className="text-sm text-gray-600">Tipo: {workOrder.type}</p>
            <p className="text-sm text-gray-600">Estado: {workOrder.status}</p>
            <p className="text-sm text-gray-600">Prioridad: {workOrder.priority}</p>
          </div>

          {workOrder.equipment && (
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="font-semibold mb-2">Equipo</h2>
              <p className="text-sm text-gray-600">PLACA: {workOrder.equipment.placa}</p>
              <p className="text-sm text-gray-600">Modelo: {workOrder.equipment.modelo || '-'}</p>
              {workOrder.equipment.latitud && workOrder.equipment.longitud && (
                <a
                  href={`https://www.google.com/maps?q=${workOrder.equipment.latitud},${workOrder.equipment.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm mt-2 inline-block"
                >
                  Abrir en Maps →
                </a>
              )}
            </div>
          )}

          {workOrder.diagnosis && (
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="font-semibold mb-2">Diagnóstico</h2>
              <p className="text-sm whitespace-pre-wrap">{workOrder.diagnosis}</p>
            </div>
          )}

          {workOrder.actions_performed && (
            <div className="p-4 bg-white rounded-lg shadow">
              <h2 className="font-semibold mb-2">Acciones Realizadas</h2>
              <p className="text-sm whitespace-pre-wrap">{workOrder.actions_performed}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

