import { NextRequest } from 'next/server';
import { listHandler, createHandler } from '@/lib/api/handlers';
import { createEquipmentSchema } from '@/lib/validations/equipment';
import { importEquipmentFromCSV } from '@/lib/utils/import';
import { successResponse, badRequestResponse } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  return listHandler(request, {
    table: 'equipment',
    select: `
      *,
      clients (
        id,
        codigo,
        nombre_comercial,
        ciudad,
        provincia
      )
    `,
    allowedFilters: ['placa', 'codigo', 'region', 'status', 'type', 'warehouse'],
    defaultLimit: 100,
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle CSV file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return badRequestResponse('No file provided');
      }

      const csvContent = await file.text();
      const userId = formData.get('userId') as string | null;
      
      const result = await importEquipmentFromCSV(csvContent, userId || undefined);
      
      return successResponse(result);
    } else {
      // Handle JSON equipment creation
      return createHandler(request, {
        table: 'equipment',
        schema: createEquipmentSchema,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

