import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    const codigo = searchParams.get('codigo');
    const ciudad = searchParams.get('ciudad');
    const provincia = searchParams.get('provincia');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (codigo) {
      query = query.ilike('codigo', `%${codigo}%`);
    }
    if (ciudad) {
      query = query.ilike('ciudad', `%${ciudad}%`);
    }
    if (provincia) {
      query = query.ilike('provincia', `%${provincia}%`);
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
      .from('clients')
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

