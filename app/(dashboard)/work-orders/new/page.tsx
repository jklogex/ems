'use client';

import { useRouter } from 'next/navigation';
import WorkOrderForm from '@/components/WorkOrderForm';

export default function NewWorkOrderPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/work-orders');
  };

  const handleCancel = () => {
    router.push('/work-orders');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h1>
        <p className="text-muted-foreground">Crear una nueva orden de trabajo</p>
      </div>
      <WorkOrderForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}

