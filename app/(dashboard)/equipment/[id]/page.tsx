'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import EquipmentLocationHistory from '@/components/EquipmentLocationHistory';
import type { Equipment } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EquipmentDetailPage() {
  const params = useParams();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchEquipment();
    }
  }, [params.id]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/equipment/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch equipment');
      }

      setEquipment(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><p>Cargando...</p></div>;
  }

  if (error || !equipment) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Error: {error || 'Equipo no encontrado'}</div>
        <Link href="/equipment">
          <Button variant="outline">Volver a la lista</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/equipment">
          <Button variant="ghost" size="sm">← Volver</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipo: {equipment.placa}</h1>
          <p className="text-muted-foreground">Detalles del equipo</p>
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
                <dt className="text-sm font-medium text-muted-foreground">PLACA</dt>
                <dd className="mt-1">{equipment.placa}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Código</dt>
                <dd className="mt-1">{equipment.codigo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Serie</dt>
                <dd className="mt-1">{equipment.serie || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Modelo</dt>
                <dd className="mt-1">{equipment.modelo || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Marca</dt>
                <dd className="mt-1">{equipment.marca || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tipo</dt>
                <dd className="mt-1">{equipment.coolers_froster || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-1">{equipment.status_neveras || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Cliente</dt>
                <dd className="mt-1">{(equipment as Equipment & { clients?: { nombre_comercial?: string } }).clients?.nombre_comercial || equipment.codigo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Región</dt>
                <dd className="mt-1">{equipment.region_taller || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Bodega</dt>
                <dd className="mt-1">{equipment.bodega_nueva || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">GPS</dt>
                <dd className="mt-1">
                  {equipment.latitud && equipment.longitud ? (
                    <a
                      href={`https://www.google.com/maps?q=${equipment.latitud},${equipment.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {equipment.latitud}, {equipment.longitud}
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Última actualización</dt>
                <dd className="mt-1">
                  {equipment.location_changed_at
                    ? new Date(equipment.location_changed_at).toLocaleString('es-ES')
                    : '-'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Ubicaciones</CardTitle>
          <CardDescription>Registro completo de cambios de ubicación</CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentLocationHistory equipmentId={equipment.id} />
        </CardContent>
      </Card>
    </div>
  );
}

