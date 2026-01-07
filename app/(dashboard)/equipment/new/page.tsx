'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEquipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    placa: '',
    codigo: '',
    modelo: '',
    marca: '',
    serie: '',
    longitud: '',
    latitud: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
      };

      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create equipment');
      }

      router.push(`/equipment/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Equipo</h1>
        <p className="text-muted-foreground">Registrar un nuevo equipo de frío</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Equipo</CardTitle>
          <CardDescription>Complete los datos del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="placa">PLACA *</Label>
                <Input
                  id="placa"
                  type="text"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  required
                />
              </div>

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
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  type="text"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  type="text"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serie">Serie</Label>
                <Input
                  id="serie"
                  type="text"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitud">Latitud</Label>
                <Input
                  id="latitud"
                  type="number"
                  step="any"
                  value={formData.latitud}
                  onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitud">Longitud</Label>
                <Input
                  id="longitud"
                  type="number"
                  step="any"
                  value={formData.longitud}
                  onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/equipment')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

