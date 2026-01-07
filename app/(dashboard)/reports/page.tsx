'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface KPIData {
  totalEquipment: number;
  operationalEquipment: number;
  preventiveCompliance: number;
  mttr: number;
  mtbf: number;
  technicianProductivity: Array<{
    technician: string;
    completed: number;
  }>;
}

export default function ReportsPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/kpis');
      const result = await response.json();

      if (response.ok) {
        setKpis({
          totalEquipment: result.data.equipmentStatus.total,
          operationalEquipment: result.data.equipmentStatus.operational,
          preventiveCompliance: result.data.preventiveCompliance,
          mttr: result.data.mttr,
          mtbf: 0, // Would need equipment-specific calculation
          technicianProductivity: [],
        });
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><p>Cargando reportes...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y KPIs</h1>
        <p className="text-muted-foreground">Métricas y análisis del sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis?.operationalEquipment || 0} / {kpis?.totalEquipment || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis?.totalEquipment
                ? Math.round(((kpis.operationalEquipment || 0) / kpis.totalEquipment) * 100)
                : 0}% operativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento Preventivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.preventiveCompliance || 0}%</div>
            <p className="text-xs text-muted-foreground">Mantenimientos cumplidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.mttr?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">Horas promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTBF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.mtbf?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">Horas promedio</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productividad por Técnico</CardTitle>
          <CardDescription>Análisis de productividad del equipo técnico</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidad de reportes en desarrollo</p>
        </CardContent>
      </Card>
    </div>
  );
}

