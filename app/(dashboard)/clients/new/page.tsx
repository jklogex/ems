'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre_comercial: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    gps_longitud: '',
    gps_latitud: '',
    contacto_responsable: '',
    horarios_atencion: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        gps_longitud: formData.gps_longitud ? parseFloat(formData.gps_longitud) : null,
        gps_latitud: formData.gps_latitud ? parseFloat(formData.gps_latitud) : null,
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client');
      }

      router.push(`/clients/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
        <p className="text-muted-foreground">Registrar un nuevo cliente o tienda</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>Complete los datos del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
                <Input
                  id="nombre_comercial"
                  type="text"
                  value={formData.nombre_comercial}
                  onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  type="text"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_latitud">Latitud GPS</Label>
                <Input
                  id="gps_latitud"
                  type="number"
                  step="any"
                  value={formData.gps_latitud}
                  onChange={(e) => setFormData({ ...formData, gps_latitud: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps_longitud">Longitud GPS</Label>
                <Input
                  id="gps_longitud"
                  type="number"
                  step="any"
                  value={formData.gps_longitud}
                  onChange={(e) => setFormData({ ...formData, gps_longitud: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto_responsable">Contacto Responsable</Label>
                <Input
                  id="contacto_responsable"
                  type="text"
                  value={formData.contacto_responsable}
                  onChange={(e) => setFormData({ ...formData, contacto_responsable: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horarios_atencion">Horarios de Atención</Label>
                <Input
                  id="horarios_atencion"
                  type="text"
                  value={formData.horarios_atencion}
                  onChange={(e) => setFormData({ ...formData, horarios_atencion: e.target.value })}
                  placeholder="Ej: Lunes a Viernes 8:00-18:00"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/clients')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

