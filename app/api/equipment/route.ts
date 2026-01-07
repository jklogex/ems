import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/client';
import { importEquipmentFromCSV } from '@/lib/utils/import';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    const placa = searchParams.get('placa');
    const codigo = searchParams.get('codigo');
    const region = searchParams.get('region');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const warehouse = searchParams.get('warehouse');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('equipment')
      .select(`
        *,
        clients (
          id,
          codigo,
          nombre_comercial,
          ciudad,
          provincia
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (placa) {
      query = query.ilike('placa', `%${placa}%`);
    }
    if (codigo) {
      query = query.ilike('codigo', `%${codigo}%`);
    }
    if (region) {
      query = query.eq('region_taller', region);
    }
    if (status) {
      query = query.eq('status_neveras', status);
    }
    if (type) {
      query = query.eq('coolers_froster', type);
    }
    if (warehouse) {
      query = query.eq('bodega_nueva', warehouse);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle CSV file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const csvContent = await file.text();
      const userId = formData.get('userId') as string | null;
      
      const result = await importEquipmentFromCSV(csvContent, userId || undefined);
      
      return NextResponse.json(result);
    } else {
      // Handle JSON equipment creation
      const body = await request.json();
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase
        .from('equipment')
        .insert(body)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

