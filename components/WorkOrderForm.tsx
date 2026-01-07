'use client';

import { useState, useEffect } from 'react';
import type { Equipment } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkOrderFormProps {
  workOrderId?: string;
  equipmentId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function WorkOrderForm({ workOrderId, equipmentId, onSave, onCancel }: WorkOrderFormProps) {
  const [formData, setFormData] = useState({
    type: 'inspection',
    equipment_id: equipmentId || '',
    priority: 'medium',
    sla_hours: '',
    technician_id: '',
    status: 'created',
    scheduled_date: '',
    diagnosis: '',
    actions_performed: '',
    notes: '',
  });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
    if (workOrderId) {
      fetchWorkOrder();
    }
  }, [workOrderId]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment?limit=1000');
      const result = await response.json();
      if (response.ok) {
        setEquipment(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/work-orders/${workOrderId}`);
      const result = await response.json();
      if (response.ok) {
        setFormData({
          type: result.data.type,
          equipment_id: result.data.equipment_id,
          priority: result.data.priority,
          sla_hours: result.data.sla_hours?.toString() || '',
          technician_id: result.data.technician_id || '',
          status: result.data.status,
          scheduled_date: result.data.scheduled_date || '',
          diagnosis: result.data.diagnosis || '',
          actions_performed: result.data.actions_performed || '',
          notes: result.data.notes || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading work order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        sla_hours: formData.sla_hours ? parseInt(formData.sla_hours) : null,
      };

      const url = workOrderId ? `/api/work-orders/${workOrderId}` : '/api/work-orders';
      const method = workOrderId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save work order');
      }

      if (onSave) {
        onSave();
      } else {
        window.location.href = `/work-orders/${result.data.id}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && workOrderId) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la Orden de Trabajo</CardTitle>
        <CardDescription>Complete la información de la orden</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspection">Inspección</SelectItem>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="emergency">Emergencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipo *</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value: string) => setFormData({ ...formData, equipment_id: value })}
                required
              >
                <SelectTrigger id="equipment_id">
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.placa} - {eq.modelo || eq.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
                required
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla_hours">SLA (horas)</Label>
              <Input
                id="sla_hours"
                type="number"
                value={formData.sla_hours}
                onChange={(e) => setFormData({ ...formData, sla_hours: e.target.value })}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Creada</SelectItem>
                  <SelectItem value="assigned">Asignada</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha Programada</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actions_performed">Acciones Realizadas</Label>
            <textarea
              id="actions_performed"
              value={formData.actions_performed}
              onChange={(e) => setFormData({ ...formData, actions_performed: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

