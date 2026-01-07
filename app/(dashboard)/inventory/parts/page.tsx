'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Part {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  modelo: string | null;
  unidad_medida: string;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchParts();
  }, [searchTerm]);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('nombre', searchTerm);
      }

      const response = await fetch(`/api/parts?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch parts');
      }

      setParts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && parts.length === 0) {
    return <div className="space-y-6"><p>Cargando repuestos...</p></div>;
  }

  if (error) {
    return <div className="space-y-6"><p className="text-destructive">Error: {error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Repuestos</h1>
          <p className="text-muted-foreground">Gestionar repuestos y partes</p>
        </div>
        <Link
          href="/inventory/parts/new"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Nuevo Repuesto
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded"
          placeholder="Buscar repuesto por nombre..."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Marca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Unidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {parts.map((part) => (
              <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {part.codigo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {part.nombre}
                </td>
                <td className="px-6 py-4 text-sm">
                  {part.descripcion || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {part.marca || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {part.unidad_medida}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/inventory/parts/${part.id}`}
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

