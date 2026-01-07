'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { syncPendingOperations, isOnline, registerOnlineHandler } from '@/lib/offline/sync';
import { getWorkOrders, saveWorkOrder } from '@/lib/offline/db';

export default function MobilePage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setOnline(isOnline());
    loadWorkOrders();

    registerOnlineHandler(() => {
      setOnline(true);
      handleSync();
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      
      if (online) {
        // Fetch from API
        const response = await fetch('/api/work-orders?status=assigned,in_progress&limit=50');
        const result = await response.json();
        
        if (response.ok) {
          setWorkOrders(result.data || []);
          
          // Save to IndexedDB for offline access
          for (const wo of result.data || []) {
            await saveWorkOrder(wo);
          }
        }
      } else {
        // Load from IndexedDB
        const offlineOrders = await getWorkOrders();
        setWorkOrders(offlineOrders);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!online) return;
    
    setSyncing(true);
    try {
      const result = await syncPendingOperations();
      console.log('Sync result:', result);
      await loadWorkOrders();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Órdenes de Trabajo</h1>
          <div className="flex items-center justify-between">
            <div className={`px-3 py-1 rounded-full text-sm ${
              online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {online ? 'En línea' : 'Sin conexión'}
            </div>
            {online && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {workOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay órdenes de trabajo asignadas
            </div>
          ) : (
            workOrders.map((wo) => (
              <Link
                key={wo.id}
                href={`/mobile/work-orders/${wo.id}`}
                className="block p-4 bg-white rounded-lg shadow border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {wo.equipment?.placa || 'Sin equipo'}
                    </h3>
                    <p className="text-sm text-gray-600">{wo.type}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    wo.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    wo.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {wo.status}
                  </span>
                </div>
                {wo.equipment?.clients && (
                  <p className="text-sm text-gray-500">
                    {wo.equipment.clients.nombre_comercial || wo.equipment.clients.codigo}
                  </p>
                )}
                {wo.scheduled_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(wo.scheduled_date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

