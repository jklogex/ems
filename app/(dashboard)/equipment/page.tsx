'use client';

import { useState } from 'react';
import EquipmentTable from '@/components/EquipmentTable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EquipmentPage() {
  const [searchParams, setSearchParams] = useState({
    placa: '',
    codigo: '',
    region: '',
    status: '',
    type: '',
    warehouse: '',
  });
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    totalRows?: number;
    successful?: number;
    failed?: number;
    error?: string;
    errors?: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by EquipmentTable component via props
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/equipment', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        setShowImport(false);
        setImportFile(null);
        // Refresh the table
        window.location.reload();
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipos</h1>
            <p className="text-muted-foreground">Gestionar y mantener equipos de frío</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowImport(!showImport)}
              variant="outline"
            >
              Importar CSV
            </Button>
            <Link href="/equipment/new">
              <Button>Nuevo Equipo</Button>
            </Link>
          </div>
        </div>

        {showImport && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Importar Equipos desde CSV</CardTitle>
              <CardDescription>Sube un archivo CSV con el formato de ef.csv</CardDescription>
            </CardHeader>
            <CardContent>
            <h2 className="text-xl font-semibold mb-4">Importar Equipos desde CSV</h2>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!importFile || importing}
              >
                {importing ? 'Importando...' : 'Importar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImport(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
              >
                Cancelar
              </Button>
              </div>
              {importResult && (
                <div className={`p-4 rounded ${
                  importResult.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {importResult.success ? (
                    <div>
                      <p>Importación exitosa!</p>
                      <p>Total: {importResult.totalRows} filas</p>
                      <p>Exitosas: {importResult.successful}</p>
                      {importResult.failed > 0 && (
                        <p>Fallidas: {importResult.failed}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>Error en la importación</p>
                      {importResult.error && <p>{importResult.error}</p>}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p>Errores:</p>
                          <ul className="list-disc list-inside">
                            {importResult.errors.slice(0, 10).map((err: any, idx: number) => (
                              <li key={idx}>Fila {err.row}: {err.error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">PLACA</label>
              <input
                type="text"
                value={searchParams.placa}
                onChange={(e) => setSearchParams({ ...searchParams, placa: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Buscar por PLACA"
              />
            </div>
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
              <label className="block text-sm font-medium mb-1">Región</label>
              <input
                type="text"
                value={searchParams.region}
                onChange={(e) => setSearchParams({ ...searchParams, region: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Filtrar por región"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <input
                type="text"
                value={searchParams.status}
                onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Filtrar por estado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={searchParams.type}
                onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="COOLER">COOLER</option>
                <option value="DRAUGHT">DRAUGHT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bodega</label>
              <input
                type="text"
                value={searchParams.warehouse}
                onChange={(e) => setSearchParams({ ...searchParams, warehouse: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Filtrar por bodega"
              />
            </div>
          </form>
          </CardContent>
        </Card>

        <EquipmentTable searchParams={searchParams} />
      </div>
    </div>
  );
}

