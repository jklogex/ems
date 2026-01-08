import { NextRequest } from 'next/server';
import { readHandler, updateHandler, deleteHandler } from '@/lib/api/handlers';
import { updateClientSchema } from '@/lib/validations/clients';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return readHandler(request, params, {
    table: 'clients',
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler(request, params, {
    table: 'clients',
    schema: updateClientSchema,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteHandler(request, params, {
    table: 'clients',
  });
}

