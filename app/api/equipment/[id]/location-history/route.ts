import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    let query = supabase
      .from('equipment_location_history')
      .select(`
        *,
        clients (
          id,
          codigo,
          nombre_comercial,
          ciudad,
          provincia
        ),
        users:moved_by (
          id,
          name,
          email
        )
      `)
      .eq('equipment_id', params.id)
      .order('start_date', { ascending: false });

    // If date is provided, find location at that specific date
    if (date) {
      query = query
        .lte('start_date', date)
        .or(`end_date.is.null,end_date.gte.${date}`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If date is provided, return only the location at that date
    if (date && data) {
      const locationAtDate = data.find(
        (loc) =>
          loc.start_date <= date &&
          (loc.end_date === null || loc.end_date >= date)
      );
      return NextResponse.json({ data: locationAtDate || null });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

