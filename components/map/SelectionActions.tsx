'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Route, FileText, X } from 'lucide-react';

interface SelectionActionsProps {
  selectedCount: number;
  onExport: () => void;
  onGenerateRoute: () => void;
  onCreateWorkOrders: () => void;
  onClearSelection: () => void;
}

export function SelectionActions({
  selectedCount,
  onExport,
  onGenerateRoute,
  onCreateWorkOrders,
  onClearSelection,
}: SelectionActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{selectedCount} Equipos Seleccionados</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar (CSV/JSON)
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onGenerateRoute}
        >
          <Route className="h-4 w-4 mr-2" />
          Generar Ruta
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onCreateWorkOrders}
        >
          <FileText className="h-4 w-4 mr-2" />
          Crear Órdenes de Trabajo
        </Button>
      </CardContent>
    </Card>
  );
}
