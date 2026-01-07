import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    const equipmentId = searchParams.get('equipment_id');
    const technicianId = searchParams.get('technician_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('work_orders')
      .select(`
        *,
        equipment (
          id,
          placa,
          codigo,
          modelo,
          marca
        ),
        technician:users!technician_id (
          id,
          name,
          email
        ),
        creator:users!created_by (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId);
    }
    if (technicianId) {
      query = query.eq('technician_id', technicianId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate);
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
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('work_orders')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If technician is assigned, create assignment record
    if (body.technician_id) {
      await supabase.from('technician_assignments').insert({
        work_order_id: data.id,
        technician_id: body.technician_id,
        assigned_by: body.created_by || null,
      });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

