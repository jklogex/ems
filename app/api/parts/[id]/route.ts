import { NextRequest } from 'next/server';
import { readHandler, updateHandler, deleteHandler } from '@/lib/api/handlers';
import { updatePartSchema } from '@/lib/validations/parts';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return readHandler(request, params, {
    table: 'parts',
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler(request, params, {
    table: 'parts',
    schema: updatePartSchema,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteHandler(request, params, {
    table: 'parts',
  });
}

