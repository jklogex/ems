import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    const {
      client_id,
      longitud,
      latitud,
      ubicacion,
      ubicacion_especifica,
      region_taller,
      bodega_nueva,
      reason,
      notes,
      moved_by,
    } = body;

    // Get current location history record
    const { data: currentLocation } = await supabase
      .from('equipment_location_history')
      .select('id')
      .eq('equipment_id', params.id)
      .is('end_date', null)
      .single();

    // Close current location record
    if (currentLocation) {
      await supabase
        .from('equipment_location_history')
        .update({ end_date: new Date().toISOString().split('T')[0] })
        .eq('id', currentLocation.id);
    }

    // Create new location history record
    const { data: newLocation, error: locationError } = await supabase
      .from('equipment_location_history')
      .insert({
        equipment_id: params.id,
        client_id,
        longitud,
        latitud,
        ubicacion,
        ubicacion_especifica,
        region_taller,
        bodega_nueva,
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        moved_by,
        reason,
        notes,
      })
      .select()
      .single();

    if (locationError) {
      return NextResponse.json({ error: locationError.message }, { status: 400 });
    }

    // Update equipment current location
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .update({
        current_client_id: client_id,
        longitud,
        latitud,
        region_taller,
        bodega_nueva,
        location_changed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (equipmentError) {
      return NextResponse.json({ error: equipmentError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        equipment,
        location_history: newLocation,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

