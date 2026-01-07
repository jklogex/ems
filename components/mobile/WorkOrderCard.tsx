'use client';

import Link from 'next/link';

interface WorkOrderCardProps {
  workOrder: {
    id: string;
    type: string;
    status: string;
    priority: string;
    scheduled_date: string;
    equipment: {
      placa: string;
      codigo: string;
    };
    clients?: {
      nombre_comercial: string;
    };
  };
}

export default function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
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

  return (
    <Link
      href={`/mobile/work-orders/${workOrder.id}`}
      className="block p-4 bg-white rounded-lg shadow border border-gray-200 mb-4"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">
            {workOrder.equipment?.placa || 'Sin equipo'}
          </h3>
          <p className="text-sm text-gray-600">{workOrder.type}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(workOrder.status)}`}>
          {workOrder.status}
        </span>
      </div>
      {workOrder.clients && (
        <p className="text-sm text-gray-500">
          {workOrder.clients.nombre_comercial || workOrder.equipment?.codigo}
        </p>
      )}
      {workOrder.scheduled_date && (
        <p className="text-sm text-gray-500 mt-1">
          {new Date(workOrder.scheduled_date).toLocaleDateString('es-ES')}
        </p>
      )}
    </Link>
  );
}

