'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapPopupProps {
  equipmentId: string;
  lng: number;
  lat: number;
  onClose: () => void;
}

interface EquipmentData {
  id: string;
  placa: string;
  codigo: string;
  modelo: string | null;
  marca: string | null;
  status_neveras: string | null;
  coolers_froster: string | null;
  region_taller: string | null;
  ubicacion: string | null;
  clients?: {
    nombre_comercial: string | null;
    ciudad: string | null;
    provincia: string | null;
  } | null;
}

export function MapPopup({ equipmentId, lng, lat, onClose }: MapPopupProps) {
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/map/equipment/${equipmentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEquipment(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-[300px] z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Cargando...</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Equipo: {equipment.placa}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Código:</span> {equipment.codigo}
        </div>
        {equipment.modelo && (
          <div>
            <span className="font-medium">Modelo:</span> {equipment.modelo}
          </div>
        )}
        {equipment.marca && (
          <div>
            <span className="font-medium">Marca:</span> {equipment.marca}
          </div>
        )}
        {equipment.status_neveras && (
          <div>
            <span className="font-medium">Estado:</span> {equipment.status_neveras}
          </div>
        )}
        {equipment.coolers_froster && (
          <div>
            <span className="font-medium">Tipo:</span> {equipment.coolers_froster}
          </div>
        )}
        {equipment.region_taller && (
          <div>
            <span className="font-medium">Región:</span> {equipment.region_taller}
          </div>
        )}
        {equipment.clients && (
          <div className="pt-2 border-t">
            <div className="font-medium mb-1">Cliente:</div>
            {equipment.clients.nombre_comercial && (
              <div>{equipment.clients.nombre_comercial}</div>
            )}
            {equipment.clients.ciudad && (
              <div className="text-muted-foreground">{equipment.clients.ciudad}</div>
            )}
            {equipment.clients.provincia && (
              <div className="text-muted-foreground">{equipment.clients.provincia}</div>
            )}
          </div>
        )}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = `/equipment/${equipment.id}`;
            }}
          >
            Ver Detalles
          </Button>
        </div>
      </div>
    </div>
  );
}
