import { NextRequest } from 'next/server';
import { listHandler, createHandler } from '@/lib/api/handlers';
import { warehouseSchema } from '@/lib/validations/inventory';

export async function GET(request: NextRequest) {
  return listHandler(request, {
    table: 'warehouses',
    allowedFilters: ['region'],
    defaultLimit: 100,
  });
}

export async function POST(request: NextRequest) {
  return createHandler(request, {
    table: 'warehouses',
    schema: warehouseSchema,
  });
}

