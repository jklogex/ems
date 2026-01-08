import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('work_order_parts')
      .select(`
        *,
        parts (
          id,
          codigo,
          nombre,
          descripcion
        ),
        warehouses (
          id,
          nombre,
          codigo
        )
      `)
      .eq('work_order_id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    const parts = Array.isArray(body) ? body : [body];

    const partsWithWorkOrder = parts.map((item: Record<string, unknown>) => ({
      ...item,
      work_order_id: params.id,
    }));

    const { data, error } = await supabase
      .from('work_order_parts')
      .insert(partsWithWorkOrder)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update inventory (reduce stock)
    for (const part of parts) {
      if (part.warehouse_id && part.part_id && part.quantity) {
        // Get current inventory
        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('warehouse_id', part.warehouse_id)
          .eq('part_id', part.part_id)
          .single();

        if (inventory) {
          const newQuantity = inventory.quantity - part.quantity;
          await supabase
            .from('inventory')
            .update({ quantity: newQuantity })
            .eq('warehouse_id', part.warehouse_id)
            .eq('part_id', part.part_id);

          // Record inventory movement
          await supabase.from('inventory_movements').insert({
            warehouse_id: part.warehouse_id,
            part_id: part.part_id,
            type: 'consumption',
            quantity: -part.quantity,
            work_order_id: params.id,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

