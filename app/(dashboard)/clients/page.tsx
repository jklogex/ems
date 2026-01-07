'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Client } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    codigo: '',
    ciudad: '',
    provincia: '',
  });
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchClients();
  }, [page, searchParams]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
        ...Object.fromEntries(
          Object.entries(searchParams).filter(([_, v]) => v !== '')
        ),
      });

      const response = await fetch(`/api/clients?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch clients');
      }

      setClients(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && clients.length === 0) {
    return <div className="space-y-6"><p>Cargando clientes...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-destructive">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Gestionar clientes y tiendas</p>
        </div>
        <Link href="/clients/new">
          <Button>Nuevo Cliente</Button>
        </Link>
      </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input
                type="text"
                value={searchParams.codigo}
                onChange={(e) => setSearchParams({ ...searchParams, codigo: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Buscar por código"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad</label>
              <input
                type="text"
                value={searchParams.ciudad}
                onChange={(e) => setSearchParams({ ...searchParams, ciudad: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Filtrar por ciudad"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provincia</label>
              <input
                type="text"
                value={searchParams.provincia}
                onChange={(e) => setSearchParams({ ...searchParams, provincia: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Filtrar por provincia"
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
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Nombre Comercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Provincia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  GPS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {client.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {client.nombre_comercial || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {client.ciudad || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {client.provincia || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {client.gps_latitud && client.gps_longitud
                      ? `${client.gps_latitud.toFixed(6)}, ${client.gps_longitud.toFixed(6)}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/clients/${client.id}`}
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

