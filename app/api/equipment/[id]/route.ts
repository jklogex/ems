import { NextRequest } from 'next/server';
import { readHandler, updateHandler, deleteHandler } from '@/lib/api/handlers';
import { updateEquipmentSchema } from '@/lib/validations/equipment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return readHandler(request, params, {
    table: 'equipment',
    select: `
      *,
      clients (
        id,
        codigo,
        nombre_comercial,
        direccion,
        ciudad,
        provincia,
        contacto_responsable
      )
    `,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler(request, params, {
    table: 'equipment',
    schema: updateEquipmentSchema,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteHandler(request, params, {
    table: 'equipment',
  });
}

