'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Client } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchClient();
    }
  }, [params.id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch client');
      }

      setClient(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><p>Cargando...</p></div>;
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Error: {error || 'Cliente no encontrado'}</div>
        <Link href="/clients">
          <Button variant="outline">Volver a la lista</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="sm">← Volver</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cliente: {client.nombre_comercial || client.codigo}
          </h1>
          <p className="text-muted-foreground">Detalles del cliente</p>
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
                <dt className="text-sm font-medium text-muted-foreground">Código</dt>
                <dd className="mt-1">{client.codigo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nombre Comercial</dt>
                <dd className="mt-1">{client.nombre_comercial || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Dirección</dt>
                <dd className="mt-1">{client.direccion || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Ciudad</dt>
                <dd className="mt-1">{client.ciudad || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Provincia</dt>
                <dd className="mt-1">{client.provincia || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto y Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contacto Responsable</dt>
                <dd className="mt-1">{client.contacto_responsable || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Horarios de Atención</dt>
                <dd className="mt-1">{client.horarios_atencion || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">GPS</dt>
                <dd className="mt-1">
                  {client.gps_latitud && client.gps_longitud ? (
                    <a
                      href={`https://www.google.com/maps?q=${client.gps_latitud},${client.gps_longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.gps_latitud}, {client.gps_longitud}
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

