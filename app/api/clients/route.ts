import { NextRequest } from 'next/server';
import { listHandler, createHandler } from '@/lib/api/handlers';
import { createClientSchema, clientQuerySchema } from '@/lib/validations/clients';

export async function GET(request: NextRequest) {
  return listHandler(request, {
    table: 'clients',
    allowedFilters: ['codigo', 'ciudad', 'provincia'],
    defaultLimit: 100,
  });
}

export async function POST(request: NextRequest) {
  return createHandler(request, {
    table: 'clients',
    schema: createClientSchema,
  });
}

