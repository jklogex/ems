import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    const warehouseId = searchParams.get('warehouse_id');
    const partId = searchParams.get('part_id');
    const lowStock = searchParams.get('low_stock') === 'true';

    let query = supabase
      .from('inventory')
      .select(`
        *,
        warehouses (
          id,
          nombre,
          codigo
        ),
        parts (
          id,
          codigo,
          nombre,
          descripcion
        )
      `);

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }
    if (partId) {
      query = query.eq('part_id', partId);
    }

    const { data, error } = await query;
    
    // Filter low stock items in JavaScript since Supabase doesn't support column comparison
    let filteredData = data || [];
    if (lowStock) {
      filteredData = filteredData.filter((item: any) => item.quantity <= item.min_stock);
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServerClient();

    // Handle bulk update
    if (Array.isArray(body)) {
      const updates = body.map((item) =>
        supabase
          .from('inventory')
          .upsert(item, {
            onConflict: 'warehouse_id,part_id',
          })
      );

      await Promise.all(updates);
      return NextResponse.json({ success: true });
    }

    // Single update
    const { data, error } = await supabase
      .from('inventory')
      .upsert(body, {
        onConflict: 'warehouse_id,part_id',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

