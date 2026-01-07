import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        equipment (
          id,
          placa,
          codigo,
          modelo,
          marca,
          longitud,
          latitud,
          clients (
            id,
            codigo,
            nombre_comercial,
            direccion,
            ciudad,
            provincia
          )
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
        ),
        work_order_items (*),
        work_order_evidence (*),
        work_order_parts (
          *,
          parts (
            id,
            codigo,
            nombre
          ),
          warehouses (
            id,
            nombre
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
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
    const supabase = getSupabaseServerClient();

    // If status is being updated to 'closed', set end_time
    if (body.status === 'closed' && !body.end_time) {
      body.end_time = new Date().toISOString();
    }

    // If status is being updated to 'in_progress', set start_time
    if (body.status === 'in_progress' && !body.start_time) {
      body.start_time = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('work_orders')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If technician is being assigned, create assignment record
    if (body.technician_id) {
      const { data: existingAssignment } = await supabase
        .from('technician_assignments')
        .select('id')
        .eq('work_order_id', params.id)
        .single();

      if (!existingAssignment) {
        await supabase.from('technician_assignments').insert({
          work_order_id: params.id,
          technician_id: body.technician_id,
          assigned_by: body.updated_by || null,
        });
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

