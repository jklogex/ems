import { NextRequest } from 'next/server';
import { listHandler, createHandler } from '@/lib/api/handlers';
import { createPartSchema } from '@/lib/validations/parts';

export async function GET(request: NextRequest) {
  return listHandler(request, {
    table: 'parts',
    allowedFilters: ['codigo', 'nombre'],
    defaultLimit: 100,
  });
}

export async function POST(request: NextRequest) {
  return createHandler(request, {
    table: 'parts',
    schema: createPartSchema,
  });
}

