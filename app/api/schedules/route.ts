import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const searchParams = request.nextUrl.searchParams;
    
    const equipmentId = searchParams.get('equipment_id');
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('schedules')
      .select(`
        *,
        equipment (
          id,
          placa,
          codigo,
          modelo,
          marca
        )
      `)
      .order('next_maintenance_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
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
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('schedules')
      .insert(body)
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

