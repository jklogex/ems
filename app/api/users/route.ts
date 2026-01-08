import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServiceClient } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseServiceClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, region, created_at, updated_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, role, region, password } = body;

    // Validation
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, nombre y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'coordinator_national', 'coordinator_regional', 'technician', 'warehouse', 'auditor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash password if provided
    let password_hash = null;
    if (password && password.length >= 6) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        role,
        region: region || null,
        password_hash,
      })
      .select('id, email, name, role, region, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
