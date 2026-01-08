import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('work_order_items')
      .select('*')
      .eq('work_order_id', params.id)
      .order('order_index', { ascending: true });

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

    const items = Array.isArray(body) ? body : [body];

    const itemsWithWorkOrder = items.map((item: Record<string, unknown>) => ({
      ...item,
      work_order_id: params.id,
    }));

    const { data, error } = await supabase
      .from('work_order_items')
      .insert(itemsWithWorkOrder)
      .select();

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    // Update multiple items
    if (Array.isArray(body)) {
      const updates = body.map((item: { id: string; [key: string]: unknown }) =>
        supabase
          .from('work_order_items')
          .update(item)
          .eq('id', item.id)
          .eq('work_order_id', params.id)
      );

      await Promise.all(updates);
      return NextResponse.json({ success: true });
    }

    // Update single item
    const { itemId, ...updateData } = body;
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('work_order_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('work_order_id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

